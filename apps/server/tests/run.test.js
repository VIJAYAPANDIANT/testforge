import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTestCaseExecution } from '../src/services/execution.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Day 12 — Execution Service (apps/server)', () => {
  describe('Input & DSL Validation', () => {
    test('Returns 400 error when testCase payload is missing', async () => {
      const result = await runTestCaseExecution({});
      assert.equal(result.statusCode, 400);
      assert.equal(result.success, false);
      assert.equal(result.message, 'Invalid test case payload');
    });

    test('Returns 400 error when DSL validation fails', async () => {
      const invalidTestCase = {
        _id: '507f1f77bcf86cd799439011',
        dsl: {
          version: '1.0',
          name: 'Invalid DSL',
          steps: [{ id: 's1', type: 'navigate', url: 'invalid-url-format' }],
        },
      };

      const result = await runTestCaseExecution({ testCase: invalidTestCase });
      assert.equal(result.statusCode, 400);
      assert.equal(result.success, false);
      assert.equal(result.message, 'Invalid test DSL');
      assert.ok(Array.isArray(result.details) && result.details.length > 0);
    });

    test('Returns 400 error when BASE_URL is required but not provided', async () => {
      const envTestCase = {
        _id: '507f1f77bcf86cd799439012',
        dsl: {
          version: '1.0',
          name: 'Env Required Test',
          steps: [{ id: 's1', type: 'navigate', url: '{{BASE_URL}}/login' }],
        },
      };

      const originalBaseUrl = process.env.BASE_URL;
      delete process.env.BASE_URL;

      try {
        const result = await runTestCaseExecution({ testCase: envTestCase, environment: null });
        assert.equal(result.statusCode, 400);
        assert.equal(result.success, false);
        assert.ok(result.message.includes('BASE_URL environment variable is required'));
      } finally {
        if (originalBaseUrl) process.env.BASE_URL = originalBaseUrl;
      }
    });
  });

  describe('Playwright Worker Child Process Spawning', () => {
    test('Executes passing test case DSL and returns status passed (exitCode 0)', async () => {
      const passingTestCase = {
        _id: '507f1f77bcf86cd799439013',
        dsl: {
          version: '1.0',
          name: 'Passing Execution Test',
          steps: [
            {
              id: 's1',
              type: 'navigate',
              url: 'https://example.com',
            },
            {
              id: 's2',
              type: 'assertVisible',
              locator: {
                strategy: 'role',
                role: 'heading',
                name: 'Example Domain',
              },
            },
          ],
        },
      };

      const result = await runTestCaseExecution({ testCase: passingTestCase });

      assert.equal(result.statusCode, 200);
      assert.equal(result.success, true);
      assert.equal(result.data.status, 'passed');
      assert.equal(result.data.exitCode, 0);
      assert.equal(result.data.screenshotPath, null);
      assert.ok(typeof result.data.durationMs === 'number' && result.data.durationMs > 0);
    });

    test('Executes failing test case DSL and returns status failed (exitCode 1) with screenshotPath', async () => {
      const failingTestCase = {
        _id: '507f1f77bcf86cd799439014',
        dsl: {
          version: '1.0',
          name: 'Failing Execution Test',
          steps: [
            {
              id: 's1',
              type: 'navigate',
              url: 'https://example.com',
            },
            {
              id: 's2',
              type: 'assertText',
              locator: {
                strategy: 'css',
                value: 'h1',
              },
              expectedText: 'Non Existent Heading That Will Fail Intentionally',
            },
          ],
        },
      };

      const result = await runTestCaseExecution({ testCase: failingTestCase });

      assert.equal(result.statusCode, 200);
      assert.equal(result.success, false);
      assert.equal(result.data.status, 'failed');
      assert.equal(result.data.exitCode, 1);
      assert.ok(typeof result.data.screenshotPath === 'string');
      assert.ok(result.data.screenshotPath.startsWith('/uploads/screenshots/'));
      assert.ok(result.data.screenshotPath.endsWith('.png'));
      assert.ok(typeof result.data.durationMs === 'number' && result.data.durationMs > 0);
    });

    test('Cleans up temporary spec files after execution', async () => {
      const repoRoot = path.resolve(__dirname, '../../..');
      const tempRunDir = path.resolve(repoRoot, 'scratch/testforge-runs');

      const initialFiles = fs.existsSync(tempRunDir) ? fs.readdirSync(tempRunDir) : [];

      const testCase = {
        _id: '507f1f77bcf86cd799439015',
        dsl: {
          version: '1.0',
          name: 'Cleanup Verification Test',
          steps: [{ id: 's1', type: 'navigate', url: 'https://example.com' }],
        },
      };

      await runTestCaseExecution({ testCase });

      const finalFiles = fs.existsSync(tempRunDir) ? fs.readdirSync(tempRunDir) : [];

      // Temporary files created during run must be cleaned up
      assert.equal(finalFiles.length, initialFiles.length);
    });
  });

  describe('Day 13 — Failure Screenshot Integration', () => {
    test('Failing execution result provides valid screenshot file path', async () => {
      const failingTestCase = {
        _id: '507f1f77bcf86cd799439016',
        dsl: {
          version: '1.0',
          name: 'Screenshot Integration Test',
          steps: [
            { id: 's1', type: 'navigate', url: 'https://example.com' },
            { id: 's2', type: 'click', locator: { strategy: 'css', value: '#non-existent-button-xyz' } },
          ],
        },
      };

      const result = await runTestCaseExecution({ testCase: failingTestCase });

      assert.equal(result.statusCode, 200);
      assert.equal(result.success, false);
      assert.equal(result.data.status, 'failed');
      assert.ok(typeof result.data.screenshotPath === 'string');
      assert.ok(result.data.screenshotPath.startsWith('/uploads/screenshots/'));

      // Verify that the screenshot file actually exists on disk in worker/uploads
      const relativePart = result.data.screenshotPath.substring('/uploads/'.length);
      const repoRoot = path.resolve(__dirname, '../../..');
      const localFilePath = path.resolve(repoRoot, 'apps/worker/uploads', relativePart);
      assert.ok(fs.existsSync(localFilePath), `Screenshot file should exist at ${localFilePath}`);
    });
  });

  describe('Day 14 — Persistence & Run Result Recording', () => {
    test('Execution service returns valid runId in response data', async () => {
      const testCase = {
        _id: '507f1f77bcf86cd799439017',
        dsl: {
          version: '1.0',
          name: 'RunId Persistence Test',
          steps: [{ id: 's1', type: 'navigate', url: 'https://example.com' }],
        },
      };

      const result = await runTestCaseExecution({ testCase });
      assert.equal(result.statusCode, 200);
      assert.equal(result.success, true);
      assert.ok(typeof result.data.runId === 'string');
      assert.ok(result.data.runId.length > 0);
    });

    test('truncateOutput correctly limits text exceeding maximum length', async () => {
      const { truncateOutput } = await import('../src/services/execution.service.js');
      const longText = 'A'.repeat(60000);
      const truncated = truncateOutput(longText, 50000);

      assert.equal(truncated.length, 50000 + '\n[Output truncated at 50000 characters]'.length);
      assert.ok(truncated.endsWith('[Output truncated at 50000 characters]'));
    });
  });
});
