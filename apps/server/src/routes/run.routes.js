import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { executeRun, getRunById } from '../controllers/run.controller.js';

const router = express.Router();

// POST /api/runs — Execute a test case using Playwright worker
router.post('/', protect, executeRun);

// GET /api/runs/:id — Fetch execution run details and result by run ID
router.get('/:id', protect, getRunById);

export default router;
