import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_FILTERS,
  parseLeadSearch,
  relationshipLabel,
  formatRevenue,
} from "../../src/lib/lead-search";
test("validates ranges without losing revenue precision", () => {
  assert.equal(
    parseLeadSearch({ minEmployees: "0", maxEmployees: "0" }).filters
      .minEmployees,
    "0",
  );
  assert.equal(
    parseLeadSearch({
      minRevenue: "9999999999999999.98",
      maxRevenue: "9999999999999999.99",
    }).filters.maxRevenue,
    "9999999999999999.99",
  );
  for (const params of [
    { minEmployees: "-1" },
    { maxEmployees: "1.5" },
    { minEmployees: "10", maxEmployees: "2" },
    { minRevenue: "-0.01" },
    { minRevenue: "0.001" },
    { minRevenue: "1e5" },
    { minRevenue: "9999999999999999.99", maxRevenue: "9999999999999999.98" },
    { minEmployees: ["2", "4"] },
    { page: "0" },
    { page: "9999999999999999999" },
  ])
    assert.throws(() => parseLeadSearch(params));
  assert.deepEqual(
    parseLeadSearch({ organizationId: "another-tenant" }).filters,
    EMPTY_FILTERS,
  );
  assert.equal(
    formatRevenue("9999999999999999.99"),
    "$9,999,999,999,999,999.99",
  );
});
test("maps only existing tenant history, with explicit suppression taking precedence", () => {
  const entry = {
    relationshipStatus: "CONTACTED",
    sellerReadiness: "UNKNOWN",
    nextFollowUpAt: null,
  };
  assert.equal(relationshipLabel(undefined, false), "New");
  assert.equal(relationshipLabel(entry, false), "Previously Contacted");
  assert.equal(
    relationshipLabel({ ...entry, relationshipStatus: "ENGAGED" }, false),
    "Warm",
  );
  assert.equal(
    relationshipLabel({ ...entry, relationshipStatus: "NURTURING" }, false),
    "Follow Up",
  );
  assert.equal(
    relationshipLabel({ ...entry, sellerReadiness: "READY" }, false),
    "Interested",
  );
  assert.equal(
    relationshipLabel({ ...entry, sellerReadiness: "READY" }, true),
    "Do Not Contact",
  );
  assert.equal(
    relationshipLabel(
      {
        ...entry,
        relationshipStatus: "NOT_INTERESTED",
        sellerReadiness: "READY",
      },
      false,
    ),
    "Previously Contacted",
  );
});
