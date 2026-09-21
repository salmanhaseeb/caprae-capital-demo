# Implementation plan

## Completed: database foundation

- [x] Inspect workspace and propose architecture.
- [x] Implement requested Organization, User, Company, and Interaction models.
- [x] Add enums, unique keys, tenant-aware relations, indexes, and SQL checks.
- [x] Add forced tenant row-level security and document runtime requirements.
- [x] Install Prisma dependencies, commit lockfile, add CLI configuration and environment template.
- [x] Format/validate schema, generate client, and typecheck generated client/configuration.
- [x] Apply migrations to a disposable PostgreSQL database and verify tenant isolation and constraints.

## 1. Application foundation

- [x] Scaffold Next.js App Router, TypeScript, Tailwind, ESLint, and shadcn/ui while preserving database work.
- [x] Add lazy server-only Prisma adapter and allowlisted signed demo-session resolver.
- [ ] Replace public demo identities with real authenticated users before using private customer data.
- [x] Provision a restricted local runtime role and wrap private reads in tenant-context transactions.
- [x] Seed 30 fictional companies, two organizations, four demo users, and contrasting histories; verify repeatability and tenant isolation.

## Completed: dashboard UI

- [x] Build reusable responsive shell, sidebar, header, and page-heading components.
- [x] Add Search Leads, Companies, Relationship Memory, and Settings views with shadcn/ui.
- [x] Add fixture-backed filters, pagination, sorting, CSV export, saved-filter preview, and company-detail drawer.
- [x] Verify desktop/mobile rendering, navigation, demo identity switching, and browser interactions.

## 2. Connect search and details to the server

- [x] Build six validated URL filters, result counts, stable sorting, and bounded pagination over PostgreSQL.
- [x] Build demo results table with company profile and organization-specific contact indicators.
- [x] Replace lead and memory fixtures with server-scoped database reads tied to the current demo user.
- [x] Build /companies/[id] with organization-private history and loading/empty/error states.

Acceptance: the same company appears in both organizations, but each sees only its own history and contact status.

## 3. Interaction logging

- [x] Add validated interaction form and tenant-scoped save action.
- [x] Derive author and organization from the server demo session, make retries idempotent, and refresh views.

Acceptance: a successful save immediately refreshes relationship memory; only type, contact name, and notes are user-entered.

## 4. Relationship intelligence

- [x] Define Zod extraction contract, extraction prompt, and model configuration.
- [x] Integrate Responses API Structured Outputs with timeouts and failure handling.
- [x] Keep retries idempotent with the per-form UUID; atomically save notes and analysis after extraction succeeds, or raw notes with analysisFailed on AI failure.
- [x] Show source notes with AI assessment and allow safe retries.
- [ ] Add organization usage limits and persisted prompt provenance before production.

Acceptance: absent evidence stays unknown, failed extraction persists raw notes, and stale retries cannot overwrite newer results.

## 5. Polish, verify, deploy

- [x] Add service-level tenant tests including forged request identifiers and nested Prisma queries.
- [ ] Test extraction success, refusal, invalid output, and timeouts.
- [x] E2E: search/detail plus AI fixture failure/raw-note save → log contact → timeline → switch demo identity and verify isolation.
- [ ] Run lint, typecheck, relevant tests, production build, and mobile/keyboard checks.
- [ ] Provision Neon/Vercel with separate preview/production databases and restricted runtime credentials.
- [ ] Apply migrations through a controlled release step; explicitly seed fictional demo data.
- [ ] Document a repeatable interview walkthrough and demo authentication limitations.

Deferred: live company ingestion, CRM/email integrations, production authentication onboarding, multi-organization memberships, note editing, embeddings, queues, and advanced roles.
