import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// CORS — allow requests only from the React dev server
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Root welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TestForge API' });
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

// 404 — must come after all valid routes
app.use(notFound);

// Centralized error handler — must be last (4 args)
app.use(errorHandler);

export default app;
