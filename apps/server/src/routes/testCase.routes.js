import { Router } from 'express';
import {
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
} from '../controllers/testCase.controller.js';
import protect from '../middleware/auth.middleware.js';
import { validateObjectId } from '../middleware/validateObjectId.middleware.js';

const router = Router();

// Protect all standalone test case routes
router.use(protect);

router.get('/:id', validateObjectId('id', 'Test case'), getTestCaseById);
router.patch('/:id', validateObjectId('id', 'Test case'), updateTestCase);
router.delete('/:id', validateObjectId('id', 'Test case'), deleteTestCase);

export default router;
