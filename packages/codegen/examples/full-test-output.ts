await page.goto("https://example.com");

await page.getByRole("link", { name: "More information" }).click();

await page.locator("#search").fill("TestForge");

await expect(page.getByText("Example Domain")).toBeVisible();

await expect(page.locator("h1")).toHaveText("Example Domain");

await page.waitForTimeout(1000);

await page.screenshot({
  path: "complete-test.png",
  fullPage: true
});
