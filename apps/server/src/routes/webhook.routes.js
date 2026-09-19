import express from 'express';
import { handleProjectWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

/**
 * POST /api/webhooks/project/:projectId
 * Public webhook receiver endpoint for code change / deployment triggers.
 */
router.post('/project/:projectId', handleProjectWebhook);

export default router;
