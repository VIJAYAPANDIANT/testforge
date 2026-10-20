# TestForge — API Testing Guide

This guide details how to test the complete TestForge REST API and WebSocket interfaces using Postman, cURL, or automated scripts.

---

## 1. Prerequisites & Environment Setup

### Required Environment Variables

Ensure `apps/server/.env` is configured with:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_secure_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
WORKER_SERVICE_URL=http://localhost:5001   # Optional for remote Playwright execution
```

### Server Startup

From the project root (`testforge/`), start the API server:

```bash
npm run dev
```

Server output upon successful launch:

```text
MongoDB connected successfully
Database host: cluster0.xxxxx.mongodb.net
[Socket.IO] Server initialized and ready
Server running on port 5000
```

---

## 2. Postman Setup

### Import Collection & Environment

1. Open **Postman**.
2. Click **Import** in the top left.
3. Select and import:
   - Collection: `docs/postman/TestForge_API.postman_collection.json`
   - Environment: `docs/postman/TestForge_Local.postman_environment.json`
4. In the top right environment dropdown, select **TestForge Local Environment**.

### Automated Environment Variables

The Postman collection includes embedded test scripts that automatically capture and populate environment variables:

- **Register / Login**: Saves `authToken` automatically.
- **Create Project**: Saves `projectId` automatically.
- **Create Environment**: Saves `environmentId` automatically.
- **Create Test Case**: Saves `testCaseId` automatically.
- **Execute Test Case**: Saves `runId` automatically.

---

## 3. Recommended Testing Order

Execute the API requests in the following sequence for full end-to-end verification:

### Step 1: Health & Welcome
1. `GET /` — Root welcome message (`200 OK`)
2. `GET /api/health` — Health check endpoint (`200 OK`)

### Step 2: Authentication
3. `POST /api/auth/register` — Create a new user account (`201 Created`, populates `authToken`)
4. `POST /api/auth/login` — Login with user credentials (`200 OK`, populates `authToken`)
5. `GET /api/auth/me` — Verify authenticated user details (`200 OK`)

### Step 3: Projects
6. `POST /api/projects` — Create a new project (`201 Created`, populates `projectId`)
7. `GET /api/projects` — List user projects (`200 OK`)
8. `GET /api/projects/:id` — Fetch project details (`200 OK`)
9. `PATCH /api/projects/:id` — Update project name or description (`200 OK`)

### Step 4: Environments
10. `POST /api/projects/:projectId/environments` — Create an environment (`201 Created`, populates `environmentId`)
11. `GET /api/projects/:projectId/environments` — List all environments for project (`200 OK`)
12. `GET /api/environments/:id` — Fetch single environment by ID (`200 OK`)
13. `PATCH /api/environments/:id` — Update environment name or baseUrl (`200 OK`)

### Step 5: Test Cases
14. `POST /api/projects/:projectId/test-cases` — Create a test case with DSL steps (`201 Created`, populates `testCaseId`)
15. `GET /api/projects/:projectId/test-cases` — List all test cases in project (`200 OK`)
16. `GET /api/test-cases/:id` — Fetch single test case by ID (`200 OK`)
17. `PATCH /api/test-cases/:id` — Update test case name, description, or DSL (`200 OK`)

### Step 6: Test Execution (Playwright Worker)
18. `POST /api/runs/execute` — Execute a test case (`200 OK` or `202 Accepted`, populates `runId`).
    ```json
    {
      "testCaseId": "{{testCaseId}}",
      "environmentId": "{{environmentId}}"
    }
    ```
    *Returns initial Run state: `status: "queued"` or `"running"`.*

### Step 7: Run History, Details & Metrics
19. `GET /api/runs/:id` — Fetch execution details, step results, exit code, console logs, and failure screenshot (`200 OK`).
20. `GET /api/runs?projectId={{projectId}}&limit=10` — List recent test execution runs for a project (`200 OK`).
21. `GET /api/runs/stats` — Fetch aggregate dashboard metrics: `totalProjects`, `totalTestCases`, `totalRuns`, `passedRuns`, `failedRuns`, `passRate`, `autoRuns`, `autoPassRate` (`200 OK`).

### Step 8: AI Failure Analysis
22. `POST /api/runs/:id/analyze` — Generate structured AI failure diagnosis for a failed run (`200 OK`).
    *Returns diagnosis with `summary`, `failedStep`, `observedError`, `likelyCause`, `evidence`, `suggestedInvestigation`, and `possibleFix`.*
23. `POST /api/runs/:id/analyze?force=true` — Bypass cache and force fresh AI re-analysis (`200 OK`).

### Step 9: Webhook CI/CD Triggers
24. `POST /api/webhooks/generic/:projectId` — Trigger automated tests via generic webhook (`200 OK` or `202 Accepted`).
    *Requires `x-webhook-secret: {{webhookSecret}}` header.*
25. `POST /api/webhooks/github/:projectId` — Trigger automated tests on GitHub push (`200 OK` or `202 Accepted`).
    *Requires `x-github-event: push`, `x-hub-signature-256: sha256=...`, and `x-github-delivery: <uuid>` headers.*

### Step 10: Cleanup & Deletion
26. `DELETE /api/test-cases/:id` — Delete test case (`200 OK`)
27. `DELETE /api/environments/:id` — Delete environment (`200 OK`)
28. `DELETE /api/projects/:id` — Delete project (`200 OK`)

---

## 4. Real-Time Socket.IO Streaming

TestForge streams live execution events over WebSockets using Socket.IO:

1. Connect to `http://localhost:5000` with auth handshake or token query:
   ```javascript
   import { io } from 'socket.io-client';

   const socket = io('http://localhost:5000', {
     auth: { token: localStorage.getItem('token') },
   });
   ```
