import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  searchCompanies,
  getCompanyDetails,
  getRememberedCompanies,
} from "../../src/server/companies";
import { getDb } from "../../src/server/db";
import { inOrganization } from "../../src/server/tenant";
import { EMPTY_FILTERS } from "../../src/lib/lead-search";

test(
  "PostgreSQL filters, pagination, and organization-private relationships",
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
    const prefix = `qa-${randomUUID()}`;
    const a = { organizationId: `${prefix}-a`, userId: `${prefix}-ua` };
    const b = { organizationId: `${prefix}-b`, userId: `${prefix}-ub` };
    const industry = `QA ${prefix}`;
    const ids = Array.from({ length: 12 }, (_, i) => `${prefix}-company-${i}`);
    try {
      await admin.organization.createMany({
        data: [
          { id: a.organizationId, name: "QA A" },
          { id: b.organizationId, name: "QA B" },
        ],
      });
      await admin.user.createMany({
        data: [
          {
            id: a.userId,
            organizationId: a.organizationId,
            name: "QA A",
            email: `${prefix}-a@example.test`,
          },
          {
            id: b.userId,
            organizationId: b.organizationId,
            name: "QA B",
            email: `${prefix}-b@example.test`,
          },
        ],
      });
      await inOrganization(a, async (tx) => {
        const [settings] = await tx.$queryRaw<{ statement: string; idle: string }[]>`
          SELECT current_setting('statement_timeout') AS statement,
                 current_setting('idle_in_transaction_session_timeout') AS idle`;
        assert.equal(settings.statement, "15s");
        assert.equal(settings.idle, "20s");
      });
      await admin.company.createMany({
        data: ids.map((id, i) => ({
          id,
          name: `QA ${String(i).padStart(2, "0")}`,
          domain: `${id}.example`,
          industry,
          location: i === 0 ? "Austin, TX" : "Boston, MA",
          employeeCount: i === 11 ? null : i,
          estimatedRevenue: i === 11 ? null : `${i}.25`,
          ceoName: "QA CEO",
        })),
      });
      await admin.interaction.createMany({
        data: [
          {
            organizationId: a.organizationId,
            userId: a.userId,
            companyId: ids[0],
            interactionType: "CALL",
            rawNotes: "A suppression",
            relationshipStatus: "DO_NOT_CONTACT",
            createdAt: new Date("2026-01-01"),
          },
          {
            organizationId: a.organizationId,
            userId: a.userId,
            companyId: ids[0],
            interactionType: "NOTE",
            rawNotes: "A later note",
            recommendedAction: "A private action",
            nextFollowUpAt: new Date("2027-06-01"),
            relationshipStatus: "ENGAGED",
            createdAt: new Date("2026-02-01"),
          },
          {
            organizationId: b.organizationId,
            userId: b.userId,
            companyId: ids[0],
            interactionType: "CALL",
            rawNotes: "B private warm note",
            recommendedAction: "B private action",
            createdAt: new Date("2026-03-01"),
            nextFollowUpAt: new Date("2027-07-01"),
            relationshipStatus: "ENGAGED",
          },
          {
            organizationId: b.organizationId,
            userId: b.userId,
            companyId: ids[1],
            interactionType: "MEETING",
            rawNotes: "B private sale discussion",
            sellerReadiness: "READY",
          },
        ],
      });
      const filters = { ...EMPTY_FILTERS, industry };
      const resultsA = await searchCompanies(a, filters, 1);
      const resultsB = await searchCompanies(b, filters, 1);
      assert.equal(resultsA.total, 12);
      assert.equal(resultsA.companies.length, 10);
      assert.equal(resultsA.totalPages, 2);
      assert.equal(resultsA.companies[0].relationship, "Do Not Contact");
      assert.equal(resultsB.companies[0].relationship, "Warm");
      assert.equal(resultsA.companies[1].relationship, "New");
      assert.equal(resultsB.companies[1].relationship, "Interested");
      assert.equal(JSON.stringify(resultsA).includes("B private"), false);
      assert.equal(resultsA.companies[0].hasHistory, true);
      assert.equal(resultsA.companies[0].interactionCount, 2);
      assert.equal(resultsA.companies[0].lastContactedAt, "2026-01-01T00:00:00.000Z");
      assert.equal(resultsA.companies[0].relationshipStatus, "DO_NOT_CONTACT");
      assert.equal(resultsA.companies[0].nextFollowUpAt, null);
      assert.match(resultsA.companies[0].recommendedAction!, /Do not contact/);
      assert.equal(resultsB.companies[0].interactionCount, 1);
      assert.equal(resultsB.companies[0].lastContactedAt, "2026-03-01T00:00:00.000Z");
      assert.equal(resultsB.companies[0].nextFollowUpAt, "2027-07-01T00:00:00.000Z");
      assert.equal(resultsB.companies[0].recommendedAction, "B private action");
      const newLead = resultsA.companies[1];
      assert.equal(newLead.hasHistory, false);
      assert.equal(newLead.relationshipStatus, "NEW");
      assert.equal(newLead.interactionCount, 0);
      assert.equal(newLead.lastContactedAt, null);
      assert.equal(newLead.nextFollowUpAt, null);
      assert.equal(newLead.recommendedAction, null);
      const detailA = await getCompanyDetails(a, ids[1]);
      const detailB = await getCompanyDetails(b, ids[1]);
      assert.deepEqual(
        (await getRememberedCompanies(a)).map((company) => company.id),
        [ids[0]],
      );
      assert.equal((await getRememberedCompanies(b)).length, 2);
      assert.equal(detailA?.interactions.length, 0);
      assert.equal(detailB?.interactions.length, 1);
      assert.equal(await getCompanyDetails(a, `${prefix}-missing`), null);
      await assert.rejects(() =>
        searchCompanies(
          { organizationId: b.organizationId, userId: a.userId },
          filters,
          1,
        ),
      );
      const inclusive = await searchCompanies(
        a,
        {
          ...filters,
          minEmployees: "2",
          maxEmployees: "3",
          minRevenue: "2.25",
          maxRevenue: "3.25",
          location: "bOsToN",
        },
        1,
      );
      assert.equal(inclusive.total, 2);
      assert.deepEqual(
        inclusive.companies.map((c) => c.employeeCount),
        [2, 3],
      );
      const zero = await searchCompanies(
        a,
        {
          ...filters,
          minEmployees: "0",
          maxEmployees: "0",
          minRevenue: "0.25",
          maxRevenue: "0.25",
        },
        1,
      );
      assert.equal(zero.total, 1);
      assert.equal(zero.companies[0].id, ids[0]);
      assert.equal(
        (await searchCompanies(a, { ...filters, minRevenue: "0" }, 1)).total,
        11,
      ); // Unknown values don't pass numeric filters.
      assert.equal(
        (await searchCompanies(a, { ...filters, location: "Nowhere" }, 1))
          .total,
        0,
      );
      const last = await searchCompanies(a, filters, 99);
      assert.equal(last.page, 2);
      assert.equal(last.companies.length, 2);
      assert.equal((await getDb().interaction.findMany()).length, 0); // Transaction-local tenant context did not leak.
      const roles = await getDb().$queryRaw<
        { rolsuper: boolean; rolbypassrls: boolean }[]
      >`SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
      assert.equal(roles[0].rolsuper, false);
      assert.equal(roles[0].rolbypassrls, false);
    } finally {
      await admin.interaction.deleteMany({
        where: { organizationId: { in: [a.organizationId, b.organizationId] } },
      });
      await admin.company.deleteMany({ where: { id: { in: ids } } });
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
