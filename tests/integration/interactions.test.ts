import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logInteraction as persistInteraction } from "../../src/server/interactions";
import { getCompanyDetails } from "../../src/server/companies";
import { getDb } from "../../src/server/db";
test(
  "interaction writes are tenant-scoped, validated, and safe to retry",
  {
    skip:
      !process.env.TEST_DATABASE_URL || !process.env.TEST_ADMIN_DATABASE_URL,
  },
  async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const admin = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.TEST_ADMIN_DATABASE_URL!,
      }),
    });
    const prefix = `write-${randomUUID()}`;
    const a = { organizationId: `${prefix}-a`, userId: `${prefix}-ua` };
    const b = { organizationId: `${prefix}-b`, userId: `${prefix}-ub` };
    const companyId = `${prefix}-company`;
    const value = {
      requestId: randomUUID(),
      companyId,
      interactionType: "CALL",
      rawNotes: "A private partnership discussion.",
      contactName: "Michael",
      relationshipStatus: "NOT_INTERESTED",
      sellerReadiness: "READY",
      recommendedAction: "Send examples.",
      nextFollowUpAt: "2027-05-10",
    };
    let analyses = 0;
    const analysis = {
      summary: "Discussed a potential partnership.",
      relationshipStatus: "WARM" as const,
      sellerReadiness: "MEDIUM" as const,
      sentiment: "POSITIVE" as const,
      successionSignal: false,
      recommendedAction: "Send examples.",
      followUpMonths: null,
      keyContext: "Considering a partnership.",
    };
    const logInteraction = (session: typeof a, input: unknown) => persistInteraction(session, input, async (notes) => {
      analyses++;
      if (typeof notes === "string") throw new Error("Expected structured input");
      if (notes.rawNotes === "AI failure") throw new Error("Upstream failed");
      return { ...analysis, relationshipStatus: notes.rawNotes.includes("do not contact") ? "DO_NOT_CONTACT" : "WARM" };
    });
    try {
      await admin.organization.createMany({
        data: [
          { id: a.organizationId, name: "Write A" },
          { id: b.organizationId, name: "Write B" },
        ],
      });
      await admin.user.createMany({
        data: [
          {
            id: a.userId,
            organizationId: a.organizationId,
            name: "Writer A",
            email: `${prefix}-a@example.test`,
          },
          {
            id: b.userId,
            organizationId: b.organizationId,
            name: "Writer B",
            email: `${prefix}-b@example.test`,
          },
        ],
      });
      await admin.company.create({
        data: { id: companyId, name: "Write QA", domain: `${prefix}.example` },
      });
      const saved = await logInteraction(a, {
        ...value,
        organizationId: b.organizationId,
        userId: b.userId,
      });
      assert.equal(saved.id, value.requestId);
      assert.deepEqual(await logInteraction(a, value), saved);
      assert.equal(analyses, 1, "saved retries do not call AI again");
      const aCompany = await getCompanyDetails(a, companyId);
      const bCompany = await getCompanyDetails(b, companyId);
      assert.equal(aCompany?.interactions.length, 1);
      assert.equal(aCompany?.interactions[0].organizationId, a.organizationId);
      assert.equal(aCompany?.interactions[0].userId, a.userId);
      assert.equal(aCompany?.interactions[0].aiSummary, analysis.summary);
      assert.equal(aCompany?.interactions[0].relationshipStatus, "ENGAGED");
      assert.equal(aCompany?.interactions[0].sellerReadiness, "EXPLORING");
      assert.equal(aCompany?.interactions[0].contactName, "Michael");
      assert.equal(aCompany?.interactions[0].sentiment, "POSITIVE");
      assert.equal(aCompany?.interactions[0].successionSignal, "UNKNOWN");
      assert.equal(aCompany?.interactions[0].user.name, "Writer A");
      assert.equal(aCompany?.interactions[0].nextFollowUpAt, null);
      assert.deepEqual(aCompany?.interactions[0].aiAnalysis, analysis);
      const failureId = randomUUID();
      const failed = await logInteraction(b, { ...value, requestId: failureId, rawNotes: "AI failure" });
      assert.equal(failed.analysisFailed, true);
      assert.deepEqual(await logInteraction(b, { ...value, requestId: failureId, rawNotes: "AI failure" }), failed);
      const failureEntry = (await getCompanyDetails(b, companyId))!.interactions[0];
      assert.equal(failureEntry.rawNotes, "AI failure");
      assert.equal(failureEntry.aiSummary, null);
      assert.equal(failureEntry.aiAnalysis, null);
      assert.equal(bCompany?.interactions.length, 0);
      await assert.rejects(() => logInteraction(b, value)); // A request ID cannot replay into another tenant.
      await assert.rejects(() =>
        logInteraction(
          { ...b, userId: a.userId },
          { ...value, requestId: randomUUID() },
        ),
      );
      await assert.rejects(() =>
        logInteraction(a, { ...value, rawNotes: "Changed retry" }),
      );
      await assert.rejects(() =>
        logInteraction(a, {
          ...value,
          requestId: randomUUID(),
          companyId: "missing-company",
        }),
      );
      await assert.rejects(() =>
        logInteraction(a, {
          ...value,
          requestId: randomUUID(),
          rawNotes: "  ",
        }),
      );
      await logInteraction(a, {
        ...value,
        requestId: randomUUID(),
        rawNotes: "Please do not contact us again.",
        relationshipStatus: "DO_NOT_CONTACT",
        nextFollowUpAt: "",
      });
      const callsBeforeWarning = analyses;
      await assert.rejects(() => logInteraction(a, { ...value, requestId: randomUUID() }), /Explicit confirmation/);
      assert.equal(analyses, callsBeforeWarning, "No AI request before confirmation");
      await assert.rejects(() => logInteraction(a, { ...value, requestId: randomUUID(), confirmDoNotContact: "true" }), /Invalid Do Not Contact/);
      await logInteraction(a, { ...value, requestId: randomUUID(), confirmDoNotContact: true });
      await logInteraction(a, { ...value, requestId: randomUUID(), rawNotes: "AI failure", confirmDoNotContact: true });
      await logInteraction(b, { ...value, requestId: randomUUID() }); // A's restriction never prompts B.
      const staleId = randomUUID();
      await assert.rejects(() => persistInteraction(b, { ...value, requestId: staleId }, async () => {
        await admin.interaction.create({ data: { organizationId: b.organizationId, userId: b.userId, companyId, interactionType: "EMAIL", rawNotes: "New stop-contact request during analysis", relationshipStatus: "DO_NOT_CONTACT" } });
        return analysis;
      }), /Explicit confirmation/);
      assert.equal(await admin.interaction.count({ where: { id: staleId } }), 0);
      const timeline = (await getCompanyDetails(a, companyId))!.interactions;
      assert.equal(timeline.length, 4);
      assert.ok(timeline[0].doNotContactConfirmedAt);
      assert.equal(timeline[0].nextFollowUpAt, null);
      assert.match(timeline[0].recommendedAction!, /Do not contact/);
      assert.equal(timeline[0].relationshipStatus, "DO_NOT_CONTACT");
      assert.equal(await getDb().interaction.count(), 0);
    } finally {
      await admin.interaction.deleteMany({ where: { companyId } });
      await admin.company.deleteMany({ where: { id: companyId } });
      await admin.user.deleteMany({
        where: { id: { in: [a.userId, b.userId] } },
      });
      await admin.organization.deleteMany({
        where: { id: { in: [a.organizationId, b.organizationId] } },
      });
      await admin.$disconnect();
      await getDb().$disconnect();
    }
  },
);