2. Join the dedicated execution room:
   ```javascript
   socket.emit('join:run', runId);
   ```
3. Listen for real-time progress events:
   - `RUN_QUEUED` — Run accepted into worker queue.
   - `RUN_STARTED` — Worker launched Chromium browser process.
   - `STEP_STARTED` — Individual DSL step evaluation started (`stepIndex`, `stepType`).
   - `STEP_PASSED` — Step successfully executed (`durationMs`).
   - `STEP_FAILED` — Step failed with error stack trace.
   - `RUN_COMPLETED` — Execution finalized (`status`, `durationMs`, `screenshotPath`).

---

## 5. Negative Test Scenarios to Verify

- **Missing / Invalid Auth Token**: Call protected route (`GET /api/auth/me` or `/api/projects`) without token or with malformed token $\rightarrow$ `401 Unauthorized`
- **Invalid MongoDB ObjectId**: Pass `/api/projects/invalid-id` or `/api/runs/12345` $\rightarrow$ `404 Not Found`
- **Cross-User Access (Ownership Check)**: Attempt to fetch or modify another user's project, test case, or run $\rightarrow$ `403 Forbidden` / `404 Not Found`
- **Invalid Base URL**: Create environment with `baseUrl: "ftp://invalid.com"` or `"invalid-url"` $\rightarrow$ `400 Bad Request`
- **Duplicate Environment Name**: Create two environments named `"Staging"` in the same project $\rightarrow$ `409 Conflict`
- **Protected Field Updates**: Attempt to PATCH `user` or `project` on environments $\rightarrow$ `400 Bad Request`
- **AI Analysis on Passed Run**: Calling `POST /api/runs/:id/analyze` on a run with `status: "passed"` $\rightarrow$ `400 Bad Request` (`Failure analysis is available only for failed runs`)
- **Missing Webhook Secret**: Calling `POST /api/webhooks/generic/:projectId` without `x-webhook-secret` $\rightarrow$ `403 Forbidden`
- **Invalid GitHub HMAC Signature**: Calling `POST /api/webhooks/github/:projectId` with an altered payload or invalid signature $\rightarrow$ `403 Forbidden`
- **Serverless Worker Unavailable**: Running on Vercel without `WORKER_SERVICE_URL` configured $\rightarrow$ `503 Service Unavailable` (`WORKER_UNAVAILABLE`)
