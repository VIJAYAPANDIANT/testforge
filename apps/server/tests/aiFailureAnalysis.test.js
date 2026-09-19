import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { analyzeRunFailure } from '../src/controllers/run.controller.js';
import { sanitizeValue, sanitizeFailureContext, analyzeTestFailure } from '../src/services/aiService.js';
import Run from '../src/models/Run.js';
import RunResult from '../src/models/RunResult.js';

describe('Day 29 — AI Failure Analysis Unit Tests (apps/server)', () => {
  test('1. sanitizeValue redacts passwords, JWTs, Bearer tokens, and API keys correctly', () => {
    const rawData = {
      password: 'SuperSecretPassword123!',
      jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      authHeader: 'Authorization: Bearer my_secret_jwt_bearer_token',
      apiKey: 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      normalField: 'Login failed on submit button click',
    };

    const sanitized = sanitizeValue(rawData);

    assert.equal(sanitized.password, '<REDACTED>');
    assert.equal(sanitized.jwtToken, '<REDACTED>');
    assert.ok(sanitized.authHeader.includes('<REDACTED>'));
    assert.equal(sanitized.apiKey, '<REDACTED>');
    assert.equal(sanitized.normalField, 'Login failed on submit button click');
  });

  test('2. analyzeRunFailure rejects non-failed runs (status=passed) with 400 Bad Request', async () => {
    const userId = new mongoose.Types.ObjectId();
    const runId = new mongoose.Types.ObjectId();

    const origFindById = Run.findById;
    Run.findById = async () => ({
      _id: runId,
      user: userId,
      status: 'passed',
    });

    let statusCode = null;
    let responseData = null;

    const req = {
      params: { id: runId.toString() },
      user: { _id: userId },
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    try {
      await analyzeRunFailure(req, res, () => {});

      assert.equal(statusCode, 400);
      assert.equal(responseData.success, false);
      assert.equal(responseData.message, 'Failure analysis is available only for failed runs');
    } finally {
      Run.findById = origFindById;
    }
  });

  test('3. analyzeRunFailure rejects unauthorized user (403 Forbidden)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const strangerId = new mongoose.Types.ObjectId();
    const runId = new mongoose.Types.ObjectId();

    const origFindById = Run.findById;
    Run.findById = async () => ({
      _id: runId,
      user: ownerId,
      status: 'failed',
    });

    let statusCode = null;
    let responseData = null;

    const req = {
      params: { id: runId.toString() },
      user: { _id: strangerId },
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    try {
      await analyzeRunFailure(req, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(responseData.success, false);
      assert.equal(responseData.message, 'Access forbidden: You do not own this run');
    } finally {
      Run.findById = origFindById;
    }
  });

  test('4. analyzeRunFailure returns cached analysis without re-analyzing if completed', async () => {
    const userId = new mongoose.Types.ObjectId();
    const runId = new mongoose.Types.ObjectId();

    const cachedAnalysis = {
      status: 'completed',
      summary: 'Cached analysis summary',
      failedStep: 'Step 2: click',
      observedError: 'Timeout error',
      likelyCause: 'Locator mismatch',
      evidence: ['Step 2 failed'],
      suggestedInvestigation: ['Check button ID'],
      possibleFix: ['Update locator'],
      uncertainty: 'None',
      analyzedAt: new Date(),
    };

    const origFindById = Run.findById;
    Run.findById = async () => ({
      _id: runId,
      user: userId,
      status: 'failed',
      failureAnalysis: cachedAnalysis,
    });

    let statusCode = null;
    let responseData = null;

    const req = {
      params: { id: runId.toString() },
      query: {},
      user: { _id: userId },
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    try {
      await analyzeRunFailure(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(responseData.success, true);
      assert.equal(responseData.data.summary, 'Cached analysis summary');
    } finally {
      Run.findById = origFindById;
    }
  });

  test('5. analyzeRunFailure executes analysis on failed run and persists result', async () => {
    const userId = new mongoose.Types.ObjectId();
    const runId = new mongoose.Types.ObjectId();

    let savedRun = null;

    const fakeRun = {
      _id: runId,
      user: userId,
      status: 'failed',
      durationMs: 1500,
      exitCode: 1,
      stderr: 'locator.click: Timeout 5000ms exceeded.',
      screenshotPath: '/uploads/screenshots/test.png',
      triggerSource: 'github',
      triggerMetadata: { repository: 'owner/repo', branch: 'main' },
      failureAnalysis: null,
      async save() {
        savedRun = this;
      },
      populate: async () => {},
    };

    const fakeResult = {
      run: runId,
      status: 'failed',
      stepResults: [
        { stepIndex: 0, stepType: 'navigate', status: 'passed' },
        { stepIndex: 1, stepType: 'click', status: 'failed', error: 'locator.click: Timeout 5000ms exceeded.' },
      ],
    };

    const origFindById = Run.findById;
    const origFindOne = RunResult.findOne;

    Run.findById = async () => fakeRun;
    RunResult.findOne = async () => fakeResult;

    // Set GEMINI_API_KEY for fallback or mock test
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    let statusCode = null;
    let responseData = null;

    const req = {
      params: { id: runId.toString() },
      query: {},
      user: { _id: userId },
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    try {
      await analyzeRunFailure(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(responseData.success, true);
      assert.equal(fakeRun.status, 'failed'); // execution status is preserved as failed!
      assert.ok(savedRun.failureAnalysis);
      assert.equal(savedRun.failureAnalysis.status, 'failed'); // AI provider status is failed due to missing API key
    } finally {
      Run.findById = origFindById;
      RunResult.findOne = origFindOne;
      process.env.GEMINI_API_KEY = origKey;
    }
  });
});
