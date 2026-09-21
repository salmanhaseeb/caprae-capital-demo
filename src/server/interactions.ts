import "server-only";
import type { DemoSession } from "@/lib/demo-identities";
import { InteractionValidationError, DoNotContactConfirmationRequired, parseInteraction, type InteractionInput } from "@/lib/interactions";
import { analyzeRelationship, validateAnalysis, analysisColumns, type RelationshipAnalysis } from "./relationship-analysis";
import { inOrganization } from "./tenant";
import type { Interaction } from "@/generated/prisma/client";

function verifyRetry(saved: Interaction, session: DemoSession, input: InteractionInput) {
  if (saved.userId !== session.userId || saved.companyId !== input.companyId || saved.rawNotes !== input.rawNotes || saved.contactName !== (input.contactName || null) || saved.interactionType !== input.interactionType)
    throw new InteractionValidationError("This form was already used. Reopen it to log a new interaction.");
  return { id: saved.id, companyId: saved.companyId, analysisFailed: saved.analysisFailed };
}

export async function logInteraction(
  session: DemoSession,
  untrustedInput: unknown,
  // Server-only dependency injection for deterministic tests; never a client option.
  analyze: typeof analyzeRelationship = analyzeRelationship,
) {
  const input = parseInteraction(untrustedInput);
  const existing = await inOrganization(session, async (tx) => {
    const company = await tx.company.findUnique({ where: { id: input.companyId }, select: { id: true } });
    if (!company) throw new InteractionValidationError("This company no longer exists. Return to Search Leads and try again.");
    const saved = await tx.interaction.findUnique({ where: { organizationId_id: { organizationId: session.organizationId, id: input.requestId } } });
    if (saved) return saved;
    const suppressed = await tx.interaction.findFirst({
      where: { organizationId: session.organizationId, companyId: input.companyId, relationshipStatus: "DO_NOT_CONTACT" },
      select: { id: true },
    });
    if (suppressed && input.confirmDoNotContact !== true) throw new DoNotContactConfirmationRequired();
    return null;
  });
  if (existing) return verifyRetry(existing, session, input);

  // No database transaction or tenant history is held/sent during the external call.
  let analysis: RelationshipAnalysis | null = null;
  try {
    analysis = validateAnalysis(await analyze({ rawNotes: input.rawNotes, contactName: input.contactName, interactionType: input.interactionType }));
  } catch {
    // Configuration, timeout, refusal and malformed responses must not lose raw notes.
  }
  return inOrganization(session, async (tx) => {
    const suppressed = await tx.interaction.findFirst({
      where: { organizationId: session.organizationId, companyId: input.companyId, relationshipStatus: "DO_NOT_CONTACT" },
      select: { id: true },
    });
    if (suppressed && input.confirmDoNotContact !== true) throw new DoNotContactConfirmationRequired();
    const previous = await tx.interaction.findFirst({
      where: { organizationId: session.organizationId, companyId: input.companyId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const doNotContact = !!suppressed || analysis?.relationshipStatus === "DO_NOT_CONTACT";
    const columns = analysis ? analysisColumns(analysis, new Date()) : {
      aiSummary: null,
      relationshipStatus: previous?.relationshipStatus ?? "CONTACTED",
      sellerReadiness: previous?.sellerReadiness ?? "UNKNOWN",
      sentiment: "UNKNOWN" as const,
      successionSignal: "UNKNOWN" as const,
      recommendedAction: null,
      nextFollowUpAt: previous?.nextFollowUpAt ?? null,
    };
    await tx.interaction.createMany({
      data: {
        ...columns,
        analysisFailed: analysis === null,
        doNotContactConfirmedAt: suppressed && input.confirmDoNotContact === true ? new Date() : null,
        id: input.requestId,
        organizationId: session.organizationId,
        userId: session.userId,
        companyId: input.companyId,
        interactionType: input.interactionType,
        contactName: input.contactName || null,
        rawNotes: input.rawNotes,
        relationshipStatus: doNotContact ? "DO_NOT_CONTACT" : columns.relationshipStatus,
        recommendedAction: doNotContact ? "Do not contact. Outreach is suppressed for this organization." : columns.recommendedAction,
        nextFollowUpAt: doNotContact ? null : columns.nextFollowUpAt,
      },
      skipDuplicates: true,
    });
    const saved = await tx.interaction.findUnique({ where: { organizationId_id: { organizationId: session.organizationId, id: input.requestId } } });
    if (!saved) throw new InteractionValidationError("This form was already used. Reopen it to log a new interaction.");
    return verifyRetry(saved, session, input);
  });
}
