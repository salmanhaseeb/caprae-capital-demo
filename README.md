# Search Memory

A B2B lead-search demo that remembers each organization's relationship with a company when it reappears in search.

The database foundation is implemented: four Prisma models, PostgreSQL enums, indexes, relational constraints, row-level security migrations, a generated Prisma 7.8 client, and repeatable fictional demo fixtures. A responsive Next.js dashboard is also implemented with reusable layout components, shadcn/ui controls, and interactive fictional demo views.

- [Database-backed Search Leads](docs/search-leads.md)
- [Company details and interaction logging](docs/company-details.md)
- [Dashboard UI and development](docs/ui.md)
- [Database setup and tenant isolation](docs/database.md)
- [Seed data and interview scenarios](docs/seed.md)
- [Prisma schema](prisma/schema.prisma)
- [Architecture and proposed application structure](docs/architecture.md)
- [Implementation checklist](TODO.md)

## Run the dashboard

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Lead search, company detail pages, and Relationship Memory now read PostgreSQL through Prisma. Configure and seed the database as described below. The workspace has a local demo database configured in the ignored `.env`. `npm run dev` automatically starts PostgreSQL, applies migrations, and ensures the demo seed. Database files persist in the ignored `.local/postgres` directory; do not delete it if you want to keep logged interactions. `npm run db:local` starts/repairs the local database without starting Next.js. This local helper requires PostgreSQL 14 binaries (or `PG_BIN`) and only runs for this workspace’s local demo URLs; it does not start or seed external/Neon databases. Browsing requires no OpenAI key. Logging interactions now uses AI extraction: set `OPENAI_API_KEY` in `.env` and restart the app to enable analysis; raw-note saves work without a key. `OPENAI_MODEL` defaults to `gpt-4.1-mini`. Real authentication remains unimplemented.

## Database commands

```sh
npm ci
npm run db:validate
npm run db:generate
```

Generation does not require database credentials. The generated client lives in `src/generated/prisma` and is ignored by Git; regenerate after installation or schema changes.

To apply the committed migrations to your own database, copy `.env.example` to `.env`, configure the URLs, then run `npm run db:deploy`. Use migrations rather than `db push`: the SQL migrations include constraints and security policies that Prisma's schema language cannot express. See the database guide before wiring runtime access.

After applying migrations, run `npm run db:seed` to create 2 organizations, 4 users, 30 shared companies, and 17 private interactions. Seeding uses `DIRECT_URL` and preserves existing records on repeat runs.

Verified locally: Prisma formatting/validation/generation, generated-client TypeScript check, migration deployment to a disposable PostgreSQL 14 database, and tenant-isolation/constraint tests. No Neon or production database has been changed.
