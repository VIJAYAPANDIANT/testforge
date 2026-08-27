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

const router = Router();

// Protect all project routes
router.use(protect);

// Project CRUD
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

// Nested Test Case routes within a project
router.post('/:projectId/test-cases', createTestCase);
router.get('/:projectId/test-cases', getTestCases);

export default router;
