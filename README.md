# Search Memory

Search Memory is a B2B lead-generation demo that remembers an organization's relationship with a company when that company appears in future searches.

**Deploy on Heroku:** follow [the Heroku + Neon guide](docs/heroku.md). The whole Next.js application runs as one web process; Neon remains the database. The Vercel instructions below remain available as an alternative.

## Business problem and solution

Lead tools help sales teams discover companies, but the reasons behind a previous conversation often disappear into notes or individual memory. A company found again months later can be treated as a new lead, creating duplicate outreach and losing valuable timing or succession context.

Search Memory attaches private interaction history to shared company records. Search results immediately show prior contact and relationship status. Company pages combine the original notes, a timeline, follow-up information, and concise AI relationship intelligence. Do Not Contact warnings require explicit confirmation before logging another outbound interaction.

**Deployment scope:** this is an interview demo with fictional organizations and an intentional organization switcher. Signed cookies and database isolation protect the selected session's scope, but the switcher is not authentication: visitors can select either demo organization. Deploy with access protection and fictional data. Real customer use requires authenticated identities, verified organization membership, authorization for switching organizations, and abuse/rate controls for AI usage.

## Architecture

- Next.js App Router server components load search results, company details, and relationship memory from PostgreSQL.
- Small client components handle filters, dialogs, navigation, badges, and toast notifications. Database and OpenAI modules are server-only; credentials are never passed into client props.
- Server actions validate interaction input, derive the organization and user from the signed demo session, call the AI service, and save the result. Clients cannot choose AI-generated fields or submit a trusted organization ID.
- Companies are shared. Organizations, users, and interactions are private. Queries explicitly scope interaction data by organization; PostgreSQL forced row-level security adds a second boundary. A transaction-local organization setting prevents context leaking between pooled connections. A composite user/organization foreign key prevents cross-organization attribution.
- AI analysis uses the OpenAI Responses API with strict structured output and runtime schema validation. Original notes and structured results are stored together. Timeouts, refusals, invalid output, and missing credentials still allow raw notes to save, marked as analysis unavailable. Requests use `store: false`; submitted notes are sent to OpenAI, so use fictional notes for the demo.
- Relationship recommendations use stored AI context, not generated explanations on page load. No outreach messages are sent by the application.

```text
src/app/                 Routes, layouts, loading/error boundaries, server actions
src/components/          Dashboard, search, company, and reusable UI components
src/server/              Session, tenant transactions, database access, AI service
src/lib/                 Shared validation and display helpers
src/generated/prisma/    Generated client (ignored; regenerated during builds)
prisma/                  Schema, committed SQL migrations, fictional seed data
scripts/                 Environment, database verification, local DB lifecycle
tests/                   Unit, integration, database isolation, browser tests
```

## Technology choices

Next.js and TypeScript keep server rendering, typed mutations, and interactive UI in one application. Tailwind CSS and shadcn/ui provide consistent, accessible interface primitives. PostgreSQL supports relational integrity and row-level security; Prisma 7 with the PostgreSQL driver adapter provides typed access. OpenAI extracts structured relationship context from unstructured notes. Heroku runs the Node.js application and Neon provides production PostgreSQL; Vercel is also supported.

The runtime uses one reusable Prisma client/pool per process, capped at three connections with connection and statement timeouts. Neon pooled connections support serverless instances. AI calls run outside database transactions. Private routes are dynamic rather than statically cached across organizations.

## Local setup

Use Node.js 22 and npm (`nvm install && nvm use` if you use nvm). Both `.nvmrc` and `package.json` select Node.js 22 to match the production runtime and Prisma's dependencies. Install PostgreSQL if using the local helper.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:3000. Do not overwrite an existing `.env` with your configured credentials.

With the example's exact local URLs, `npm run dev` generates Prisma, starts PostgreSQL, applies migrations, grants the restricted runtime role access, and ensures the seed data. The helper expects Linux PostgreSQL binaries at `/usr/lib/postgresql/14/bin`; set `PG_BIN` to your installed PostgreSQL binary directory if different. Data persists in ignored `.local/postgres`; deleting that directory deletes local interactions. The Unix socket is in `/tmp/search-memory-pg-socket`. Run `npm run db:local` to start the database without Next.js.

