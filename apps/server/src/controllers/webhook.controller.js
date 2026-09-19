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
      console.warn(`[Webhook] Unauthorized webhook attempt for project ${projectId}`);
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
        console.log(`[Webhook] Duplicate webhook event '${eventId}' already processed`);
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

    // Run execution in background (or resolve immediately for 202 response)
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
