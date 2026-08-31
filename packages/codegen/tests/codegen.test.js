import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateNavigate,
  generateClick,
  generateFill,
  generateLocator,
  generateStep,
  generateSteps,
} from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Playwright Codegen Engine (Day 7)', () => {
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
      assert.equal(code, 'await page.goto(`${BASE_URL}/login`);');
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

  // ─── DISPATCHER & BATCH ─────────────────────────────────────────────────────

  describe('generateStep and generateSteps', () => {
    test('generateStep dispatches correctly', () => {
      const navCode = generateStep({ id: '1', type: 'navigate', url: 'https://a.com' });
      assert.equal(navCode, 'await page.goto("https://a.com");');

      const clickCode = generateStep({ id: '2', type: 'click', locator: { strategy: 'css', value: '#btn' } });
      assert.equal(clickCode, 'await page.locator("#btn").click();');

      const fillCode = generateStep({ id: '3', type: 'fill', locator: { strategy: 'css', value: '#input' }, value: 'abc' });
      assert.equal(fillCode, 'await page.locator("#input").fill("abc");');
    });

    test('Throws error for Day 7 unsupported step type (e.g. assertVisible)', () => {
      assert.throws(
        () => generateStep({ id: '1', type: 'assertVisible', locator: { strategy: 'css', value: '#btn' } }),
        /Unsupported step type for Day 7 codegen: assertVisible/
      );
    });

    test('generateSteps converts sample login DSL to expected Playwright output', () => {
      const samplePath = path.join(__dirname, '../examples/sample-login.json');
      const sampleJson = JSON.parse(fs.readFileSync(samplePath, 'utf8'));

      const expectedPath = path.join(__dirname, '../examples/expected-login-output.ts');
      const expectedOutput = fs.readFileSync(expectedPath, 'utf8').trim();

      const generatedCode = generateSteps(sampleJson).trim();
      assert.equal(generatedCode, expectedOutput);
    });
  });
});
