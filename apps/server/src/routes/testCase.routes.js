import { Router } from 'express';
import {
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
} from '../controllers/testCase.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = Router();

// Protect all standalone test case routes
router.use(protect);

router.get('/:id', getTestCaseById);
router.patch('/:id', updateTestCase);
router.delete('/:id', deleteTestCase);

export default router;
