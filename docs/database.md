# Database foundation

## Models and conventions

The current design follows the requested four entities. It supersedes the initial Membership and InteractionInsight proposal: each User belongs to exactly one Organization, and structured AI fields live directly on Interaction.

- Organization owns users and interactions.
- Company is a shared catalog entry identified by a unique normalized domain.
- User has a globally unique lowercase, trimmed email and a required organization.
- Interaction belongs to one organization, one shared company, and one author in that organization. The composite `(organizationId, userId)` foreign key enforces the author boundary even on administrator writes.

IDs are Prisma-generated CUIDs; raw SQL callers must supply IDs. Timestamps use PostgreSQL `timestamptz(3)`. Company enrichment fields are nullable when unknown. Revenue is `Decimal(18,2)` and represents estimated annual USD revenue for this demo; retain Prisma Decimal/string precision rather than converting financial values to JavaScript floating point.

AI summaries, recommended actions, and follow-up timestamps are nullable. Structured enum fields default to UNKNOWN: unprocessed notes must not imply negative sentiment, no succession signal, or unwillingness to sell. `SuccessionSignal.NONE` means an explicit absence; UNKNOWN means insufficient evidence. Seller readiness describes willingness to consider a sale, not a numeric probability. Relationship status describes the recorded interaction's assessment, not a global property of the shared company.

Application code must normalize domains to lowercase hostnames with scheme, path, port, leading `www.`, and trailing dot removed before writes. The database rejects common noncanonical forms; it is not a full domain/URL validator. Normalize emails before writes. SQL constraints reject negative employee counts/revenue and blank notes. Restrictive foreign-key delete/update behavior prevents removing referenced history or silently moving authors between organizations.

Indexes support company filtering and stable name sorting, organization/company timelines, organization/user queries, follow-up dates, relationship statuses, and contact-type existence checks. B-tree name indexes support sorting, not arbitrary substring search; a small demo catalog can use case-insensitive contains without adding a full-text service.

## Setup

Use the lockfile with `npm ci`. The CLI, client, and PostgreSQL adapter are pinned together at Prisma 7.8.0. Node 20.19+ runs generation here; Node 22.12+ is preferred for future application work (an optional Prisma development-tool dependency declares Node 22+). The installed Prisma CLI dependency tree currently reports npm audit findings; no forced major-version downgrade or transitive major override was applied. Reassess compatible upstream fixes before deploying tooling.

1. Copy `.env.example` to `.env` and replace the example connection strings.
2. `DIRECT_URL` is the administrator/migration connection; `DATABASE_URL` is the runtime connection, pooled on Neon.
3. Run `npm run db:validate` and `npm run db:generate`.
4. Run `npm run db:deploy` to apply both committed migrations. For future changes use `npm run db:migrate`, review SQL, and regenerate the client.

Generation works without either URL. The lazy server-only singleton in `src/server/db.ts` instantiates the generated `PrismaClient` with `PrismaPg` and `DATABASE_URL`. Never pass `DIRECT_URL` into runtime requests.

## Tenant security contract

The SQL migration enables and forces row-level security on Interaction, User, and Organization. Company remains shared. Missing or empty `app.organization_id` context yields no private rows and rejects private inserts. Policies cover reads and writes, including nested joins and counts.

Use a separate non-owner application role with `NOSUPERUSER NOBYPASSRLS`. PostgreSQL superusers and BYPASSRLS roles bypass these policies even with FORCE enabled. Grant only schema USAGE, SELECT on Company/User/Organization, and SELECT/INSERT on Interaction for the current logging flow. Provision catalog records, organizations, and users through a trusted admin path. Do not grant runtime schema creation, table ownership, role management, or TRUNCATE privileges. Role credentials and grants are environment-specific and are deliberately not hardcoded into migrations.

Before every private operation, resolve the user and organization from a verified server-side session. User-supplied organization IDs are not authorization. Establish tenant context transaction-locally, and perform all related reads/writes through that transaction client:

```ts
// organizationId must come from a verified session; this is not authentication.
const history = await prisma.$transaction(async (tx) => {
  await tx.$queryRaw`
    SELECT set_config('app.organization_id', ${organizationId}, true)
  `;
  return tx.interaction.findMany({
    where: { organizationId, companyId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
});
```

The `true` argument makes the setting transaction-local, preventing tenant context from surviving in pooled connections. Continue including organizationId in application queries and compound lookups for explicit scoping. Treat authentication/bootstrap separately: private User lookups require a trusted organization context too. Never expose raw SQL or database credentials to the browser. This database boundary protects against omitted query filters; it does not protect against a compromised trusted server that can deliberately set arbitrary tenant context.

## Verification

The committed SQL test runs against a migrated **disposable** database as a PostgreSQL administrator capable of creating roles. It creates a restricted temporary test role inside a transaction and rolls back all fixtures and role changes:

```sh
psql "$TEST_DATABASE_URL" -f tests/database/tenant-isolation.sql
```

It checks shared-company visibility, default-deny behavior, organization A/B isolation, joins, cross-tenant insert/update/delete rejection, cross-tenant authorship rejection, own-tenant writes, enum/null defaults, duplicate domains/emails, invalid domain forms, negative numbers, blank notes, and restrictive company deletion. No existing application or production database is needed.

References: [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html), [Prisma 7 upgrade/configuration guidance](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7).
