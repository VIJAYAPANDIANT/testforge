import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Returns the current health status of the TestForge API.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TestForge API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
