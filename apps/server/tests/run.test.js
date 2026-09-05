import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runTestCaseExecution } from '../src/services/execution.service.js';

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
      assert.ok(typeof result.data.durationMs === 'number' && result.data.durationMs > 0);
    });

    test('Executes failing test case DSL and returns status failed (exitCode 1)', async () => {
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
      assert.ok(typeof result.data.durationMs === 'number' && result.data.durationMs > 0);
    });

    test('Cleans up temporary spec files after execution', async () => {
      const tempRunDir = path.join(os.tmpdir(), 'testforge-runs');

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
});
