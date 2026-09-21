import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
test("company details show both memory states and save isolated interactions", async ({
  page,
}) => {
  test.skip(
    !process.env.TEST_ADMIN_DATABASE_URL || process.env.TEST_AI_FIXTURE !== "true",
    "Set TEST_ADMIN_DATABASE_URL and TEST_AI_FIXTURE=true.",
  );
  const admin = new Client({
    connectionString: process.env.TEST_ADMIN_DATABASE_URL,
  });
  await admin.connect();
  const id = `e2e-${randomUUID()}`;
  try {
    await admin.query(
      'INSERT INTO "Company" (id,name,domain,industry,location,"employeeCount","estimatedRevenue","ceoName",website) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [
        id,
        "Crestmark Facilities",
        `${id}.example`,
        "HVAC",
        "Austin, TX",
        47,
        "7250000",
        "Elena Marsh",
        "https://crestmark.example",
      ],
    );
    await page.goto(`/companies/${id}`);
    await expect(
      page.getByRole("heading", { name: "Crestmark Facilities" }),
    ).toBeVisible();
    await expect(page.locator("main header")).toContainText("HVAC");
    await expect(page.locator("main header")).toContainText("Austin, TX");
    await expect(
      page.getByRole("link", { name: /https:\/\/crestmark.example/ }),
    ).toHaveAttribute("href", "https://crestmark.example/");
    await expect(page.locator("main")).toContainText("$7,250,000");
    await expect(page.locator("main")).toContainText("Elena Marsh");
    await expect(
      page.getByRole("heading", { name: "Relationship Memory", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No relationship history yet" }),
    ).toBeVisible();
    await expect(
      page.getByText("This company is a new lead for your organization."),
    ).toBeVisible();
    const intelligence = page.getByRole("region", { name: "AI Relationship Intelligence", exact: true });
    await expect(intelligence).toHaveCount(0);
    await page
      .getByRole("button", { name: "Log First Interaction", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog.getByLabel("Notes", { exact: false })).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByLabel("Notes", { exact: false })).toBeFocused();
    await expect(dialog.getByRole("alert")).toContainText("Add a few details");
    await expect(dialog.getByRole("combobox")).toHaveCount(1);
    await expect(dialog.getByLabel("Relationship status")).toHaveCount(0);
    await expect(dialog.getByRole("option")).toHaveText(["Call", "Email", "Meeting", "LinkedIn", "Other"]);
    await dialog.getByLabel("Contact Name", { exact: false }).fill("Elena Marsh");
    await dialog.getByLabel("Notes", { exact: false }).fill("AI_FAILURE_TEST");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Your notes are safe. AI analysis is unavailable for this entry.")).toBeVisible();
    await expect(page.getByTestId("timeline-entry")).toHaveCount(1);
    await expect(intelligence).toBeVisible();
    await expect(intelligence).toContainText("AI analysis is unavailable for the latest interaction.");
    await expect(intelligence).toContainText("No supporting AI context was recorded");
    await expect(page.getByTestId("timeline-entry").first()).toContainText("AI analysis unavailable. Original notes saved.");
    await page.getByRole("button", { name: "Log Interaction", exact: true }).click();
    await dialog.getByLabel("Contact Name", { exact: false }).fill("Elena Marsh");
    await dialog.getByLabel("Notes", { exact: false }).fill("Acme spoke with Elena about a long-term partnership.");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Interaction saved", { exact: true }).last()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No relationship history yet" }),
    ).toHaveCount(0);
    for (const label of [
      "Current Relationship Status",
      "Last Contacted",
      "Next Follow-up",
      "Seller Readiness",
      "Interaction Timeline",
    ])
      await expect(
        page.getByRole("heading", { name: label, exact: true }),
      ).toBeVisible();
    await expect(page.getByTestId("timeline-entry")).toHaveCount(2);
    await expect(page.getByTestId("timeline-entry").first()).toContainText(
      "Acme spoke with Elena",
    );
    await expect(page.getByTestId("timeline-entry").first()).toContainText(
      "Jordan Blake",
    );
    await expect(page.getByTestId("timeline-entry").first()).toContainText(
      "Elena is exploring a long-term partnership",
    );
    await expect(page.getByTestId("timeline-entry").first()).toContainText(
      "Send two partnership examples.",
    );
    await expect(intelligence).toContainText("Exploring a long-term partnership; requested examples.");
    await expect(intelligence).toContainText("Send two partnership examples.");
    await expect(intelligence).toContainText("No signal recorded");
    await expect(intelligence).toContainText("Medium");
    await expect(intelligence).toContainText("Positive");
    await page.reload();
    await expect(page.getByTestId("timeline-entry")).toHaveCount(2);
    await page
      .getByRole("button", { name: "Acme Software", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Beta Holdings" }).click();
    await expect(
      page.getByRole("heading", { name: "No relationship history yet" }),
    ).toBeVisible();
    await expect(intelligence).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(
      "Acme spoke with Elena",
    );
    await page
      .getByRole("button", { name: "Log First Interaction", exact: true })
      .click();
    await dialog
      .getByLabel("Interaction type", { exact: true })
      .selectOption("OTHER");
    await dialog
      .getByLabel("Notes", { exact: false })
      .fill("Beta spoke with Elena at an industry event.");
    await dialog
      .getByRole("button", { name: "Save", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("timeline-entry").first()).toContainText("Other");
    await expect(page.getByTestId("timeline-entry").first()).toContainText(
      "Morgan Ellis",
    );
    await expect(page.getByTestId("timeline-entry").first()).not.toContainText(
      "Acme spoke with Elena",
    );
  } finally {
    await admin.query('DELETE FROM "Interaction" WHERE "companyId"=$1', [id]);
    await admin.query('DELETE FROM "Company" WHERE id=$1', [id]);
    await admin.end();
  }
});


test("Do Not Contact warns, requires confirmation, and stays tenant-specific", async ({ page }) => {
  test.skip(!process.env.TEST_ADMIN_DATABASE_URL || process.env.TEST_AI_FIXTURE !== "true", "Requires local AI fixture and disposable database");
  const admin = new Client({ connectionString: process.env.TEST_ADMIN_DATABASE_URL });
  await admin.connect();
  const id = `dnc-${randomUUID()}`;
  try {
    await admin.query('INSERT INTO "Company" (id,name,domain,location) VALUES ($1,$2,$3,$4)', [id, "Redwood Contact QA", `${id}.example`, id]);
    await admin.query('INSERT INTO "Interaction" (id,"organizationId","companyId","userId","interactionType","rawNotes","relationshipStatus") VALUES ($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), "demo-org-acme", id, "demo-user-acme-jordan", "CALL", "Please do not contact us again.", "DO_NOT_CONTACT"]);
    await page.goto(`/?location=${id}`);
    const row = page.getByRole("row").filter({ hasText: "Redwood Contact QA" });
    await expect(row).toContainText("Do Not Contact");
    await expect(row).toHaveClass(/bg-red/);
    await row.getByRole("link").click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Do not initiate outreach");
    await expect(page.getByTestId("timeline-entry")).toContainText("Please do not contact us again.");
    await page.getByRole("button", { name: "Log Interaction", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Notes", { exact: false }).fill("Documenting a prior call.");
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    const confirmation = dialog.getByRole("checkbox");
    await expect(confirmation).not.toBeChecked();
    await confirmation.check();
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("timeline-entry")).toHaveCount(2);
    await expect(page.locator("main").getByRole("alert")).toContainText("Do not initiate outreach");
    await page.getByRole("button", { name: "Log Interaction", exact: true }).click();
    await expect(dialog.getByRole("checkbox")).not.toBeChecked();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Acme Software", exact: true }).click();
    await page.getByRole("menuitem", { name: "Beta Holdings" }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "No relationship history yet" })).toBeVisible();
    await page.getByRole("button", { name: "Log First Interaction", exact: true }).click();
    await expect(dialog.getByRole("checkbox")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
  } finally {
    await admin.query('DELETE FROM "Interaction" WHERE "companyId"=$1', [id]);
    await admin.query('DELETE FROM "Company" WHERE id=$1', [id]);
    await admin.end();
  }
});
