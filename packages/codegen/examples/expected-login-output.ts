await page.goto("https://example.com/login");

await page.locator("#email").fill("test@example.com");

await page.locator("#password").fill("password123");

await page.getByRole("button", { name: "Login" }).click();
