import { test, expect } from '@playwright/test';

/**
 * Development Smoke Test — Intentionally PASSING.
 * Targets https://example.com and verifies actual page heading elements.
 */
test('Development Smoke Test — Passing Fixture', async ({ page }) => {
  await page.goto('https://example.com');

  await expect(page.getByRole('heading', { name: 'Example Domain' })).toBeVisible();

  await expect(page.locator('h1')).toHaveText('Example Domain');
});
