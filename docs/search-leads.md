# Database-backed lead search

Search Leads (`/`) and Companies (`/companies`) read the PostgreSQL Company table through Prisma. The six filters are Industry, Location, Minimum/Maximum employees, and Minimum/Maximum annual revenue in USD. Submitting Search updates URL parameters; typing alone does not run a query. Clear filters resets all six fields and returns to page one.

Industry matches exactly, case-insensitively. Location matches a case-insensitive substring (city or state). Both suggest existing database values. Numeric bounds are inclusive; blanks mean unbounded and zero is a valid bound. Unknown/null numeric values are included without numeric filters but excluded when a bound is applied. Employee counts must be nonnegative PostgreSQL integers; revenue uses exact decimal strings with at most two decimal places. Reversed ranges and malformed URL parameters produce readable errors on the server, even when browser validation is bypassed.

Results include all seven requested columns and use stable name/ID ordering with ten rows per page. Count and rows are read within the same repeatable-read transaction. Out-of-range page numbers are clamped to the last page. Company links use database IDs at `/companies/[id]`; unknown IDs return not-found. Search has pending, initial loading, empty-catalog, no-match, and database-error states. Dates on company history are shown in UTC.

## Relationship badges

All interaction queries filter by the current user's organization, with PostgreSQL RLS as an additional boundary. Badge selection does not fetch another organization's history.

| Condition | Badge |
| --- | --- |
| No interactions in this organization | New |
| Any explicit DO_NOT_CONTACT in this organization's history | Do Not Contact |
| Latest entry has NOT_INTERESTED | Previously Contacted |
| Latest entry has READY seller readiness | Interested |
| Latest entry has ENGAGED relationship status | Warm |
| Latest entry has NURTURING status or a follow-up date | Follow Up |
| Any other existing interaction | Previously Contacted |

Do-not-contact suppression takes precedence because the schema does not yet model explicit re-opt-in. Apart from suppression, the latest interaction is determined by createdAt, then ID. An internal note counts as an existing interaction for the requested badge behavior. A Beta-only interaction never changes Acme's New badge.

## Demo session and tenant boundary

The header changes between two deliberately public, fictional demo identities. A Server Action accepts only their allowlisted organization IDs, maps them to the seeded primary user, and writes an HttpOnly, SameSite=Lax, HMAC-signed cookie. The cookie expires after seven days and uses Secure in production. A new demo session starts as Acme. Invalid/expired signatures return no private records until a valid demo identity is selected.

Server queries resolve the organization from that identity, validate that the user actually belongs to it in PostgreSQL, and set `app.organization_id` transaction-locally. The browser cannot choose a tenant using URL filters or pass a user ID into the database service. Runtime reads use only DATABASE_URL; DIRECT_URL is reserved for migrations and seeding. Do not use owner/superuser/BYPASSRLS credentials for the app.

This is a demo identity mechanism, **not real user authentication**: anyone with access to an enabled demo can intentionally choose either demo identity. Keep only fictional records in this deployment. Production authentication must replace the demo identity resolver before real private customer data is used. Production requires explicit DEMO_MODE=true and a random DEMO_SESSION_SECRET of at least 32 characters; otherwise database-backed pages fail closed.

Relationship Memory was also moved to scoped server reads so old browser-bundled history fixtures are no longer shipped. Company details receive only the current organization's history. The [company-details logging flow](company-details.md) now supports private interaction inserts. AI API calls remain unimplemented.

## Run locally

1. Configure `.env` using `.env.example`; provide a running PostgreSQL/Neon database, a direct migration/admin connection, and a separate restricted runtime connection.
2. Run `npm ci`, `npm run db:deploy`, and `npm run db:seed`.
3. As administrator, grant runtime access:

```sql
-- Create search_memory_app as a LOGIN role using your database's credential flow,
-- with NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE and no table ownership.
GRANT USAGE ON SCHEMA public TO search_memory_app;
GRANT SELECT ON "Company", "Organization", "User", "Interaction" TO search_memory_app;
GRANT INSERT ON "Interaction" TO search_memory_app;
```

4. Run `npm run dev` and open http://localhost:3000. Prisma Client is generated before dev/build. No OpenAI key is needed.

For this workspace, a local PostgreSQL demo cluster was initialized under `/tmp/search-memory-pg-data`, with a Unix socket under `/tmp/search-memory-pg-socket` on port 55439. The ignored `.env` points at its seeded `search_memory` database using a restricted `search_memory_app` role. It is local development data and will not survive removal of `/tmp`; Neon has not been changed.

## Verify

```sh
npm run test:unit
# Both test URLs must point to the SAME disposable migrated database:
TEST_DATABASE_URL='restricted-runtime-url' TEST_ADMIN_DATABASE_URL='admin-url' npm run test:integration
# Browser checks expect the seeded demo database used by the dev server:
CHROME_PATH=/path/to/chrome npm run test:e2e
npm run lint
npm run typecheck
npm run build
```

The integration test uses uniquely named fixtures, removes them afterward, verifies that the runtime role cannot bypass RLS, and checks tenant-context cleanup, badge precedence, mixed-case filters, exact decimal boundaries, null/zero handling, counts, pagination, and company histories. Browser checks cover form submission, all six filters, detail links, persisted demo switching, Beta-only records appearing New for Acme, forged URL tenants, invalid sessions, empty results, range errors, and mobile overflow.


## Relationship preview metadata

Each company result returns hasHistory, lastContactedAt (ISO UTC or null), relationshipStatus (NEW/COLD/WARM/FOLLOW_UP/INTERESTED/DO_NOT_CONTACT), nextFollowUpAt (ISO UTC or null), interactionCount, and recommendedAction. The existing relationship display label remains for compatibility; COLD displays Previously Contacted.

All interaction selections, filtered counts, latest-contact aggregates, and suppression checks explicitly filter by the signed session's organizationId inside the RLS transaction. Aggregates are bounded to the current page's company IDs. No raw notes or other tenants' intelligence are sent to the results component. Last Contacted excludes legacy internal NOTE entries; Interaction Count includes them. The newest interaction determines status/action/follow-up, with sticky Do Not Contact overriding outreach. No history means New, zero interactions, and null dates/action—even when another organization has history.

Hover the relationship badge to preview metadata; click or press Enter/Space to keep it open. Escape, the close button, or clicking outside dismisses it. The portal keeps the preview clear of the table's horizontal scroll container and within the viewport. Organization changes remount previews to close stale context.
