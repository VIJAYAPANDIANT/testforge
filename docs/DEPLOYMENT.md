# TestForge — Production Deployment & Operations Guide

This guide describes how to deploy the TestForge monorepo to production environments, including **Vercel** for the web client and serverless API, **MongoDB Atlas** for database persistence, and a dedicated **Playwright Worker** for browser test execution.

---

## 1. Production Architecture Overview

```text
┌───────────────────────────────────────┐
│               Users                   │
└──────────────────┬────────────────────┘
                   │
         HTTPS     ▼
┌───────────────────────────────────────┐
│       Vercel Client (SPA)             │
│   https://testforge-client.vercel.app │
└──────────────────┬────────────────────┘
                   │
         REST API  ▼
┌───────────────────────────────────────┐
│     Vercel Serverless API             │
│   https://testforge-server.vercel.app │
│         (api/index.js)                │
└───────┬──────────────┬──────────────┬─┘
        │              │              │
        ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌───────────────────────────────┐
│MongoDB Atlas ││Gemini 2.5 AI ││ Dedicated Playwright Worker   │
│(Cluster0)    ││(Google API)  ││ (Docker / Railway / Render)   │
└──────────────┘└──────────────┘│ WORKER_SERVICE_URL            │
                                └───────────────────────────────┘
```

---

## 2. Deploying the Client (`apps/client`) on Vercel

### 2.1 Vercel Project Settings

1. Connect your GitHub repository to Vercel.
2. Set **Root Directory**: `apps/client`
3. Set **Framework Preset**: `Vite`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`

### 2.2 Environment Variables

| Variable Name | Production Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://testforge-server.vercel.app` | URL of the deployed backend server API |

### 2.3 Single-Page App (SPA) Routing (`vercel.json`)

The client repository includes `apps/client/vercel.json` to handle client-side routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 3. Deploying the Server (`apps/server`) on Vercel

### 3.1 Serverless Entry Point (`api/index.js`)

Vercel functions invoke `api/index.js` as an AWS Lambda serverless function. TestForge exports the configured Express `app` instance:

```javascript
import app from '../apps/server/src/app.js';
import connectDB from '../apps/server/src/config/db.js';

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
```

### 3.2 Environment Variables

Configure the following in the Vercel project settings:

| Variable Name | Example Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/testforge?retryWrites=true&w=majority` | MongoDB connection string |
| `JWT_SECRET` | `secure_random_production_secret_key` | Secret key used to sign and verify user JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token expiration period |
| `CLIENT_URL` | `https://testforge-client.vercel.app,http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini AI key for Failure Analysis |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name (falls back to `gemini-1.5-flash`) |
| `WORKER_SERVICE_URL` | `https://worker.testforge.internal` | Dedicated Playwright worker URL |

---

## 4. Playwright Execution Worker: Dedicated Worker vs. Serverless

### Why Headless Browsers Cannot Run in Vercel Functions

Serverless runtimes (such as Vercel Functions) have key technical constraints:
1. **Read-Only Filesystem**: `/var/task` is strictly read-only. Only `/tmp` allows writing temporary files.
2. **Missing Browser Binaries**: Headless Chromium requires ~300 MB of native Linux shared libraries and binaries, which exceed standard serverless bundle limits.
3. **Execution Timeouts**: Serverless functions typically timeout after 10–60 seconds, which is insufficient for complex end-to-end user journeys.

### The Hybrid Worker Solution

TestForge provides two execution modes:

#### Mode A: Local Development & Dedicated VM (Default)
When running locally or on a standard server/VM (e.g. AWS EC2, DigitalOcean Droplet, Railway, Render), TestForge executes tests by spawning child processes directly:
```bash
node src/server.js
```

#### Mode B: Remote Worker Delegation (`WORKER_SERVICE_URL`)
When the backend runs in a serverless environment (like Vercel), it checks for `WORKER_SERVICE_URL`:
- If set, TestForge dispatches the execution payload via HTTP `POST /execute` to your dedicated Playwright container.
- If not configured, TestForge returns a clean HTTP `503 Service Unavailable` with error code `WORKER_UNAVAILABLE`:
  ```json
  {
    "success": false,
    "code": "WORKER_UNAVAILABLE",
    "message": "Browser test execution is running in a serverless environment (Vercel) without a dedicated execution worker. Please configure WORKER_SERVICE_URL or run locally."
  }
  ```
  *This prevents mysterious `ENOENT` or `browser not found` crashes and provides clear guidance.*

---

## 5. Deploying a Dedicated Playwright Worker Container

You can deploy the worker as an isolated Docker service on platforms like **Railway**, **Render**, or **AWS ECS**:

### Example `Dockerfile`

```dockerfile
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY apps/worker apps/worker
COPY packages/ packages/

EXPOSE 5001
CMD ["node", "apps/worker/src/worker-server.js"]
```

Once deployed, set `WORKER_SERVICE_URL=https://your-worker-service.com` in your Vercel backend environment variables.

---

## 6. Production Health Checks & Verification

After deployment, verify system operation using the health endpoint:

```bash
curl -i https://testforge-server.vercel.app/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-10-20T10:00:00.000Z"
}
```
