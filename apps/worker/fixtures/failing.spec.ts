import { test, expect } from '@playwright/test';

/**
 * Development Smoke Test — Intentionally FAILING.
 * Targets https://example.com and asserts incorrect text content to verify fail status & non-zero exit code.
 */
test('Development Smoke Test — Intentionally Failing Fixture', async ({ page }) => {
  await page.goto('https://example.com');

  await expect(page.locator('h1')).toHaveText('Non Existent Heading That Will Fail Intentionally', {
    timeout: 2000,
  });
});
