# Architecture

## Implemented database foundation

Use one Next.js App Router application, PostgreSQL through Prisma, and server-side OpenAI extraction. Deploy the app to Vercel and the database to Neon. The current four-model schema consists of Organization, User, Company, and Interaction. Each user belongs to one organization; AI fields are stored on the interaction itself. The earlier Membership/InteractionInsight proposal is superseded.

Company records are shared. Interactions, user records, and organization records are tenant-scoped. Composite foreign keys enforce author membership and SQL row-level security protects private reads and writes. See [database setup and security contract](database.md) for mandatory runtime context and role configuration.

The Prisma schema, CLI configuration, migrations, generated client, repeatable seed script, and database tests are implemented. The Next.js UI shell and demo views are now implemented; see [UI architecture](ui.md). Search Leads, Companies, company details, and Relationship Memory now use tenant-scoped Prisma reads and a signed demo identity cookie; see [search architecture](search-leads.md). Company details now include a tenant-scoped interaction logging dialog; see [company details](company-details.md). AI extraction now runs before each interaction is saved; real authentication remains unimplemented. See [seed scenarios](seed.md) for the fictional interview dataset.

## Proposed application structure

```text
src/
  app/
    layout.tsx
    globals.css
    page.tsx
    (workspace)/
      layout.tsx
      companies/
        page.tsx
        loading.tsx
        error.tsx
        [companyId]/page.tsx
    api/interactions/[interactionId]/extract/route.ts
  components/
    ui/
    companies/
    interactions/
    workspace/
  server/
    db.ts
    auth.ts
    companies.ts
    interactions.ts
    actions/interactions.ts
    ai/extract.ts
  lib/
    validation/
    company-identity.ts
    utils.ts
  generated/prisma/                  # Generated now; ignored by Git
prisma/
  schema.prisma
  migrations/
  seed.ts
  seed-data.ts                      # Fictional companies and interaction narratives
prisma.config.ts
tests/database/tenant-isolation.sql
```

## Request flow to implement

1. Resolve the verified session's user and organization; all private operations execute in a transaction with trusted tenant context.
2. Search the shared company catalog with URL filters, stable sorting, and pagination. Apply organization-scoped previous-contact filtering before pagination and batch history/count queries.
3. Show public company details with only the active organization's private timeline.
4. Validate interactionType/contactName/rawNotes through a Server Action; derive organizationId/userId from trusted context.
5. Run server-side AI extraction, then atomically insert original notes plus aiSummary, relationshipStatus, sellerReadiness, sentiment, successionSignal, recommendedAction, and nextFollowUpAt. Save raw notes with an explicit analysisFailed marker and no AI result if extraction fails.

Derive previous contact from CALL/EMAIL/MEETING/LINKEDIN/OTHER records, independently of AI fields. NOTE alone establishes history but does not prove outreach. Use createdAt for timeline order in the requested schema; a separate occurredAt field would be a later schema enhancement if backdated interactions are needed.

Use OpenAI Responses API Structured Outputs with a Zod contract. Unknown information stays null or UNKNOWN; never fabricate dates. Surface the original note with its AI assessment. Stable per-form UUIDs prevent duplicate inserts and completed retries avoid new AI calls. Processing queues and prompt provenance are not part of this demo schema.

For the interview use fictional seeded companies and two distinct tenant demo identities. A user does not belong to multiple organizations in the current model. A demo switch would explicitly switch seeded identities; real authentication must not allow arbitrary organization selection.

## Dependencies

Installed dependencies and exact versions are in package.json/package-lock.json: Prisma CLI/client/PostgreSQL adapter, pg, dotenv, TypeScript, and Node/pg types.

Future app dependencies: next, react, react-dom, Tailwind and its PostCSS integration, ESLint/Next config, React types, openai, zod, server-only, lucide-react, clsx, tailwind-merge, and class-variance-authority. Let the shadcn CLI add component source and required primitives. Add Playwright for the eventual demo journey. Avoid a separate API server, global state store, vector database, or background queue for the initial demo.

References: [Next.js setup](https://nextjs.org/docs/app/getting-started/installation), [shadcn/ui](https://ui.shadcn.com/docs/installation/next), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
