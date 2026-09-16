import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
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

  describe('Day 15 — GET /api/runs/:id Endpoint', () => {
    const createMockRes = () => {
      const res = {};
      res.statusCode = 200;
      res.jsonData = null;
      res.status = function (code) {
        res.statusCode = code;
        return res;
      };
      res.json = function (data) {
        res.jsonData = data;
        return res;
      };
      return res;
    };

    const userId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const runId = new mongoose.Types.ObjectId();

    test('Returns 404 when run ID has invalid ObjectId format', async () => {
      const { getRunById } = await import('../src/controllers/run.controller.js');
      const req = { params: { id: 'invalid-run-id-format' }, user: { _id: userId } };
      const res = createMockRes();

      await getRunById(req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.equal(res.jsonData.success, false);
      assert.equal(res.jsonData.message, 'Run not found');
    });

    test('Returns 404 when run does not exist in DB', async () => {
      const { getRunById } = await import('../src/controllers/run.controller.js');
      const Run = (await import('../src/models/Run.js')).default;
      const originalFindById = Run.findById;
      Run.findById = async () => null;

      try {
        const req = { params: { id: runId.toString() }, user: { _id: userId } };
        const res = createMockRes();

        await getRunById(req, res, () => {});

        assert.equal(res.statusCode, 404);
        assert.equal(res.jsonData.success, false);
        assert.equal(res.jsonData.message, 'Run not found');
      } finally {
        Run.findById = originalFindById;
      }
    });

    test('Returns 403 when run is owned by another user', async () => {
      const { getRunById } = await import('../src/controllers/run.controller.js');
      const Run = (await import('../src/models/Run.js')).default;
      const originalFindById = Run.findById;
      Run.findById = async () => ({
        _id: runId,
        user: otherUserId,
      });

      try {
        const req = { params: { id: runId.toString() }, user: { _id: userId } };
        const res = createMockRes();

        await getRunById(req, res, () => {});

        assert.equal(res.statusCode, 403);
        assert.equal(res.jsonData.success, false);
        assert.equal(res.jsonData.message, 'Access forbidden: You do not own this run');
      } finally {
        Run.findById = originalFindById;
      }
    });

    test('Returns 200 with run and result data when owned by authenticated user', async () => {
      const { getRunById } = await import('../src/controllers/run.controller.js');
      const Run = (await import('../src/models/Run.js')).default;
      const RunResult = (await import('../src/models/RunResult.js')).default;

      const mockRun = {
        _id: runId,
        user: userId,
        status: 'passed',
        populate: async function () {
          return this;
        },
      };
      const mockResult = { _id: new mongoose.Types.ObjectId(), run: runId, status: 'passed', exitCode: 0 };

      const originalFindById = Run.findById;
      const originalFindOne = RunResult.findOne;

      Run.findById = async () => mockRun;
      RunResult.findOne = async () => mockResult;

      try {
        const req = { params: { id: runId.toString() }, user: { _id: userId } };
        const res = createMockRes();

        await getRunById(req, res, () => {});

        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonData.success, true);
        assert.deepEqual(res.jsonData.data.run, mockRun);
        assert.deepEqual(res.jsonData.data.result, mockResult);
      } finally {
        Run.findById = originalFindById;
        RunResult.findOne = originalFindOne;
      }
    });
  });

  describe('Day 20 — GET /api/runs Endpoint (Run History)', () => {
    const createMockRes = () => {
      const res = {};
      res.statusCode = 200;
      res.jsonData = null;
      res.status = function (code) {
        res.statusCode = code;
        return res;
      };
      res.json = function (data) {
        res.jsonData = data;
        return res;
      };
      return res;
    };

    const userId = new mongoose.Types.ObjectId();
    const testCaseId = new mongoose.Types.ObjectId();

    test('Returns 400 when testCaseId query format is invalid', async () => {
      const { getRuns } = await import('../src/controllers/run.controller.js');
      const req = { query: { testCaseId: 'invalid-id' }, user: { _id: userId } };
      const res = createMockRes();

      await getRuns(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.equal(res.jsonData.message, 'Invalid testCaseId format');
    });

    test('Returns 200 with formatted run history list sorted newest first', async () => {
      const { getRuns } = await import('../src/controllers/run.controller.js');
      const Run = (await import('../src/models/Run.js')).default;

      const mockRuns = [
        {
          _id: new mongoose.Types.ObjectId(),
          testCase: { _id: testCaseId, name: 'Sample Test' },
          project: { _id: new mongoose.Types.ObjectId(), name: 'Project A' },
          user: userId,
          status: 'passed',
          durationMs: 1200,
          createdAt: new Date('2026-09-16T10:00:00Z'),
          exitCode: 0,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          testCase: { _id: testCaseId, name: 'Sample Test' },
          project: { _id: new mongoose.Types.ObjectId(), name: 'Project A' },
          user: userId,
          status: 'failed',
          durationMs: 800,
          createdAt: new Date('2026-09-16T09:00:00Z'),
          exitCode: 1,
        },
      ];

      const originalFind = Run.find;
      Run.find = () => ({
        sort: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => ({
                lean: async () => mockRuns,
              }),
            }),
          }),
        }),
      });

      try {
        const req = { query: { testCaseId: testCaseId.toString() }, user: { _id: userId } };
        const res = createMockRes();

        await getRuns(req, res, () => {});

        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonData.success, true);
        assert.equal(res.jsonData.count, 2);
        assert.equal(res.jsonData.data[0].status, 'passed');
        assert.equal(res.jsonData.data[1].status, 'failed');
        assert.equal(res.jsonData.data[0].testCaseName, 'Sample Test');
      } finally {
        Run.find = originalFind;
      }
    });
  });
});
