import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateNavigate,
  generateClick,
  generateFill,
  generateAssertVisible,
  generateAssertText,
  generateWait,
  generateScreenshot,
  generateLocator,
  generateStep,
  generateSteps,
  sanitizeScreenshotFilename,
} from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Playwright Codegen Engine (Day 8 — All 7 Steps)', () => {
  // ─── NAVIGATE ───────────────────────────────────────────────────────────────

  describe('generateNavigate', () => {
    test('Generates page.goto for HTTPS URL', () => {
      const step = { id: 'step-1', type: 'navigate', url: 'https://example.com' };
      const code = generateNavigate(step);
      assert.equal(code, 'await page.goto("https://example.com");');
    });

    test('Generates page.goto for HTTP localhost URL', () => {
      const step = { id: 'step-1', type: 'navigate', url: 'http://localhost:3000' };
      const code = generateNavigate(step);
      assert.equal(code, 'await page.goto("http://localhost:3000");');
    });

    test('Generates template literal for {{BASE_URL}} placeholder', () => {
      const step = { id: 'step-1', type: 'navigate', url: '{{BASE_URL}}/login' };
      const code = generateNavigate(step);
      assert.equal(code, 'await page.goto(`${process.env.BASE_URL}/login`);');
    });

    test('Throws error for missing or empty URL', () => {
      assert.throws(
        () => generateNavigate({ id: 'step-1', type: 'navigate', url: '' }),
        /Navigate step requires a valid URL/
      );
    });
  });

  // ─── LOCATORS ───────────────────────────────────────────────────────────────

  describe('generateLocator', () => {
    test('Role locator without name', () => {
      const code = generateLocator({ strategy: 'role', value: 'button' });
      assert.equal(code, 'page.getByRole("button")');
    });

    test('Role locator with name', () => {
      const code = generateLocator({ strategy: 'role', value: 'button', name: 'Login' });
      assert.equal(code, 'page.getByRole("button", { name: "Login" })');
    });

    test('Text locator', () => {
      const code = generateLocator({ strategy: 'text', value: 'Welcome Back' });
      assert.equal(code, 'page.getByText("Welcome Back")');
    });

    test('CSS locator', () => {
      const code = generateLocator({ strategy: 'css', value: '#login-button' });
      assert.equal(code, 'page.locator("#login-button")');
    });

    test('Throws error for invalid locator strategy', () => {
      assert.throws(
        () => generateLocator({ strategy: 'xpath', value: '//button' }),
        /Unsupported locator strategy: xpath/
      );
    });
  });

  // ─── CLICK ──────────────────────────────────────────────────────────────────

  describe('generateClick', () => {
    test('Click with Role locator', () => {
      const step = {
        id: 'step-2',
        type: 'click',
        locator: { strategy: 'role', value: 'button', name: 'Submit' },
      };
      const code = generateClick(step);
      assert.equal(code, 'await page.getByRole("button", { name: "Submit" }).click();');
    });

    test('Click with Text locator', () => {
      const step = {
        id: 'step-2',
        type: 'click',
        locator: { strategy: 'text', value: 'Learn More' },
      };
      const code = generateClick(step);
      assert.equal(code, 'await page.getByText("Learn More").click();');
    });

    test('Click with CSS locator', () => {
      const step = {
        id: 'step-2',
        type: 'click',
        locator: { strategy: 'css', value: '.btn-primary' },
      };
      const code = generateClick(step);
      assert.equal(code, 'await page.locator(".btn-primary").click();');
    });

    test('Throws error when locator is missing', () => {
      assert.throws(
        () => generateClick({ id: 'step-2', type: 'click' }),
        /Click step requires a locator object/
      );
    });
  });

  // ─── FILL ───────────────────────────────────────────────────────────────────

  describe('generateFill', () => {
    test('Fill with CSS locator', () => {
      const step = {
        id: 'step-3',
        type: 'fill',
        locator: { strategy: 'css', value: '#email' },
        value: 'test@example.com',
      };
      const code = generateFill(step);
      assert.equal(code, 'await page.locator("#email").fill("test@example.com");');
    });

    test('Fill with Role locator', () => {
      const step = {
        id: 'step-3',
        type: 'fill',
        locator: { strategy: 'role', value: 'textbox', name: 'Username' },
        value: 'admin',
      };
      const code = generateFill(step);
      assert.equal(code, 'await page.getByRole("textbox", { name: "Username" }).fill("admin");');
    });

    test('Fill with Text locator', () => {
      const step = {
        id: 'step-3',
        type: 'fill',
        locator: { strategy: 'text', value: 'Enter Name' },
        value: 'John',
      };
      const code = generateFill(step);
      assert.equal(code, 'await page.getByText("Enter Name").fill("John");');
    });

    test('Fill with empty string (clearing field)', () => {
      const step = {
        id: 'step-3',
        type: 'fill',
        locator: { strategy: 'css', value: '#search' },
        value: '',
      };
      const code = generateFill(step);
      assert.equal(code, 'await page.locator("#search").fill("");');
    });

    test('Fill with quotes and special characters (escaping & injection check)', () => {
      const maliciousVal = 'John "Smith"\\Test"); process.exit(1); //';
      const step = {
        id: 'step-3',
        type: 'fill',
        locator: { strategy: 'css', value: '#name' },
        value: maliciousVal,
      };
      const code = generateFill(step);
      assert.equal(
        code,
        'await page.locator("#name").fill("John \\"Smith\\"\\\\Test\\"); process.exit(1); //");'
      );
    });

    test('Throws error when value is missing', () => {
      assert.throws(
        () => generateFill({ id: 'step-3', type: 'fill', locator: { strategy: 'css', value: '#email' } }),
        /Fill step requires a string value/
      );
    });
  });

  // ─── ASSERT VISIBLE ─────────────────────────────────────────────────────────

  describe('generateAssertVisible', () => {
    test('AssertVisible with Role locator', () => {
      const step = {
        id: 'step-4',
        type: 'assertVisible',
        locator: { strategy: 'role', value: 'heading', name: 'Welcome' },
      };
      const code = generateAssertVisible(step);
      assert.equal(code, 'await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();');
    });

    test('AssertVisible with Text locator', () => {
      const step = {
        id: 'step-4',
        type: 'assertVisible',
        locator: { strategy: 'text', value: 'Dashboard' },
      };
      const code = generateAssertVisible(step);
      assert.equal(code, 'await expect(page.getByText("Dashboard")).toBeVisible();');
    });

    test('AssertVisible with CSS locator', () => {
      const step = {
        id: 'step-4',
        type: 'assertVisible',
        locator: { strategy: 'css', value: '.welcome-banner' },
      };
      const code = generateAssertVisible(step);
      assert.equal(code, 'await expect(page.locator(".welcome-banner")).toBeVisible();');
    });

    test('Throws error when locator is missing', () => {
      assert.throws(
        () => generateAssertVisible({ id: 'step-4', type: 'assertVisible' }),
        /Locator is required for assertVisible step/
      );
    });
  });

  // ─── ASSERT TEXT ────────────────────────────────────────────────────────────

  describe('generateAssertText', () => {
    test('AssertText with CSS locator', () => {
      const step = {
        id: 'step-5',
        type: 'assertText',
        locator: { strategy: 'css', value: '.welcome-message' },
        expectedText: 'Welcome',
      };
      const code = generateAssertText(step);
      assert.equal(code, 'await expect(page.locator(".welcome-message")).toHaveText("Welcome");');
    });

    test('AssertText with Role locator', () => {
      const step = {
        id: 'step-5',
        type: 'assertText',
        locator: { strategy: 'role', value: 'heading', name: 'Dashboard' },
        expectedText: 'Dashboard',
      };
      const code = generateAssertText(step);
      assert.equal(
        code,
        'await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveText("Dashboard");'
      );
    });

    test('AssertText with special characters and multiline text', () => {
      const step = {
        id: 'step-5',
        type: 'assertText',
        locator: { strategy: 'css', value: '#msg' },
        expectedText: 'Hello "World"\nLine 2',
      };
      const code = generateAssertText(step);
      assert.equal(
        code,
        'await expect(page.locator("#msg")).toHaveText("Hello \\"World\\"\\nLine 2");'
      );
    });

    test('Throws error when expectedText is missing', () => {
      assert.throws(
        () => generateAssertText({ id: 'step-5', type: 'assertText', locator: { strategy: 'css', value: '#msg' } }),
        /expectedText is required for assertText step/
      );
    });
  });

  // ─── WAIT ───────────────────────────────────────────────────────────────────

  describe('generateWait', () => {
    test('Wait for 100 ms', () => {
      const code = generateWait({ id: 'step-6', type: 'wait', duration: 100 });
      assert.equal(code, 'await page.waitForTimeout(100);');
    });

    test('Wait for 1000 ms', () => {
      const code = generateWait({ id: 'step-6', type: 'wait', duration: 1000 });
      assert.equal(code, 'await page.waitForTimeout(1000);');
    });

    test('Wait for 120000 ms', () => {
      const code = generateWait({ id: 'step-6', type: 'wait', duration: 120000 });
      assert.equal(code, 'await page.waitForTimeout(120000);');
    });

    test('Throws error when duration is missing', () => {
      assert.throws(
        () => generateWait({ id: 'step-6', type: 'wait' }),
        /duration is required for wait step/
      );
    });

    test('Throws error when duration is invalid or non-positive', () => {
      assert.throws(
        () => generateWait({ id: 'step-6', type: 'wait', duration: -500 }),
        /Invalid wait duration/
      );
    });
  });

  // ─── SCREENSHOT ─────────────────────────────────────────────────────────────

  describe('generateScreenshot & sanitizeScreenshotFilename', () => {
    test('Sanitizes filenames and path traversal cleanly', () => {
      assert.equal(sanitizeScreenshotFilename('homepage', 'step-7'), 'homepage.png');
      assert.equal(sanitizeScreenshotFilename('login success', 'step-7'), 'login-success.png');
      assert.equal(sanitizeScreenshotFilename('../../secret', 'step-7'), 'secret.png');
      assert.equal(sanitizeScreenshotFilename(undefined, 'step-7'), 'step-7.png');
    });

    test('Screenshot with explicit name and fullPage: true', () => {
      const step = { id: 'step-7', type: 'screenshot', name: 'homepage', fullPage: true };
      const code = generateScreenshot(step);
      assert.equal(code, 'await page.screenshot({\n  path: "homepage.png",\n  fullPage: true\n});');
    });

    test('Screenshot with fullPage: false', () => {
      const step = { id: 'step-7', type: 'screenshot', name: 'homepage', fullPage: false };
      const code = generateScreenshot(step);
      assert.equal(code, 'await page.screenshot({\n  path: "homepage.png",\n  fullPage: false\n});');
    });

    test('Screenshot without name uses step ID fallback', () => {
      const step = { id: 'step-7', type: 'screenshot' };
      const code = generateScreenshot(step);
      assert.equal(code, 'await page.screenshot({\n  path: "step-7.png",\n  fullPage: false\n});');
    });
  });

  // ─── DISPATCHER & BATCH ALL 7 STEPS ─────────────────────────────────────────

  describe('generateStep and generateSteps for all 7 step types', () => {
    test('generateStep dispatches all 7 step types correctly', () => {
      assert.equal(generateStep({ id: '1', type: 'navigate', url: 'https://a.com' }), 'await page.goto("https://a.com");');
      assert.equal(generateStep({ id: '2', type: 'click', locator: { strategy: 'css', value: '#btn' } }), 'await page.locator("#btn").click();');
      assert.equal(generateStep({ id: '3', type: 'fill', locator: { strategy: 'css', value: '#in' }, value: 'v' }), 'await page.locator("#in").fill("v");');
      assert.equal(generateStep({ id: '4', type: 'assertVisible', locator: { strategy: 'css', value: '#v' } }), 'await expect(page.locator("#v")).toBeVisible();');
      assert.equal(generateStep({ id: '5', type: 'assertText', locator: { strategy: 'css', value: '#t' }, expectedText: 'T' }), 'await expect(page.locator("#t")).toHaveText("T");');
      assert.equal(generateStep({ id: '6', type: 'wait', duration: 500 }), 'await page.waitForTimeout(500);');
      assert.equal(generateStep({ id: '7', type: 'screenshot', name: 'sc' }), 'await page.screenshot({\n  path: "sc.png",\n  fullPage: false\n});');
    });

    test('Throws error for unsupported step type', () => {
      assert.throws(
        () => generateStep({ id: '1', type: 'hover', locator: { strategy: 'css', value: '#btn' } }),
        /Unsupported step type: hover/
      );
    });

    test('generateSteps converts full 7-step sample DSL to expected Playwright output', () => {
      const fullJsonPath = path.join(__dirname, '../examples/full-test.json');
      const fullJson = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));

      const expectedPath = path.join(__dirname, '../examples/full-test-output.ts');
      const expectedOutput = fs.readFileSync(expectedPath, 'utf8').trim();

      const generatedCode = generateSteps(fullJson).trim();
      assert.equal(generatedCode, expectedOutput);
    });
  });
});
