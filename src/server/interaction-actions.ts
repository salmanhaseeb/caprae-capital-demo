"use server";
import { revalidatePath } from "next/cache";
import { InteractionValidationError, DoNotContactConfirmationRequired } from "@/lib/interactions";
import { getDemoSession, DemoSessionError } from "./demo-session";
import { RelationshipAnalysisError } from "./relationship-analysis";
import { logInteraction } from "./interactions";
import { TenantAccessError } from "./tenant";
export async function saveInteraction(
  input: unknown,
  expectedOrganizationId: string,
) {
  let saved: Awaited<ReturnType<typeof logInteraction>>;
  try {
    const session = await getDemoSession();
    if (session.organizationId !== expectedOrganizationId)
      return {
        success: false as const,
        error:
          "Your workspace changed. Close this form and reopen it in the current organization.",
      };
    saved = await logInteraction(session, input);
  } catch (cause) {
    return {
      success: false as const,
      requiresConfirmation: cause instanceof DoNotContactConfirmationRequired,
      error:
        cause instanceof InteractionValidationError ||
        cause instanceof RelationshipAnalysisError ||
        cause instanceof DemoSessionError ||
        cause instanceof TenantAccessError
          ? cause.message
          : "The interaction could not be saved. Please try again.",
    };
  }
  revalidatePath(`/companies/${saved.companyId}`);
  revalidatePath("/");
  revalidatePath("/companies");
  revalidatePath("/memory");
  return { success: true as const, analysisFailed: saved.analysisFailed };
}
