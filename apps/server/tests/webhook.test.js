import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { handleProjectWebhook } from '../src/controllers/webhook.controller.js';
import Project from '../src/models/Project.js';

describe('Day 26 — Webhook Controller Unit Tests (apps/server)', () => {
  test('1. Rejects unknown or invalid projectId format with 404', async () => {
    let statusCode = null;
    let jsonResult = null;

    const req = {
      params: { projectId: 'invalid-id-format' },
      headers: {},
      body: {},
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      },
    };

    await handleProjectWebhook(req, res, () => {});

    assert.equal(statusCode, 404);
    assert.equal(jsonResult.success, false);
    assert.equal(jsonResult.message, 'Project not found');
  });

  test('2. Rejects missing or invalid webhook secret header with 403', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();

    // Mock Project.findById
    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        webhookSecret: 'correct_secret_1234567890abcdef',
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: { 'x-testforge-webhook-secret': 'wrong_secret' },
        body: {},
      };

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonResult = data;
          return this;
        },
      };

      await handleProjectWebhook(req, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(jsonResult.success, false);
      assert.equal(jsonResult.message, 'Invalid or missing webhook secret');
    } finally {
      Project.findById = originalFindById;
    }
  });

  test('3. Returns 200/202 with 0 triggered tests when autoTest is disabled', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();
    const secret = 'valid_secret_1234567890123456';

    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: false,
        webhookSecret: secret,
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: { 'x-testforge-webhook-secret': secret },
        body: {},
      };

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonResult = data;
          return this;
        },
      };

      await handleProjectWebhook(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(jsonResult.success, true);
      assert.equal(jsonResult.triggeredTests, 0);
      assert.ok(jsonResult.message.includes('disabled'));
    } finally {
      Project.findById = originalFindById;
    }
  });

  test('4. Returns 200 when incoming branch does not match configured autoTest branch', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();
    const secret = 'valid_secret_1234567890123456';

    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        branch: 'main',
        webhookSecret: secret,
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: { 'x-testforge-webhook-secret': secret },
        body: { branch: 'develop' },
      };

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonResult = data;
          return this;
        },
      };

      await handleProjectWebhook(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(jsonResult.success, true);
      assert.equal(jsonResult.triggeredTests, 0);
      assert.ok(jsonResult.message.includes('does not match'));
    } finally {
      Project.findById = originalFindById;
    }
  });
});
