import { test, expect } from "@playwright/test";

test("Executable Example Domain Test", async ({ page }) => {
  await page.goto("https://example.com");

  await expect(page.getByRole("heading", { name: "Example Domain" })).toBeVisible();

  await expect(page.locator("h1")).toHaveText("Example Domain");

  await page.waitForTimeout(500);
});
