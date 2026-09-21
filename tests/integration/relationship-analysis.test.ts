import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeRelationship, validateAnalysis, parseAnalysis, followUpDate } from "../../src/server/relationship-analysis";
import { analysisFixture, responseFixture } from "../support/analysis-fixture";

test("AI analysis sends only submitted context, validates structured output, and handles failures safely", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalFetch = globalThis.fetch;
  const input = { rawNotes: "Original private note", contactName: "Elena", interactionType: "CALL" as const };
  try {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(() => analyzeRelationship(input), /not configured/);
    process.env.OPENAI_API_KEY = "test-not-a-real-key";
    let payload: Record<string, unknown> | undefined;
    globalThis.fetch = async (_url, init) => {
      payload = JSON.parse(init!.body as string);
      return Response.json(responseFixture());
    };
    assert.deepEqual(await analyzeRelationship(input), analysisFixture);
    assert.equal(payload!.store, false);
    assert.deepEqual(parseAnalysis("```json\n" + JSON.stringify(analysisFixture) + "\n```"), analysisFixture);
    assert.throws(() => parseAnalysis("Some text " + JSON.stringify(analysisFixture)));
    assert.throws(() => parseAnalysis('{"summary":"partial"}'));
    assert.equal(validateAnalysis({ ...analysisFixture, followUpMonths: null }).followUpMonths, null);
    assert.equal(followUpDate(1, new Date("2027-01-31T12:00:00Z"))?.toISOString(), "2027-02-28T12:00:00.000Z");
    globalThis.fetch = async () => Response.json(responseFixture({ ...analysisFixture, relationshipStatus: "DO_NOT_CONTACT", followUpMonths: 6 }));
    const suppressed = await analyzeRelationship("Please do not contact me again.");
    assert.equal(suppressed.relationshipStatus, "DO_NOT_CONTACT");
    assert.equal(suppressed.followUpMonths, null);
    assert.match(suppressed.recommendedAction, /Do not contact/);
    assert.deepEqual(payload!.input, [{ role: "user", content: JSON.stringify(input) }]);
    assert.equal((payload!.text as { format: { strict: boolean } }).format.strict, true);
    for (const value of [
      { ...analysisFixture, relationshipStatus: "HALLUCINATED" },
      { ...analysisFixture, followUpMonths: -1 },
      { ...analysisFixture, followUpMonths: "next year" },
      { ...analysisFixture, summary: "" },
      { ...analysisFixture, successionSignal: "true" },
      { ...analysisFixture, extra: "not allowed" },
      { ...analysisFixture, sentiment: "UNKNOWN" },
    ]) assert.throws(() => validateAnalysis(value));
    globalThis.fetch = async () => Response.json({ ...responseFixture(), status: "incomplete", output: [] });
    await assert.rejects(() => analyzeRelationship(input), /could not complete/);
    globalThis.fetch = async () => Response.json({ ...responseFixture(), output: [{ type: "message", id: "msg_refuse", role: "assistant", content: [{ type: "refusal", refusal: "Cannot analyze" }] }] });
    await assert.rejects(() => analyzeRelationship(input), /could not complete/);
    globalThis.fetch = async () => { throw new Error("private upstream detail"); };
    await assert.rejects(() => analyzeRelationship(input), (error: Error) => {
      assert.match(error.message, /temporarily unavailable/);
      assert.doesNotMatch(error.message, /private upstream detail/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
