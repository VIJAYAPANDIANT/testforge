import express from 'express';
import {
  handleProjectWebhook,
  handleGitHubWebhook,
} from '../controllers/webhook.controller.js';

const router = express.Router();

/**
 * POST /api/webhooks/project/:projectId
 * Generic webhook receiver endpoint for code change / deployment triggers.
 */
router.post('/project/:projectId', handleProjectWebhook);

/**
 * POST /api/webhooks/github/:projectId
 * GitHub-specific webhook receiver endpoint with X-Hub-Signature-256 HMAC verification.
 */
router.post('/github/:projectId', handleGitHubWebhook);

export default router;
