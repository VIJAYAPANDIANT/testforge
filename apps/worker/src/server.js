import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runPlaywrightTest } from './runner.js';

const PORT = parseInt(process.env.PORT || process.env.WORKER_PORT, 10) || 5001;
const WORKER_API_KEY = process.env.WORKER_API_KEY || null;

/**
 * Creates and starts a standalone HTTP worker daemon for TestForge.
 * Enables running the Playwright execution engine as a dedicated microservice
 * on container platforms (Docker, Render, Railway, Fly.io, VPS) while the API server
 * runs on serverless hosts (such as Vercel).
 */
const server = http.createServer((req, res) => {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health check endpoint
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        status: 'ok',
        service: 'testforge-worker',
        browser: 'chromium',
        uptime: process.uptime(),
      })
    );
  }

  // Test execution endpoint
  if (url.pathname === '/execute' && req.method === 'POST') {
    // Optional secret key authorization
    if (WORKER_API_KEY) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${WORKER_API_KEY}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Unauthorized: Invalid WORKER_API_KEY' }));
      }
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      let data;
      try {
        data = JSON.parse(body || '{}');
      } catch (parseErr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Invalid JSON request body' }));
      }

      const { runId, scriptContent, baseUrl, timeoutMs = 60000 } = data;

      if (!scriptContent || typeof scriptContent !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'scriptContent string is required' }));
      }

      const effectiveRunId = runId || `run-${Date.now()}`;
      const tempDir = path.join(os.tmpdir(), 'testforge-worker-runs');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `${effectiveRunId}.spec.ts`);

      try {
        fs.writeFileSync(tempFilePath, scriptContent, 'utf8');

        const result = await runPlaywrightTest(tempFilePath, {
          runId: effectiveRunId,
          baseUrl,
          timeout: timeoutMs,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (execErr) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(
          JSON.stringify({
            success: false,
            status: 'failed',
            exitCode: 1,
            stderr: execErr.message,
            error: execErr.message,
          })
        );
      } finally {
        if (fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, message: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`[TestForge Worker] Listening on http://localhost:${PORT}`);
});

export default server;
