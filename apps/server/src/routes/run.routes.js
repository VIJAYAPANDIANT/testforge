import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { executeRun } from '../controllers/run.controller.js';

const router = express.Router();

// POST /api/runs — Execute a test case using Playwright worker
router.post('/', protect, executeRun);

export default router;
