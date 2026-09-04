import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPlaywrightTest, validateTestFilePath } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Day 11 — Playwright Execution Runner (apps/worker)', () => {
  describe('Input Validation & Path Safety', () => {
    test('Throws error for missing file path argument', () => {
      assert.throws(
        () => validateTestFilePath(''),
        /Test file path is required/
      );
    });

    test('Throws error for non-existent file path', () => {
      const fakePath = path.join(__dirname, '../fixtures/non-existent-file.spec.ts');
      assert.throws(
        () => validateTestFilePath(fakePath),
        /Test file not found/
      );
    });

    test('Throws error for invalid file extension', () => {
      const txtPath = path.join(__dirname, '../README.md');
      assert.throws(
        () => validateTestFilePath(txtPath),
        /Expected a Playwright test file/
      );
    });

    test('runPlaywrightTest returns failed result for non-existent file without crashing', async () => {
      const result = await runPlaywrightTest('./fixtures/non-existent.spec.ts');
      assert.equal(result.success, false);
      assert.equal(result.status, 'failed');
      assert.equal(result.exitCode, 1);
      assert.ok(result.stderr.includes('Test file not found'));
    });
  });

  describe('Environment Variable & BASE_URL Validation', () => {
    test('Fails cleanly when test requires BASE_URL but none is provided', async () => {
      const envTestPath = path.join(__dirname, '../../../../packages/codegen/examples/generated/full-test.spec.ts');
      const dslWithEnv = {
        version: '1.0',
        name: 'Env Required Test',
        steps: [{ id: 's1', type: 'navigate', url: '{{BASE_URL}}/login' }],
      };

      // Create temporary spec needing BASE_URL
      const tempPath = path.join(__dirname, '../fixtures/temp-env-test.spec.ts');
      const code = `import { test } from "@playwright/test"; test("Env", async ({ page }) => { await page.goto(\`\${process.env.BASE_URL}/login\`); });`;
      const fs = await import('node:fs');
      fs.writeFileSync(tempPath, code, 'utf8');

      try {
        const result = await runPlaywrightTest(tempPath, { baseUrl: '' });
        assert.equal(result.success, false);
        assert.equal(result.status, 'failed');
        assert.equal(result.exitCode, 1);
        assert.ok(result.stderr.includes('BASE_URL environment variable is required'));
      } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    });
  });

  describe('Playwright Standalone Execution (Chromium Headless)', () => {
    test('Executes passing smoke test fixture and returns PASS (exit code 0)', async () => {
      const passingFixturePath = path.join(__dirname, '../fixtures/passing.spec.ts');

      const result = await runPlaywrightTest(passingFixturePath);

      assert.equal(result.success, true);
      assert.equal(result.status, 'passed');
      assert.equal(result.exitCode, 0);
      assert.ok(typeof result.durationMs === 'number' && result.durationMs > 0);
      assert.ok(result.stdout.includes('1 passed') || result.stdout.includes('passed'));
    });

    test('Executes intentionally failing smoke test fixture and returns FAIL (exit code 1)', async () => {
      const failingFixturePath = path.join(__dirname, '../fixtures/failing.spec.ts');

      const result = await runPlaywrightTest(failingFixturePath);

      assert.equal(result.success, false);
      assert.equal(result.status, 'failed');
      assert.equal(result.exitCode, 1);
      assert.ok(typeof result.durationMs === 'number' && result.durationMs > 0);
    });
  });
});
