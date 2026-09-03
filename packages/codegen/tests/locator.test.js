import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateLocator, generateSingleLocator, generateStep, dslToPlaywrightScript } from '../src/index.js';

describe('Day 10 — Locator Generation & Validation', () => {
  describe('ROLE Locator', () => {
    test('role locator without name (using role property)', () => {
      const code = generateLocator({ strategy: 'role', role: 'button' });
      assert.equal(code, 'page.getByRole("button")');
    });

    test('role locator without name (using value property)', () => {
      const code = generateLocator({ strategy: 'role', value: 'button' });
      assert.equal(code, 'page.getByRole("button")');
    });

    test('role locator with name', () => {
      const code = generateLocator({ strategy: 'role', role: 'button', name: 'Login' });
      assert.equal(code, 'page.getByRole("button", { name: "Login" })');
    });

    test('throws error when role/value is missing', () => {
      assert.throws(
        () => generateLocator({ strategy: 'role' }),
        /Invalid role locator: "role" or "value" is required/
      );
    });

    test('throws error when role is empty string', () => {
      assert.throws(
        () => generateLocator({ strategy: 'role', role: '  ' }),
        /Invalid role locator: "role" or "value" is required/
      );
    });
  });

  describe('TEXT Locator', () => {
    test('text locator with value', () => {
      const code = generateLocator({ strategy: 'text', value: 'Login' });
      assert.equal(code, 'page.getByText("Login")');
    });

    test('throws error when text value is missing', () => {
      assert.throws(
        () => generateLocator({ strategy: 'text' }),
        /Invalid text locator: "value" is required/
      );
    });

    test('throws error when text value is empty string', () => {
      assert.throws(
        () => generateLocator({ strategy: 'text', value: '  ' }),
        /Invalid text locator: "value" is required/
      );
    });
  });

  describe('CSS Locator', () => {
    test('css locator with ID selector', () => {
      const code = generateLocator({ strategy: 'css', value: '#login' });
      assert.equal(code, 'page.locator("#login")');
    });

    test('css locator with attribute selector', () => {
      const code = generateLocator({ strategy: 'css', value: '[data-testid="login"]' });
      assert.equal(code, 'page.locator("[data-testid=\\"login\\"]")');
    });

    test('throws error when css value is missing', () => {
      assert.throws(
        () => generateLocator({ strategy: 'css' }),
        /Invalid css locator: "value" is required/
      );
    });

    test('throws error when css value is empty string', () => {
      assert.throws(
        () => generateLocator({ strategy: 'css', value: '' }),
        /Invalid css locator: "value" is required/
      );
    });
  });

  describe('INVALID STRATEGY Validation', () => {
    test('throws unsupported strategy error for xpath', () => {
      assert.throws(
        () => generateLocator({ strategy: 'xpath', value: '//button' }),
        /Unsupported locator strategy: xpath/
      );
    });

    test('throws error when strategy is missing', () => {
      assert.throws(
        () => generateLocator({ value: 'button' }),
        /Locator strategy is required/
      );
    });
  });

  describe('FALLBACK LOCATOR', () => {
    test('generates valid Playwright fallback code when fallback exists', () => {
      const locator = {
        strategy: 'role',
        role: 'button',
        name: 'Login',
        fallback: {
          strategy: 'css',
          value: '#login',
        },
      };

      const code = generateLocator(locator);

      assert.ok(code.includes('page.getByRole("button", { name: "Login" })'));
      assert.ok(code.includes('page.locator("#login")'));
      assert.ok(code.includes('primary.count() > 0'));
    });

    test('throws clear error for invalid fallback strategy', () => {
      const locator = {
        strategy: 'role',
        role: 'button',
        fallback: {
          strategy: 'invalid',
          value: 'something',
        },
      };

      assert.throws(
        () => generateLocator(locator),
        /Invalid fallback locator: Unsupported locator strategy: invalid/
      );
    });

    test('throws clear error when fallback is missing required value', () => {
      const locator = {
        strategy: 'role',
        role: 'button',
        fallback: {
          strategy: 'css',
        },
      };

      assert.throws(
        () => generateLocator(locator),
        /Invalid fallback locator: Invalid css locator: "value" is required/
      );
    });

    test('throws clear error for nested fallbacks', () => {
      const locator = {
        strategy: 'role',
        role: 'button',
        fallback: {
          strategy: 'css',
          value: '#login',
          fallback: {
            strategy: 'text',
            value: 'Login',
          },
        },
      };

      assert.throws(
        () => generateLocator(locator),
        /Invalid fallback locator: nested fallbacks are not supported/
      );
    });

    test('throws error when fallback is identical to primary locator', () => {
      const locator = {
        strategy: 'css',
        value: '#login',
        fallback: {
          strategy: 'css',
          value: '#login',
        },
      };

      assert.throws(
        () => generateLocator(locator),
        /Invalid fallback locator: Fallback locator must not be identical to the primary locator/
      );
    });
  });

  describe('STRING ESCAPING in Locators', () => {
    test('safely escapes quotes, apostrophes, backslashes, and newlines in locator strings', () => {
      const locator = {
        strategy: 'role',
        role: 'button',
        name: 'John\'s "Account" \\ \n Login',
      };

      const code = generateLocator(locator);
      assert.equal(code, 'page.getByRole("button", { name: "John\'s \\"Account\\" \\\\ \\n Login" })');
    });
  });

  describe('FULL DSL REGRESSION WITH ALL 7 STEP TYPES', () => {
    test('generates valid Playwright TypeScript for complete 7-step DSL with locators & fallbacks', () => {
      const dsl = {
        version: '1.0',
        name: 'Day 10 Full Regression Test',
        steps: [
          {
            id: 'step-1',
            type: 'navigate',
            url: '{{BASE_URL}}/login',
          },
          {
            id: 'step-2',
            type: 'fill',
            locator: {
              strategy: 'role',
              role: 'textbox',
              name: 'Email',
            },
            value: 'test@example.com',
          },
          {
            id: 'step-3',
            type: 'fill',
            locator: {
              strategy: 'css',
              value: '#password',
            },
            value: 'password123',
          },
          {
            id: 'step-4',
            type: 'click',
            locator: {
              strategy: 'role',
              role: 'button',
              name: 'Login',
              fallback: {
                strategy: 'css',
                value: '#login',
              },
            },
          },
          {
            id: 'step-5',
            type: 'assertVisible',
            locator: {
              strategy: 'text',
              value: 'Dashboard',
            },
          },
          {
            id: 'step-6',
            type: 'assertText',
            locator: {
              strategy: 'css',
              value: '#message',
            },
            expectedText: 'Success',
          },
          {
            id: 'step-7',
            type: 'wait',
            duration: 1000,
          },
          {
            id: 'step-8',
            type: 'screenshot',
            name: 'login-success',
          },
        ],
      };

      const script = dslToPlaywrightScript(dsl);

      assert.ok(script.includes('import { test, expect } from "@playwright/test";'));
      assert.ok(script.includes('test("Day 10 Full Regression Test", async ({ page }) => {'));
      assert.ok(script.includes('await page.goto(`${process.env.BASE_URL}/login`);'));
      assert.ok(script.includes('await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");'));
      assert.ok(script.includes('await page.locator("#password").fill("password123");'));
      assert.ok(script.includes('page.getByRole("button", { name: "Login" })'));
      assert.ok(script.includes('page.locator("#login")'));
      assert.ok(script.includes('await expect(page.getByText("Dashboard")).toBeVisible();'));
      assert.ok(script.includes('await expect(page.locator("#message")).toHaveText("Success");'));
      assert.ok(script.includes('await page.waitForTimeout(1000);'));
      assert.ok(script.includes('await page.screenshot('));
    });
  });
});
