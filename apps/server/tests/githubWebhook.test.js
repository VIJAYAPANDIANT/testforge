import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { handleGitHubWebhook } from '../src/controllers/webhook.controller.js';
import Project from '../src/models/Project.js';
import Run from '../src/models/Run.js';

describe('Day 27 — GitHub Webhook Integration Unit Tests (apps/server)', () => {
  const secret = 'test_github_webhook_secret_998877';

  const calculateSignature = (payload, secretKey) => {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return 'sha256=' + crypto.createHmac('sha256', secretKey).update(Buffer.from(raw)).digest('hex');
  };

  test('1. Rejects missing X-Hub-Signature-256 header with 403', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();

    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        webhookSecret: secret,
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: {},
        body: { ref: 'refs/heads/main' },
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

      await handleGitHubWebhook(req, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(jsonResult.success, false);
      assert.equal(jsonResult.message, 'Invalid or missing GitHub webhook signature');
    } finally {
      Project.findById = originalFindById;
    }
  });

  test('2. Rejects invalid HMAC signature with 403', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();

    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        webhookSecret: secret,
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: { 'x-hub-signature-256': 'sha256=invalid_signature_hex_123456789012345678901234567890123456789012345678' },
        body: { ref: 'refs/heads/main' },
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

      await handleGitHubWebhook(req, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(jsonResult.success, false);
      assert.equal(jsonResult.message, 'Invalid or missing GitHub webhook signature');
    } finally {
      Project.findById = originalFindById;
    }
  });

  test('3. Ignores non-push GitHub events e.g. issues with 200 OK', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();
    const payload = { action: 'opened', issue: { title: 'Test issue' } };
    const validSignature = calculateSignature(payload, secret);

    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        webhookSecret: secret,
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: {
          'x-hub-signature-256': validSignature,
          'x-github-event': 'issues',
        },
        body: payload,
        rawBody: Buffer.from(JSON.stringify(payload)),
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

      await handleGitHubWebhook(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(jsonResult.success, true);
      assert.equal(jsonResult.triggeredTests, 0);
      assert.ok(jsonResult.message.includes('ignored'));
    } finally {
      Project.findById = originalFindById;
    }
  });

  test('4. Rejects repository mismatch with 200 OK and 0 triggered tests', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();
    const payload = {
      ref: 'refs/heads/main',
      repository: { full_name: 'wrong-owner/wrong-repo' },
    };
    const validSignature = calculateSignature(payload, secret);

    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        branch: 'main',
        provider: 'github',
        github: { repository: 'myorg/my-shop' },
        webhookSecret: secret,
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: {
          'x-hub-signature-256': validSignature,
          'x-github-event': 'push',
        },
        body: payload,
        rawBody: Buffer.from(JSON.stringify(payload)),
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

      await handleGitHubWebhook(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(jsonResult.success, true);
      assert.equal(jsonResult.triggeredTests, 0);
      assert.ok(jsonResult.message.includes('does not match configured repository'));
    } finally {
      Project.findById = originalFindById;
    }
  });

  test('5. Rejects branch mismatch (refs/heads/develop vs main) with 200 OK', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();
    const payload = {
      ref: 'refs/heads/develop',
      repository: { full_name: 'myorg/my-shop' },
    };
    const validSignature = calculateSignature(payload, secret);

    const originalFindById = Project.findById;
    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        branch: 'main',
        provider: 'github',
        github: { repository: 'myorg/my-shop' },
        webhookSecret: secret,
      },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: {
          'x-hub-signature-256': validSignature,
          'x-github-event': 'push',
        },
        body: payload,
        rawBody: Buffer.from(JSON.stringify(payload)),
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

      await handleGitHubWebhook(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(jsonResult.success, true);
      assert.equal(jsonResult.triggeredTests, 0);
      assert.ok(jsonResult.message.includes('does not match configured branch'));
    } finally {
      Project.findById = originalFindById;
    }
  });

  test('6. Deduplicates retried X-GitHub-Delivery requests', async () => {
    let statusCode = null;
    let jsonResult = null;

    const fakeProjectId = new mongoose.Types.ObjectId();
    const deliveryId = 'delivery-uuid-12345';
    const payload = {
      ref: 'refs/heads/main',
      repository: { full_name: 'myorg/my-shop' },
    };
    const validSignature = calculateSignature(payload, secret);

    const originalFindById = Project.findById;
    const originalFindOne = Run.findOne;

    Project.findById = async () => ({
      _id: fakeProjectId,
      autoTest: {
        enabled: true,
        branch: 'main',
        provider: 'github',
        github: { repository: 'myorg/my-shop' },
        webhookSecret: secret,
        testCaseIds: [new mongoose.Types.ObjectId()],
      },
    });

    Run.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      triggerMetadata: { deliveryId },
    });

    try {
      const req = {
        params: { projectId: fakeProjectId.toString() },
        headers: {
          'x-hub-signature-256': validSignature,
          'x-github-event': 'push',
          'x-github-delivery': deliveryId,
        },
        body: payload,
        rawBody: Buffer.from(JSON.stringify(payload)),
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

      await handleGitHubWebhook(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(jsonResult.success, true);
      assert.equal(jsonResult.triggeredTests, 0);
      assert.ok(jsonResult.message.includes('Duplicate GitHub webhook delivery'));
    } finally {
      Project.findById = originalFindById;
      Run.findOne = originalFindOne;
    }
  });
});
