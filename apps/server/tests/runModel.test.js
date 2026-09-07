import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Run from '../src/models/Run.js';
import RunResult from '../src/models/RunResult.js';

describe('Day 14 — Run & RunResult Model Unit Tests (apps/server)', () => {
  describe('Run Model', () => {
    test('Validates a correctly formatted Run document', () => {
      const validRun = new Run({
        testCase: new mongoose.Types.ObjectId(),
        project: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        environment: new mongoose.Types.ObjectId(),
        status: 'queued',
      });

      const validationError = validRun.validateSync();
      assert.equal(validationError, undefined);
      assert.equal(validRun.status, 'queued');
      assert.equal(validRun.durationMs, 0);
      assert.equal(validRun.exitCode, null);
      assert.equal(validRun.stdout, '');
      assert.equal(validRun.stderr, '');
      assert.equal(validRun.screenshotPath, null);
    });

    test('Requires testCase, project, and user fields', () => {
      const invalidRun = new Run({});
      const err = invalidRun.validateSync();
      assert.ok(err);
      assert.ok(err.errors.testCase);
      assert.ok(err.errors.project);
      assert.ok(err.errors.user);
    });

    test('Rejects invalid status enum value', () => {
      const invalidRun = new Run({
        testCase: new mongoose.Types.ObjectId(),
        project: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        status: 'invalid_status_string',
      });

      const err = invalidRun.validateSync();
      assert.ok(err);
      assert.ok(err.errors.status);
    });

    test('Accepts valid status enum values: queued, running, passed, failed', () => {
      const statuses = ['queued', 'running', 'passed', 'failed'];
      for (const status of statuses) {
        const run = new Run({
          testCase: new mongoose.Types.ObjectId(),
          project: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          status,
        });
        const err = run.validateSync();
        assert.equal(err, undefined);
      }
    });
  });

  describe('RunResult Model', () => {
    test('Validates a correctly formatted RunResult document', () => {
      const validResult = new RunResult({
        run: new mongoose.Types.ObjectId(),
        status: 'passed',
        exitCode: 0,
        stdout: 'Success log',
        stderr: '',
        screenshotPath: null,
        durationMs: 1250,
      });

      const validationError = validResult.validateSync();
      assert.equal(validationError, undefined);
      assert.equal(validResult.status, 'passed');
      assert.equal(validResult.exitCode, 0);
      assert.equal(validResult.durationMs, 1250);
      assert.deepEqual(validResult.stepResults, []);
    });

    test('Requires run reference and status fields', () => {
      const invalidResult = new RunResult({});
      const err = invalidResult.validateSync();
      assert.ok(err);
      assert.ok(err.errors.run);
      assert.ok(err.errors.status);
    });

    test('Rejects status enum values other than passed and failed', () => {
      const invalidResult = new RunResult({
        run: new mongoose.Types.ObjectId(),
        status: 'queued',
      });

      const err = invalidResult.validateSync();
      assert.ok(err);
      assert.ok(err.errors.status);
    });
  });
});