For another local PostgreSQL installation or Neon, replace both URLs and use the manual database setup below. The helper deliberately does not start or seed external databases. Prisma and standalone database scripts read `.env` or shell-injected variables; keep database configuration there rather than only in Next-specific `.env.local` files.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Required runtime connection, using a restricted non-owner PostgreSQL role. Use Neon's pooled TLS endpoint in production. |
| `DIRECT_URL` | Direct admin/owner connection, required only for migrations and seeding. Keep out of the deployed runtime environment. |
| `DEMO_MODE` | Set to `true` to explicitly enable fictional demo identities in production. |
| `DEMO_SESSION_SECRET` | Unique random signing secret, at least 32 characters; required for production. |
| `OPENAI_API_KEY` | Optional server-only credential. Missing/failed AI still permits raw-note saves. |
| `OPENAI_MODEL` | Optional structured-output model; default `gpt-4.1-mini`. |
| `SEED_REFERENCE_DATE` | Optional date in `YYYY-MM-DD` format for initial fictional history. |
| `ALLOW_DEMO_SEED` | Set to `true` only when deliberately seeding with `NODE_ENV=production`. |

Generate a session secret locally and copy its output into your secret manager or ignored `.env`:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Never prefix credentials with `NEXT_PUBLIC_`, commit `.env`, or place secrets in screenshots or logs. Rotate any credential previously shared in chat or committed to Git. `.env.example` contains no real credentials. Production validation rejects test AI overrides and missing session secrets without printing values.

```sh
npm run check:env
# In a release environment that also contains DIRECT_URL:
node scripts/check-env.mjs --production --migrations
```

## Database setup and migrations

Use separate runtime and migration roles. The application refuses privileged roles, roles with privileged membership (including `neon_superuser`), and owners of private tables. Do not use Neon's default administrative role as `DATABASE_URL`.

1. Create a database and configure its direct owner connection as `DIRECT_URL` in a private administrative environment.
2. Apply the committed migrations:

   ```sh
   npm run db:deploy
   ```

3. As the database owner, create a restricted runtime role through SQL rather than granting administrative membership:

   ```sql
   CREATE ROLE search_memory_app LOGIN
     NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
   GRANT USAGE ON SCHEMA public TO search_memory_app;
   GRANT SELECT ON "Company", "Organization", "User", "Interaction"
     TO search_memory_app;
   GRANT INSERT ON "Interaction" TO search_memory_app;
   ```

   Set its password privately, for example using `\password search_memory_app` in psql. The role must not own the tables or inherit the owner's role. Configure its pooled connection as `DATABASE_URL`, with `sslmode=require` or `verify-full` for Neon. Use the direct, non-pooler endpoint for `DIRECT_URL`.

4. Verify the runtime connection:

   ```sh
   npm run db:check
   ```

   This checks connectivity, a restricted role, forced RLS on private tables, and default-deny interaction access without tenant context.

For schema changes in development, run `npm run db:migrate -- --name descriptive_change`, review the generated SQL, and commit the migration. Regenerate with `npm run db:generate`. Use `npm run db:deploy` for staging and production as a controlled release step before deploying compatible application code. Run migrations once per release, not on every server start or Vercel build. Never use `db push`, `migrate reset`, or `migrate dev` against production: SQL migrations include security policies and constraints beyond the Prisma schema.

Back up the database before destructive changes and use additive, backward-compatible migrations for rolling deployments. Preview deployments should use a separate database or Neon branch, never the production database.

## Seed strategy

```sh
npm run db:seed
```

The seed uses `DIRECT_URL` and creates two organizations, four users, 30 fictional companies across six industries, and 17 historical interactions. Acme Software and Beta Holdings have separate histories. Repeat runs preserve existing records and manually logged interactions; the seed is not a reset mechanism. Dates are anchored when records are first created.

Production seeding is opt-in and should target only an intentional demo database:

```sh
NODE_ENV=production ALLOW_DEMO_SEED=true npm run db:seed
```

Do not retain `ALLOW_DEMO_SEED` in the deployment environment. Builds do not migrate or seed the database.

## Checks and production build

```sh
npm run check       # Prisma generation/validation, lint, TypeScript, unit tests
npm run db:check    # Requires a running, migrated database
npm run build      # Validates production env, generates Prisma, builds Next.js
npm run start      # Runs the production build
```

