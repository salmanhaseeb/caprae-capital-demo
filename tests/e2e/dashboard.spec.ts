import { test, expect } from "@playwright/test";

test("search filters the database, navigates to companies, and isolates organization history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("result-count")).toHaveText("30");
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await expect(
    page.getByRole("columnheader", { name: "CEO", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Industry", { exact: true }).fill("SaaS");
  await page.getByLabel("Location", { exact: true }).fill("Austin");
  await page.getByLabel("Minimum employees", { exact: true }).fill("58");
  await page.getByLabel("Maximum employees", { exact: true }).fill("58");
  await page.getByLabel("Minimum revenue", { exact: false }).fill("8400000");
  await page.getByLabel("Maximum revenue", { exact: false }).fill("8400000");
  // Editing filters does not query until submitted.
  await expect(page.getByTestId("result-count")).toHaveText("30");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByTestId("result-count")).toHaveText("1");
  await expect(page.locator("tbody")).toContainText("Maya Ellison");
  await expect(page.locator("tbody")).toContainText("Warm");
  await page.getByRole("link", { name: /Ledgercrest Software/ }).click();
  await expect(page).toHaveURL(/\/companies\/demo-company-ledgercrest$/);
  await expect(
    page.getByRole("heading", { name: "Interaction Timeline" }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText(
    "Thirty-minute call with Maya",
  );
  await page
    .getByRole("button", { name: "Acme Software", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Beta Holdings" }).click();
  await expect(page.locator("main")).toContainText(
    "immediate full integration",
  );
  await expect(page.locator("main")).not.toContainText(
    "Thirty-minute call with Maya",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Beta Holdings", exact: true }),
  ).toBeVisible();
  await page.goto("/?location=Jacksonville");
  await expect(page.locator("tbody")).toContainText("Warm");
  await page
    .getByRole("button", { name: "Beta Holdings", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Acme Software" }).click();
  await expect(page.locator("tbody")).toContainText("New");
  await page.getByRole("link", { name: /SilverQuay Cold Chain/ }).click();
  await expect(
    page.getByRole("heading", { name: "No relationship history yet" }),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText(
    "second refrigerated facility",
  );
  // A URL organization ID cannot select someone else's tenant.
  await page.goto("/?location=Jacksonville&organizationId=demo-org-beta");
  await expect(page.locator("tbody")).toContainText("New");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Relationship Memory" })
    .click();
  await expect(
    page.getByRole("heading", { name: "MapleBridge Revenue Services" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SilverQuay Cold Chain" }),
  ).toHaveCount(0);
  await page.goto("/?location=Jacksonville");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.getByTestId("result-count")).toHaveText("30");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Showing 11–20 of 30 companies")).toBeVisible();
  await page.getByLabel("Location", { exact: true }).fill("No such location");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No companies match your filters" }),
  ).toBeVisible();
  await expect(page.getByTestId("result-count")).toHaveText("0");
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await page.getByLabel("Minimum employees", { exact: true }).fill("100");
  await page.getByLabel("Maximum employees", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Minimum employees cannot exceed maximum employees.",
  );
  expect(errors).toEqual([]);
});

test("mobile table stays within the viewport and company navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByTestId("result-count")).toHaveText("30");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Search Leads", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your next opportunity" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /BastionTrail Security/ }).click();
  await expect(page).toHaveURL(/\/companies\/demo-company-bastiontrail$/);
  await expect(page.locator("main")).toContainText("Do Not Contact");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("invalid signed demo sessions cannot read relationship history", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "search-memory-demo-session",
      value: "tampered.token",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto("/?location=Jacksonville");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "workspace session has expired",
  );
  await expect(page.locator("tbody tr")).toHaveCount(0);
});


test("relationship previews open on hover and click and remain organization-private", async ({ page }) => {
  await page.goto("/?location=Jacksonville");
  const badge = page.getByRole("button", { name: /relationship memory for SilverQuay Cold Chain/ });
  await expect(badge).toContainText("New");
  await badge.hover();
  const preview = page.getByRole("dialog", { name: "Relationship Memory for SilverQuay Cold Chain" });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("No contact recorded");
  await expect(preview).toContainText("No next action recorded.");
  await expect(preview.locator("div").filter({ has: page.locator("dt", { hasText: "Interaction Count" }) }).last()).toContainText("0");
  await badge.click();
  await page.mouse.move(0, 0);
  await expect(preview).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
  await page.getByRole("button", { name: "Acme Software", exact: true }).click();
  await page.getByRole("menuitem", { name: "Beta Holdings" }).click();
  await expect(badge).toContainText("Warm");
  await badge.focus();
  await page.keyboard.press("Enter");
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Private to Beta Holdings");
  await expect(preview).not.toContainText("No contact recorded");
  await expect(preview).not.toContainText("No next action recorded.");
  await preview.getByRole("button", { name: "Close relationship memory" }).click();
  await expect(preview).toHaveCount(0);
});
