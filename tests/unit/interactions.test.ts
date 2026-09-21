import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  lastContacted,
  parseInteraction,
  safeWebsiteUrl,
} from "../../src/lib/interactions";
const valid = () => ({
  requestId: randomUUID(),
  companyId: "company",
  interactionType: "CALL",
  rawNotes: "Discussed a future partnership.",
  contactName: "Michael",
});
test("validates interaction fields and ignores submitted author/tenant identities", () => {
  const value = valid();
  assert.deepEqual(
    parseInteraction({ ...value, organizationId: "forged", userId: "forged", relationshipStatus: "DO_NOT_CONTACT", aiSummary: "Forged" }),
    value,
  );
  for (const changes of [
    { rawNotes: " \n\t " },
    { rawNotes: "a".repeat(10001) },
    { interactionType: "SMS" },
    { contactName: "a".repeat(201) },
    { requestId: "bad" },
    { companyId: "" },
  ])
    assert.throws(() => parseInteraction({ ...value, ...changes }));
});
test("preserves original notes and accepts Other and an unnamed contact", () => {
  const value = { ...valid(), rawNotes: "  Original notes.\n", contactName: "", interactionType: "OTHER" };
  assert.deepEqual(parseInteraction(value), value);
});
test("last contacted ignores newer internal notes and accepts note-only histories", () => {
  assert.equal(lastContacted([]), null);
  assert.equal(
    lastContacted([
      { interactionType: "NOTE", createdAt: new Date("2026-10-10") },
    ]),
    null,
  );
  const call = new Date("2026-09-10");
  assert.equal(
    lastContacted([
      { interactionType: "NOTE", createdAt: new Date("2026-10-10") },
      { interactionType: "EMAIL", createdAt: new Date("2026-08-10") },
      { interactionType: "CALL", createdAt: call },
    ]),
    call,
  );
});
test("website links allow only valid http and https URLs", () => {
  assert.equal(safeWebsiteUrl("https://demo.example"), "https://demo.example/");
  for (const value of [
    null,
    "javascript:alert(1)",
    "data:text/html,test",
    "not a url",
  ])
    assert.equal(safeWebsiteUrl(value), null);
});
