import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import { createTestCase, getTestCases } from '../controllers/testCase.controller.js';
import protect from '../middleware/auth.middleware.js';
import { validateObjectId } from '../middleware/validateObjectId.middleware.js';

const router = Router();

// Protect all project routes
router.use(protect);

// Project CRUD
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', validateObjectId('id', 'Project'), getProjectById);
router.patch('/:id', validateObjectId('id', 'Project'), updateProject);
router.delete('/:id', validateObjectId('id', 'Project'), deleteProject);

// Nested Test Case routes within a project
router.post('/:projectId/test-cases', validateObjectId('projectId', 'Project'), createTestCase);
router.get('/:projectId/test-cases', validateObjectId('projectId', 'Project'), getTestCases);

export default router;
