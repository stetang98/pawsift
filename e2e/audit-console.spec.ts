import { expect, test } from "@playwright/test";

test("default collar CLEAR flow renders a cryptographically verifiable receipt", async ({
  page
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Clear collar example" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "CLEAR" })).toBeVisible();
  await expect(page.getByText("PS-010", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Breakaway Reflective Collar for a adult cat.", { exact: true })
  ).toBeVisible();

  const receiptJson = await page.locator(".audit-json-block").textContent();
  expect(receiptJson).not.toBeNull();

  const receiptVerification = await page.evaluate(async (json) => {
    const envelope = JSON.parse(json) as {
      canonicalInput: string;
      canonicalReportWithoutReportHash: string;
      inputHash: string;
      reportHash: string;
    };
    const digest = async (value: string) => {
      const bytes = new TextEncoder().encode(value);
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
    };

    return {
      inputMatches: (await digest(envelope.canonicalInput)) === envelope.inputHash,
      reportMatches:
        (await digest(envelope.canonicalReportWithoutReportHash)) === envelope.reportHash
    };
  }, receiptJson!);

  expect(receiptVerification).toEqual({ inputMatches: true, reportMatches: true });

  await page.getByRole("button", { name: "Copy JSON" }).click();
  await expect(page.getByRole("button", { name: "Copied JSON" })).toBeVisible();
});

test("editing after an audit clears the stale verdict and receipt", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Clear collar example" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "CLEAR" })).toBeVisible();

  await page.getByRole("textbox", { name: "Product name" }).fill("Edited collar listing");

  await expect(page.getByRole("heading", { level: 2, name: "CLEAR" })).toHaveCount(0);
  await expect(page.locator(".audit-json-block")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Verdict panel" })).toBeVisible();
});

test("a delayed fixture response never overwrites a dirty draft", async ({ page }) => {
  await page.route("**/api/v1/examples", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });

  await page.goto("/");
  const productName = page.getByRole("textbox", { name: "Product name" });
  await productName.fill("Operator-authored listing");
  await expect(page.getByText("Endpoint ready", { exact: true })).toBeVisible();
  await expect(productName).toHaveValue("Operator-authored listing");
});

test("caution flow shows missing facts and listing patch guidance", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Missing materials" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "CAUTION" })).toBeVisible();
  await expect(page.getByText("PS-003", { exact: true })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: /^materials$/ })).toBeVisible();
  await expect(
    page.locator("li").filter({
      hasText:
        /^List the primary materials, including anything that touches the pet or its mouth\.$/
    })
  ).toBeVisible();
});

test("block flow renders the stable rule and remediation", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Species mismatch" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "BLOCK" })).toBeVisible();
  await expect(page.getByText("PS-001", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Align the listing species or choose a product intended for this pet.", {
      exact: true
    })
  ).toBeVisible();
});

test("unsupported scope flow surfaces HUMAN_REVIEW guidance", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Unsupported claim" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "HUMAN_REVIEW" })).toBeVisible();
  await expect(page.getByText("PS-008", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Request falls outside PawSift's supported non-veterinary scope.")
  ).toBeVisible();
  await expect(
    page.locator("li").filter({
      hasText:
        /^Replace medical or ingestible claims with observable, non-veterinary product facts\.$/
    })
  ).toBeVisible();
});

test("mobile keeps the console usable with 44 px command targets and no overflow", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Clear collar example" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run audit" })).toBeVisible();

  const linkHeights = await page.locator(".audit-command-links a").evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height)
  );
  expect(linkHeights.length).toBeGreaterThan(0);
  expect(linkHeights.every((height) => height >= 44)).toBe(true);

  await page.getByRole("button", { name: "Missing materials" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "CAUTION" })).toBeVisible();

  const hasOverflow = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return root.scrollWidth > window.innerWidth;
  });
  expect(hasOverflow).toBe(false);
});

test("320 px mobile keeps the OKX.AI status visible without horizontal overflow", async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "Agent 6036 · Listing under review" })
  ).toBeVisible();

  const hasOverflow = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return root.scrollWidth > window.innerWidth;
  });
  expect(hasOverflow).toBe(false);
});