Set `DEMO_SESSION_SECRET` before building, even for a local production preview. The build uses Next.js's supported Webpack option because Turbopack's compiler process is restricted in this workspace. It does not require `DIRECT_URL` or call OpenAI. All deployed routes use the Node.js runtime; the company route declares a 60-second function budget for interaction analysis and saving. Run builds and browser tests sequentially because Next.js regenerates shared build/type artifacts.

Integration tests require `TEST_DATABASE_URL` (restricted role) and `TEST_ADMIN_DATABASE_URL` (owner) pointing at the same migrated **test database**. They create and clean up their own fixtures; do not point them at production. Without these variables database tests may skip.

```sh
npm run test:integration
# With TEST_ADMIN_DATABASE_URL configured for the browser test database:
TEST_AI_FIXTURE=true npm run test:e2e
```

Browser tests use a local AI fixture, not a real API key. Install Playwright Chromium if needed (`npx playwright install chromium`), or set `CHROME_PATH` to an installed Chrome executable. SQL isolation assertions are also available in `tests/database/tenant-isolation.sql` and should run only against a test database as its administrator.

## Deployment to Vercel and Neon

Follow the [step-by-step Vercel + Neon deployment guide](docs/deployment.md) for exact environment variables, database grants, and dashboard settings.

1. Push the source and lockfile to GitHub. Keep `.env`, `.local`, generated Prisma output, and build artifacts ignored.
2. Create a Neon database/branch near the Vercel function region. Configure separate direct admin and pooled restricted runtime connections as described above.
3. From a trusted release environment, install dependencies, apply committed migrations, grant runtime permissions, optionally seed the fictional demo, and run `npm run db:check`. Keep the admin URL in that environment only.
4. Import the repository into Vercel with the Next.js preset and Node.js 22. Use `npm ci` for installation and `npm run build` for the build command; keep the preset's output directory.
5. Set `DATABASE_URL`, `DEMO_MODE=true`, and a generated `DEMO_SESSION_SECRET` in Vercel. Add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` for live analysis. Do not set `DIRECT_URL`, `ALLOW_DEMO_SEED`, `TEST_AI_FIXTURE`, or `OPENAI_BASE_URL` in the application deployment. Configure Preview and Production variables separately.
6. Enable deployment access protection for the interview demo. Public visitors otherwise have access to both fictional identities and can incur OpenAI usage through interaction logging; application-level rate limiting is not implemented.
7. Deploy. Ensure the host permits the company route's 60-second duration. Smoke-test search, both organizations, a company timeline, raw-note saving, and live analysis with fictional notes. Check platform logs for failures without logging submitted notes or credentials.

The app adds basic security headers, removes the framework identification header, keeps session cookies HTTP-only and secure in production, and shows recoverable loading/empty/error states. These measures do not replace real authentication. No deployment is performed by the build or setup scripts.

Deployment references: [Vercel function duration](https://vercel.com/docs/functions/configuring-functions/duration), [Neon roles](https://neon.com/docs/manage/roles), [Prisma deployment workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production).

## Demo walkthrough

1. Start in **Acme Software** as Jordan. Search Leads shows shared companies with organization-specific badges. Filter by industry, location, employee count, or revenue.
2. Open Ledgercrest Software to explore previous conversations and relationship intelligence. Hover or click a search relationship badge for last contact, interaction count, and the next action.
3. Find SilverQuay Cold Chain. In the original seed it is a new lead for Acme; switch to Beta Holdings to see its separate history. Newly logged demo interactions can change these states.
4. Log a call with fictional notes: “Spoke with Michael. His daughter recently joined the company, so the timing is not right. He suggested reconnecting next year.” Save and review the original text, AI summary, succession signal, and follow-up recommendation.
5. Open BastionTrail Security in Acme to demonstrate Do Not Contact warnings and outbound-interaction confirmation while keeping historical notes readable.
6. Browse Relationship Memory and Settings, then switch organizations again to demonstrate that relationship state follows the organization, not the shared company record.

More detail: [schema](prisma/schema.prisma), [database isolation](docs/database.md), [seed scenarios](docs/seed.md), [company interaction flow](docs/company-details.md).
