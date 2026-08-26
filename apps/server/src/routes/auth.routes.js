import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

export default router;
