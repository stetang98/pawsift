import { expect, test } from "@playwright/test";

test("default collar CLEAR flow renders verdict, rule, and receipt copy state", async ({
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
  await expect(
    page
      .locator("p")
      .filter({
        hasText: /^No immediate listing patch is required from the supplied facts\.$/
      })
      .first()
  ).toBeVisible();

  await page.getByRole("button", { name: "Copy JSON" }).click();
  await expect(page.getByRole("button", { name: "Copied JSON" })).toBeVisible();
});

test("caution flow shows missing facts and listing patch guidance", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Missing materials" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "CAUTION" })).toBeVisible();
  await expect(page.getByText("PS-003", { exact: true })).toBeVisible();
  await expect(
    page.locator("li").filter({ hasText: /^materials$/ })
  ).toBeVisible();
  await expect(
    page
      .locator("li")
      .filter({
        hasText:
          /^List the primary materials, including anything that touches the pet or its mouth\.$/
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
    page
      .locator("li")
      .filter({
        hasText:
          /^Replace medical or ingestible claims with observable, non-veterinary product facts\.$/
      })
  ).toBeVisible();
});

test("mobile keeps the console usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });

  await page.goto("/");

  await expect(page.getByRole("button", { name: "Clear collar example" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run audit" })).toBeVisible();

  await page.getByRole("button", { name: "Missing materials" }).click();
  await page.getByRole("button", { name: "Run audit" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "CAUTION" })).toBeVisible();

  const hasOverflow = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return root.scrollWidth > window.innerWidth;
  });

  expect(hasOverflow).toBe(false);
});
