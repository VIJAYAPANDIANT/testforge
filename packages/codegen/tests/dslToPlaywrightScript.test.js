import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dslToPlaywrightScript, writePlaywrightTestFile } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Playwright Full Test Code Generator (dslToPlaywrightScript)', () => {
  test('1. Converts complete valid 7-step DSL into Playwright .spec.ts content', () => {
    const dslPath = path.join(__dirname, '../examples/full-test.json');
    const dsl = JSON.parse(fs.readFileSync(dslPath, 'utf8'));

    const expectedPath = path.join(__dirname, '../examples/generated/full-test.spec.ts');
    const expectedScript = fs.readFileSync(expectedPath, 'utf8');

    const generatedScript = dslToPlaywrightScript(dsl);
    assert.equal(generatedScript, expectedScript);
  });

  test('2. Includes mandatory ES module Playwright imports', () => {
    const dsl = {
      version: '1.0',
      name: 'Single Step Test',
      steps: [{ id: 's1', type: 'navigate', url: 'https://example.com' }],
    };
    const script = dslToPlaywrightScript(dsl);
    assert.ok(script.startsWith('import { test, expect } from "@playwright/test";'));
  });

  test('3. Safely escapes test name and prevents code injection in test wrapper', () => {
    const maliciousDsl = {
      version: '1.0',
      name: 'Malicious"); process.exit(1); //',
      steps: [{ id: 's1', type: 'navigate', url: 'https://example.com' }],
    };
    const script = dslToPlaywrightScript(maliciousDsl);
    assert.ok(script.includes('test("Malicious\\"); process.exit(1); //", async ({ page }) => {'));
  });

  test('4. Generates process.env variable for {{BASE_URL}} placeholders', () => {
    const dsl = {
      version: '1.0',
      name: 'Env Test',
      steps: [{ id: 's1', type: 'navigate', url: '{{BASE_URL}}/dashboard' }],
    };
    const script = dslToPlaywrightScript(dsl);
    assert.ok(script.includes('await page.goto(`${process.env.BASE_URL}/dashboard`);'));
  });

  test('5. Safely encodes malicious step values against code injection', () => {
    const dsl = {
      version: '1.0',
      name: 'Injection Guard Test',
      steps: [
        {
          id: 's1',
          type: 'fill',
          locator: { strategy: 'css', value: '#input' },
          value: '"); console.log("HACKED"); //',
        },
        {
          id: 's2',
          type: 'assertText',
          locator: { strategy: 'css', value: '#status' },
          expectedText: '"); process.exit(1); //',
        },
      ],
    };
    const script = dslToPlaywrightScript(dsl);

    assert.ok(script.includes('fill("\\"); console.log(\\"HACKED\\"); //")'));
    assert.ok(script.includes('toHaveText("\\"); process.exit(1); //")'));
  });

  test('6. Rejects invalid DSL and throws descriptive error', () => {
    const invalidDsl = {
      version: '1.0',
      name: 'Invalid Test',
      steps: [{ id: 's1', type: 'navigate', url: 'ftp://invalid-url.com' }],
    };

    assert.throws(
      () => dslToPlaywrightScript(invalidDsl),
      /Invalid TestForge DSL/
    );
  });

  test('7. Rejects empty steps array', () => {
    const emptyDsl = {
      version: '1.0',
      name: 'Empty Test',
      steps: [],
    };

    assert.throws(
      () => dslToPlaywrightScript(emptyDsl),
      /Steps array must contain at least 1 step/
    );
  });

  test('8. Rejects unsupported step types', () => {
    const badStepDsl = {
      version: '1.0',
      name: 'Bad Step Test',
      steps: [{ id: 's1', type: 'hover' }],
    };

    assert.throws(
      () => dslToPlaywrightScript(badStepDsl),
      /Unsupported step type: hover/
    );
  });

  test('9. writePlaywrightTestFile writes file and creates target directories', () => {
    const dsl = {
      version: '1.0',
      name: 'File Writer Test',
      steps: [{ id: 's1', type: 'wait', duration: 500 }],
    };

    const targetPath = path.join(__dirname, '../scratch/test-output/writer-test.spec.ts');

    // Clean up if exists
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    const writtenPath = writePlaywrightTestFile(dsl, targetPath);
    assert.ok(fs.existsSync(writtenPath));

    const content = fs.readFileSync(writtenPath, 'utf8');
    assert.ok(content.includes('test("File Writer Test", async ({ page }) => {'));
    assert.ok(content.includes('await page.waitForTimeout(500);'));

    // Clean up
    fs.unlinkSync(targetPath);
  });
});
