import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import TestCase from '../models/TestCase.js';
import Run from '../models/Run.js';
import { runTestCaseExecution } from '../services/execution.service.js';

/**
 * Timing-safe comparison helper for webhook secrets
 */
const safeCompareSecrets = (providedSecret, actualSecret) => {
  if (!providedSecret || !actualSecret) return false;
  if (typeof providedSecret !== 'string' || typeof actualSecret !== 'string') return false;

  const bufA = Buffer.from(providedSecret);
  const bufB = Buffer.from(actualSecret);

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Timing-safe GitHub HMAC-SHA256 signature verification helper
 */
const verifyGitHubSignature = (headerSignature, rawBody, secret) => {
  if (!headerSignature || !secret) return false;
  if (typeof headerSignature !== 'string') return false;

  try {
    const rawBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody || {}));

    const expectedHex = crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex');
    const expectedSignature = `sha256=${expectedHex}`;

    const bufA = Buffer.from(headerSignature);
    const bufB = Buffer.from(expectedSignature);

    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    console.error('[Webhook] GitHub signature computation error:', err.message);
    return false;
  }
};

/**
 * POST /api/webhooks/project/:projectId
 * Generic webhook receiver triggering automatic test case execution on code updates/deployments.
 */
export const handleProjectWebhook = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // 1. Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 2. Find Project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 3. Webhook authentication check
    const headerSecret =
      req.headers['x-testforge-webhook-secret'] ||
      req.headers['X-TestForge-Webhook-Secret'] ||
      req.headers['x-webhook-secret'];

    const configuredSecret = project.autoTest?.webhookSecret;

    if (!configuredSecret || !safeCompareSecrets(headerSecret, configuredSecret)) {
      console.warn(`[Webhook] Unauthorized generic webhook attempt for project ${projectId}`);
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing webhook secret',
      });
    }

    // 4. Check if auto-test is enabled
    if (!project.autoTest?.enabled) {
      console.log(`[Webhook] Auto-test disabled for project ${projectId}`);
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: 'Auto-test is disabled for this project',
      });
    }

    // 5. Parse payload & branch filtering
    const {
      event = 'deployment',
      branch = 'main',
      commit = '',
      repository = '',
    } = req.body || {};

    const configuredBranch = project.autoTest?.branch || 'main';

    if (branch && branch !== configuredBranch) {
      console.log(
        `[Webhook] Branch '${branch}' does not match configured branch '${configuredBranch}' for project ${projectId}`
      );
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: `Branch '${branch}' does not match configured branch '${configuredBranch}'`,
      });
    }

    // 6. Duplicate webhook event protection
    const eventId = commit ? `${repository}:${commit}:${event}:${branch}` : null;
    if (eventId) {
      const existingRun = await Run.findOne({
        project: project._id,
        'triggerMetadata.eventId': eventId,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      });

      if (existingRun) {
        console.log(`[Webhook] Duplicate generic webhook event '${eventId}' already processed`);
        return res.status(200).json({
          success: true,
          triggeredTests: 0,
          message: 'Duplicate webhook event already processed',
        });
      }
    }

    // 7. Load configured test cases
    const testCaseIds = project.autoTest?.testCaseIds || [];
    if (testCaseIds.length === 0) {
      console.log(`[Webhook] No automatic test cases configured for project ${projectId}`);
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: 'No automatic tests are configured',
      });
    }

    const testCases = await TestCase.find({
      _id: { $in: testCaseIds },
      project: project._id,
    });

    if (testCases.length === 0) {
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: 'No automatic tests are configured',
      });
    }

    // 8. Trigger execution pipeline asynchronously for each test case
    const triggerMetadata = {
      provider: 'generic',
      branch: branch || 'main',
      commit: commit || null,
      repository: repository || null,
      event: event || 'deployment',
      triggeredAt: new Date(),
      eventId,
    };

    console.log(
      `[Webhook] Triggering ${testCases.length} auto-test(s) for project '${project.name}' (${projectId}) on branch '${branch}'`
    );

    const runPromises = testCases.map((tc) =>
      runTestCaseExecution({
        testCase: tc,
        environment: null,
        user: project.user,
        triggerSource: 'webhook',
        triggerMetadata,
      })
    );

    const executionResults = await Promise.all(runPromises);
    const triggeredRunIds = executionResults
      .filter((r) => r && r.data && r.data.runId)
      .map((r) => r.data.runId);

    // 9. Return 202 Accepted response
    return res.status(202).json({
      success: true,
      message: 'Automatic tests triggered',
      projectId: project._id.toString(),
      triggeredTests: triggeredRunIds.length,
      runIds: triggeredRunIds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/webhooks/github/:projectId
 * GitHub webhook receiver endpoint handling push events, X-Hub-Signature-256 HMAC verification,
 * repository & branch matching, delivery deduplication, and automated test execution.
 */
export const handleGitHubWebhook = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // 1. Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 2. Find Project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 3. Verify HMAC-SHA256 GitHub signature
    const signatureHeader =
      req.headers['x-hub-signature-256'] || req.headers['X-Hub-Signature-256'];
    const configuredSecret = project.autoTest?.webhookSecret;

    if (!configuredSecret || !signatureHeader) {
      console.warn(`[GitHub Webhook] Missing signature header or secret for project ${projectId}`);
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing GitHub webhook signature',
      });
    }

    const isSignatureValid = verifyGitHubSignature(
      signatureHeader,
      req.rawBody || req.body,
      configuredSecret
    );

    if (!isSignatureValid) {
      console.warn(`[GitHub Webhook] Invalid signature verification for project ${projectId}`);
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing GitHub webhook signature',
      });
    }

    // 4. Validate GitHub event header (support 'push' for Day 27)
    const githubEvent =
      req.headers['x-github-event'] || req.headers['X-GitHub-Event'] || 'push';

    if (githubEvent !== 'push') {
      console.log(`[GitHub Webhook] Ignored non-push event '${githubEvent}' for project ${projectId}`);
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: `GitHub event '${githubEvent}' is ignored`,
      });
    }

    // 5. Check auto-test enabled state
    if (!project.autoTest?.enabled) {
      console.log(`[GitHub Webhook] Auto-test disabled for project ${projectId}`);
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: 'Auto-test is disabled for this project',
      });
    }

    // 6. Parse GitHub push payload
    const { ref = '', after = '', before = '', repository = {} } = req.body || {};

    const incomingRepo = repository?.full_name || (repository?.name ? `${repository.owner?.login || ''}/${repository.name}` : '');
    const configuredRepo = project.autoTest?.github?.repository || '';

    // Validate repository if configured
    if (configuredRepo && incomingRepo) {
      if (incomingRepo.toLowerCase().trim() !== configuredRepo.toLowerCase().trim()) {
        console.log(
          `[GitHub Webhook] Repository '${incomingRepo}' does not match configured repository '${configuredRepo}' for project ${projectId}`
        );
        return res.status(200).json({
          success: true,
          triggeredTests: 0,
          message: `Repository '${incomingRepo}' does not match configured repository '${configuredRepo}'`,
        });
      }
    }

    // Parse branch from ref (refs/heads/main -> main)
    const incomingBranch = ref.replace(/^refs\/heads\//, '').trim();
    const configuredBranch = project.autoTest?.branch || 'main';

    if (incomingBranch && incomingBranch !== configuredBranch) {
      console.log(
        `[GitHub Webhook] Branch '${incomingBranch}' does not match configured branch '${configuredBranch}' for project ${projectId}`
      );
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: `Branch '${incomingBranch}' does not match configured branch '${configuredBranch}'`,
      });
    }

    // 7. Check duplicate delivery ID (X-GitHub-Delivery)
    const deliveryId =
      req.headers['x-github-delivery'] || req.headers['X-GitHub-Delivery'] || null;

    if (deliveryId) {
      const existingRun = await Run.findOne({
        project: project._id,
        'triggerMetadata.deliveryId': deliveryId,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      });

      if (existingRun) {
        console.log(`[GitHub Webhook] Duplicate delivery ID '${deliveryId}' already processed`);
        return res.status(200).json({
          success: true,
          triggeredTests: 0,
          message: 'Duplicate GitHub webhook delivery already processed',
        });
      }
    }

    // 8. Load configured test cases
    const testCaseIds = project.autoTest?.testCaseIds || [];
    if (testCaseIds.length === 0) {
      console.log(`[GitHub Webhook] No test cases selected for project ${projectId}`);
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: 'No automatic tests are configured',
      });
    }

    const testCases = await TestCase.find({
      _id: { $in: testCaseIds },
      project: project._id,
    });

    if (testCases.length === 0) {
      return res.status(200).json({
        success: true,
        triggeredTests: 0,
        message: 'No automatic tests are configured',
      });
    }

    // 9. Trigger execution pipeline asynchronously with GitHub metadata
    const triggerMetadata = {
      provider: 'github',
      branch: incomingBranch || configuredBranch,
      commit: after ? after.substring(0, 7) : null,
      beforeCommit: before ? before.substring(0, 7) : null,
      repository: incomingRepo || configuredRepo || null,
      event: 'push',
      deliveryId,
      triggeredAt: new Date(),
      eventId: deliveryId || (after ? `${incomingRepo}:${after}:push:${incomingBranch}` : null),
    };

    console.log(
      `[GitHub Webhook] Triggering ${testCases.length} test(s) for repository '${incomingRepo}' on branch '${incomingBranch}'`
    );

    const runPromises = testCases.map((tc) =>
      runTestCaseExecution({
        testCase: tc,
        environment: null,
        user: project.user,
        triggerSource: 'github',
        triggerMetadata,
      })
    );

    const executionResults = await Promise.all(runPromises);
    const triggeredRunIds = executionResults
      .filter((r) => r && r.data && r.data.runId)
      .map((r) => r.data.runId);

    return res.status(202).json({
      success: true,
      message: 'Automatic tests triggered via GitHub webhook',
      projectId: project._id.toString(),
      triggeredTests: triggeredRunIds.length,
      runIds: triggeredRunIds,
    });
  } catch (error) {
    next(error);
  }
};
