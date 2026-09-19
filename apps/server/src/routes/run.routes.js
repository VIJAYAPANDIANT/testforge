import express from 'express';
import protect from '../middleware/auth.middleware.js';
import { executeRun, getRuns, getRunById, getRunStats, analyzeRunFailure } from '../controllers/run.controller.js';

const router = express.Router();

// POST /api/runs — Execute a test case using Playwright worker
router.post('/', protect, executeRun);

// GET /api/runs/stats — Fetch aggregate dashboard statistics for authenticated user
router.get('/stats', protect, getRunStats);

// GET /api/runs — Fetch run history list (filtered by testCaseId or projectId, newest first)
router.get('/', protect, getRuns);

// GET /api/runs/:id — Fetch execution run details and result by run ID
router.get('/:id', protect, getRunById);

// POST /api/runs/:id/analyze — Generate AI failure analysis for a failed execution run
router.post('/:id/analyze', protect, analyzeRunFailure);

export default router;
