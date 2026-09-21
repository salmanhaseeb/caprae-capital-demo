import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { companies, interactions, organizations } from "./seed-data";

async function main() {
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL is required for seeding. Use the migration/admin connection to the intended demo database.");
  }
  const referenceDay = process.env.SEED_REFERENCE_DATE ?? new Date().toISOString().slice(0, 10);
  const referenceDate = new Date(`${referenceDay}T12:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDay) || !Number.isFinite(referenceDate.getTime()) || referenceDate.toISOString().slice(0, 10) !== referenceDay) {
    throw new Error("SEED_REFERENCE_DATE must be a valid YYYY-MM-DD date.");
  }
  const dayOffset = (days: number) => new Date(referenceDate.getTime() + days * 86_400_000);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    await prisma.$transaction(async (tx) => {
      // Serialize seed runs against this database. Released automatically on commit/rollback.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(73642, 1)`;
      const companyIds = new Map<string, string>();
      for (const { slug, ...company } of companies) {
        const saved = await tx.company.upsert({
          where: { domain: company.domain },
          update: {},
          create: { id: `demo-company-${slug}`, ...company, createdAt: dayOffset(-365) },
        });
        companyIds.set(slug, saved.id);
      }

      for (const organization of organizations) {
        // Also supports forced RLS when the admin is an ordinary table owner.
        await tx.$queryRaw`SELECT set_config('app.organization_id', ${organization.id}, true)`;
        await tx.organization.upsert({
          where: { id: organization.id }, update: {},
          create: { id: organization.id, name: organization.name, createdAt: dayOffset(-300) },
        });
        const userIds = new Map<string, string>();
        for (const user of organization.users) {
          const saved = await tx.user.upsert({
            where: { email: user.email }, update: {},
            create: { ...user, organizationId: organization.id },
          });
          if (saved.organizationId !== organization.id) {
            throw new Error(`Demo email ${user.email} already belongs to a different organization; seed aborted.`);
          }
          userIds.set(user.id, saved.id);
        }

        for (const fixture of interactions.filter((item) => item.organizationId === organization.id)) {
          const { key, companySlug, userId: fixtureUserId, daysAgo, followUpInDays, ...fields } = fixture;
          const companyId = companyIds.get(companySlug);
          const userId = userIds.get(fixtureUserId);
          if (!companyId || !userId) throw new Error(`Invalid fixture references for ${key}`);
          const id = `demo-interaction-${key}`;
          await tx.interaction.upsert({
            where: { organizationId_id: { organizationId: organization.id, id } }, update: {},
            create: {
              id, ...fields, companyId, userId,
              createdAt: dayOffset(-daysAgo),
              nextFollowUpAt: followUpInDays === undefined ? null : dayOffset(followUpInDays),
            },
          });
        }
      }
    }, { maxWait: 10_000, timeout: 60_000 });

    console.log(`Demo seed complete: ${organizations.length} organizations, ${organizations.reduce((count, org) => count + org.users.length, 0)} users, ${companies.length} companies, ${interactions.length} interactions ensured.`);
    console.log(`New history is relative to ${referenceDay}; existing records and dates are preserved.`);
    console.log("All companies, people, domains, and AI-style summaries are fictional. No OpenAI API calls were made.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Do not print a connection URL or raw database error containing credentials.
  console.error(error instanceof Error && !error.message.includes("postgres")
    ? error.message
    : "Seed failed. Check the demo database connection, migrations, and admin permissions.");
  process.exitCode = 1;
});
