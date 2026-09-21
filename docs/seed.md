# Interview demo data

Run against an intended demo database after applying migrations:

```sh
npm run db:deploy
npm run db:seed
```

Configure `DIRECT_URL` with the migration/admin connection in `.env`. The seed creates catalog and identity records, so the restricted runtime role is not sufficient. The script sets transaction-local organization context as it writes each tenant, respecting forced RLS even when the administrator is an ordinary table owner. It does not disable policies.

The entire seed is one transaction, with an advisory lock to serialize concurrent runs. Companies match on domain, users on email, and organizations/interactions use stable demo IDs. Upserts preserve existing records, including edits, dates, and unrelated records. An existing demo email in the wrong organization aborts instead of moving the user. Fixture changes do not overwrite existing data on rerun; use a fresh disposable demo database when you want a new baseline.

Dates are relative to today's UTC date on initial creation, placing prior contacts in the past and actionable follow-ups in the future. Optionally set `SEED_REFERENCE_DATE=YYYY-MM-DD` for reproducible dates. Rerunning with a different reference date does not move existing history.

## Dataset

- **Acme Software:** Jordan Blake (`jordan@acme-software.example`) and Priya Shah (`priya@acme-software.example`).
- **Beta Holdings:** Morgan Ellis (`morgan@beta-holdings.example`) and Alex Rivera (`alex@beta-holdings.example`).
- **30 companies:** five each in SaaS, HVAC, Industrial Services, Logistics, Healthcare, and Cybersecurity, with locations, annual USD revenue estimates, employee counts, CEOs, and websites.
- **17 interactions:** 12 Acme entries across six companies, plus five Beta entries across four companies.

These are database identities, not login accounts with passwords; authentication is not implemented. All companies, people, financial figures, domains, and narratives are fictional. Reserved `.example` domains prevent the demo from directing outreach to real businesses. AI-style fields are hand-authored fixtures, not generated API responses. The seed makes no OpenAI calls.

## Acme scenarios

| Scenario | Company | Latest assessment | Context |
| --- | --- | --- | --- |
| Warm lead | Ledgercrest Software | ENGAGED / EXPLORING | Founder wants growth support, values team continuity, and agreed to a COO introduction. |
| Follow up later | Cedarline Mechanical | NURTURING / NOT_READY | Owner asked for a pause during an operations-manager search; prefers email. |
| No response | Waypoint Grove Logistics | CONTACTED / UNKNOWN | Two unanswered emails; sentiment and readiness remain unknown. |
| Interested | MapleBridge Revenue Services | ENGAGED / READY | Founder requested an NDA and is exploring a majority sale with a handover. |
| Do not contact | BastionTrail Security | DO_NOT_CONTACT / NOT_READY | Explicit suppression request; no follow-up scheduled. |
| Previously contacted, wrong timing | Ironhaven Reliability | NURTURING / UNKNOWN | Older call explains a mobilization delay; a recent internal note recognizes the resurfaced company. |

The current schema has no separate WARM_LEAD, NO_RESPONSE, or BAD_TIMING enum values. Notes, summaries, and the existing relationship/readiness fields express these distinctions without changing the schema. Historical entries intentionally retain earlier assessments; use the latest entry for a current-context card. A do-not-contact decision must suppress outreach even if earlier entries recommended contacting the company.

## Tenant-isolation walkthrough

1. As Acme, open Ledgercrest: two touches explain a warm partnership discussion.
2. As Beta, open the same Company record: Beta sees its own integration-model objection and NOT_INTERESTED status, with no Acme notes.
3. Cedarline also has separate histories under each organization, independently recording the owner's hiring-related pause.
4. SilverQuay Cold Chain has Beta-only history. Acme still sees the company but has no recorded contact.
5. MapleBridge has Acme-only history. Beta sees the shared profile without Acme's sale discussion.
6. Ironhaven demonstrates why rediscovery must consult old history before treating a company as new.

Beta additionally has a QuietShield Networks entry explaining an exclusive process with another party.

## Verification

On a freshly seeded disposable database, run the committed assertions using an administrator connection:

```sh
psql "$TEST_DATABASE_URL" -f tests/database/seed.sql
```

The checks verify sector coverage, complete company fields, interaction counts, unknown values for no response, no follow-up on the do-not-contact entry, and isolated views under a restricted PostgreSQL role. Fixtures remain; temporary test-role changes are rolled back. Local verification also ran the seed twice with different reference dates and compared every row to confirm repeatability.
