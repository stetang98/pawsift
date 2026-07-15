import { expect, test } from "@playwright/test";

test("renders the PawSift audit shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "PawSift" })
  ).toBeVisible();
  await expect(page.locator("#audit-console-root")).toBeAttached();
  await expect(page.locator("#audit-console-root")).toHaveText("");
});
