# Company details and interaction logging

`/companies/[id]` displays the shared company profile and the current demo organization's private relationship memory.

- Header: name, industry, location, and an external website link (only HTTP/HTTPS URLs are linkable).
- Company information: estimated annual revenue in USD, employee count, CEO, and domain; missing values display a dash.
- Empty memory: “No relationship history yet”, “This company is a new lead for your organization.”, and a Log First Interaction button.
- Existing memory: current relationship status, last contacted, next follow-up, seller readiness, and the Interaction Timeline.
- Timeline: newest first by createdAt then ID, with type, contact name, UTC timestamp, author, original notes, AI summary, relationship status, and recommended next action. Missing summaries/actions have explicit placeholders.

Last Contacted uses the most recent CALL, EMAIL, MEETING, LINKEDIN, or OTHER interaction. Internal NOTE entries do not advance it; note-only history shows “No contact recorded”. The current status follows the same badge rules as Search Leads. Readiness and the follow-up date come from the latest interaction. A Do Not Contact relationship displays no scheduled outreach, regardless of older follow-up dates.

Both logging buttons open the same accessible dialog. Users provide Call, Email, Meeting, LinkedIn, or Other; an optional contact name (200 characters); and required notes (10,000 characters). There are no manually editable AI fields. Historical NOTE entries remain supported in the timeline. The interaction date is the time it is saved.

The Server Action resolves the signed demo session, checks the form's organization, and validates input. Submitted author/tenant IDs and AI fields are ignored. The service verifies tenant membership and company existence before calling OpenAI, outside a database transaction. Only the submitted type, contact name, and notes are sent; no other tenants' histories are sent.

The server uses OpenAI Responses with Structured Outputs, Zod validation, a 20-second timeout, and `store: false`. It extracts the exact requested JSON contract: summary, relationshipStatus (NEW/COLD/WARM/INTERESTED/FOLLOW_UP/DO_NOT_CONTACT), sellerReadiness (UNKNOWN/LOW/MEDIUM/HIGH), sentiment (NEGATIVE/NEUTRAL/POSITIVE), boolean successionSignal, numeric-or-null followUpMonths, keyContext, and recommendedAction. The full response is stored in aiAnalysis; an explicit adapter populates legacy database fields. Unsupported facts stay UNKNOWN/null; vague timing remains in the recommendation. Original notes are stored unchanged. Existing Do Not Contact history suppresses follow-ups and outreach recommendations regardless of new analysis.

On success the original notes and extracted fields are inserted together. On configuration, network, refusal, or invalid-output errors, raw notes still save with analysisFailed=true and aiAnalysis=null. The timeline and notification explicitly report unavailable analysis; no invented summary is substituted. Existing relationship status, readiness, and follow-up are retained on failure. The per-form UUID prevents duplicate rows; a completed retry returns without another AI request. Simultaneous requests may make more than one AI call but cannot create duplicate interactions. No background queue is included.

After saving, company details, lead results, the directory, and Relationship Memory are revalidated and a success toast appears. Configure `OPENAI_API_KEY` in the ignored `.env` and restart the server. `OPENAI_MODEL` defaults to `gpt-4.1-mini`. Never prefix the key with NEXT_PUBLIC. Without a key, raw notes still save and the notification indicates unavailable analysis. Seeded summaries remain fictional fixtures.

API reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Runtime permission

In addition to the read grants in [search-leads.md](search-leads.md), the restricted runtime role needs:

```sql
GRANT INSERT ON "Interaction" TO search_memory_app;
```

The local demo role has this grant. UPDATE/DELETE permissions and schema changes are not required for this logging flow.

## Verification

Unit tests cover input validation, original text preservation, safe website URLs, and last-contact semantics. Integration tests cover real PostgreSQL writes, author attribution, tenant isolation, duplicate retries, AI failure atomicity, suppression, and history order. API-contract tests use mocked HTTP responses to exercise validation, refusal, incomplete output, and upstream errors without spending API credits.

For deterministic browser tests, use a disposable seeded database and run:

```sh
TEST_AI_FIXTURE=true TEST_ADMIN_DATABASE_URL='<admin URL for the app database>' CHROME_PATH=/usr/bin/google-chrome npm run test:e2e
```

Omit CHROME_PATH if using Playwright's installed browser. The fixture launches a separate app on port 3001 with a local fake OpenAI HTTP endpoint. It tests failure → saved raw notes → new successful analysis → success toast → timeline → reload → organization isolation. The fixture lives under tests and does not enable a mock mode in the application. Browser fixtures create and remove their own company. Real-model extraction quality requires a separate live test with a valid API key.

The fallback parser accepts plain JSON or one complete fenced JSON block, then applies the same strict schema without coercion or guessed repairs. DO_NOT_CONTACT responses have follow-up cleared and outreach suppressed. Numeric month intervals generate an approximate follow-up from the save timestamp (whole calendar months with month-end clamping; fractions use 30-day months); the exact original interval remains in aiAnalysis. Unspecified timing is null. Failed entries are not automatically reanalyzed by duplicate save retries; a reanalysis workflow is deferred.

## AI Relationship Intelligence card

Company pages show the card only when the current organization has history. It reads the latest interaction from the existing tenant-scoped query, with no additional AI request. The full stored JSON supplies status, readiness, sentiment, succession signal, action, and keyContext (falling back to the stored summary for the explanation). Legacy seeded interactions use their stored structured columns and summary. Missing reasoning remains explicitly unavailable; failed latest analyses never borrow an older AI explanation. Do Not Contact suppresses outreach and follow-up, including when suppression originated in an earlier stored interaction.

## Do Not Contact safeguards

Do Not Contact renders as a solid red badge, a red company-page warning banner, and a tinted Search Leads row. History and intelligence remain readable. The current contact logging form treats Call, Email, Meeting, LinkedIn, and Other as contact entries and requires a fresh, explicit checkbox confirmation for suppressed companies. Confirmation is validated as a boolean server-side and its timestamp is stored with the interaction. It records an acknowledgment, never permission to resume outreach or a status reset.

The service checks the signed session's organization/company scope before AI analysis and rechecks before insertion to catch a restriction added while a form was open or AI was running. The UI handles this server challenge without losing the form's notes. Successful idempotent retries return the existing entry. An Acme restriction never requires confirmation for Beta. The existing sticky suppression policy remains: no explicit re-opt-in workflow has been implemented, so later AI output cannot clear a stored Do Not Contact request.
