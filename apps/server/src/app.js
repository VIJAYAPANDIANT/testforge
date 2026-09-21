import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import testCaseRoutes from './routes/testCase.routes.js';
import environmentRoutes from './routes/environment.routes.js';
import runRoutes from './routes/run.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../worker/uploads');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────

// Serve uploaded screenshots statically
app.use('/uploads', express.static(uploadsDir));

// Parse incoming JSON request bodies and preserve unparsed raw body Buffer for HMAC verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// CORS configuration supporting single or comma-separated origins plus local dev & production Vercel fallbacks
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const parsedOrigins = clientOrigin.includes(',')
  ? clientOrigin.split(',').map((o) => o.trim())
  : [clientOrigin];
const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://testforge-client.vercel.app'];
const allowedOrigins = Array.from(new Set([...parsedOrigins, ...devOrigins]));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Root welcome & health routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TestForge API' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/webhooks', webhookRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

// 404 — must come after all valid routes
app.use(notFound);

// Centralized error handler — must be last (4 args)
app.use(errorHandler);

export default app;
