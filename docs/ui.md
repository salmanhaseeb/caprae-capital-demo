# Dashboard UI

## Run

Configure PostgreSQL and the demo identity settings using `.env.example`, then:

```sh
npm ci
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Search and relationship views now require the database; no API key is needed. See [Search Leads](search-leads.md) for setup, filter semantics, and session behavior. Prisma Client is generated automatically before dev/build.

## Screens

- **Search Leads (`/`)**: six explicit filters, submit/clear controls, database result count, paginated company table, organization-specific relationship badges, loading, validation, empty, and error states.
- **Companies (`/companies`)**: the same server-backed company directory.
- **Company details (`/companies/[id]`)**: shared profile, organization-private Relationship Memory, summary metrics, a complete timeline, and working interaction logging buttons.
- **Relationship Memory (`/memory`)**: searchable cards loaded on the server from the current organization's database history.
- **Settings (`/settings`)**: demo workspace/team details and temporary notification-preference preview. No notifications are sent.

The header switches between allowlisted fictional demo identities through a signed, HttpOnly server cookie. This deliberate public demo switch is not production authentication. Query parameters never authorize tenant access. Other organizations' interaction records are not sent to the browser.

## Reusable components

- `src/components/layout`: AppShell, Sidebar, Header, Logo, DemoProvider.
- `src/components/leads`: search form/results, server page loader, pending state, and relationship badge.
- `src/components/dashboard`: memory cards and settings presentation.
- `src/components/ui`: shadcn/ui controls and Radix accessibility primitives.
- `src/app/globals.css`: Tailwind tokens, forest-green accents, neutral surfaces, and reduced-motion support.

Inter is bundled locally. The desktop sidebar becomes a keyboard-accessible mobile sheet, tables scroll inside their own container, controls have accessible names, and navigation includes a skip link/current-page indicator. Search filters are encoded in the URL, allowing refresh and browser history without losing the applied search.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Use CHROME_PATH to point tests at an existing Chrome binary. Browser checks require the seeded database and verify filtering, detail routes, organization switching, isolation, empty states, validation, and responsive layout. Database/unit test commands are documented in [search-leads.md](search-leads.md).
