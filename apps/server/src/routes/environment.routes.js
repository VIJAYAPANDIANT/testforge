import { Router } from 'express';
import {
  getEnvironmentById,
  updateEnvironment,
  deleteEnvironment,
} from '../controllers/environment.controller.js';
import protect from '../middleware/auth.middleware.js';
import { validateObjectId } from '../middleware/validateObjectId.middleware.js';

const router = Router();

// Protect all standalone environment routes
router.use(protect);

router.get('/:id', validateObjectId('id', 'Environment'), getEnvironmentById);
router.patch('/:id', validateObjectId('id', 'Environment'), updateEnvironment);
router.delete('/:id', validateObjectId('id', 'Environment'), deleteEnvironment);

export default router;
