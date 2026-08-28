# TestForge — API Testing Guide

This guide details how to test the TestForge REST API using Postman, cURL, or automated scripts.

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
```

### Server Startup

From the project root (`testforge/`), start the API server:

```bash
npm run dev
```

Server output upon successful launch:

```text
[nodemon] starting `node src/server.js`
MongoDB connected successfully
Database host: cluster0.xxxxx.mongodb.net
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
- **Create Test Case**: Saves `testCaseId` automatically.

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

### Step 4: Test Cases
10. `POST /api/projects/:projectId/test-cases` — Create a test case in project (`201 Created`, populates `testCaseId`)
11. `GET /api/projects/:projectId/test-cases` — List all test cases in project (`200 OK`)
12. `GET /api/test-cases/:id` — Fetch single test case by ID (`200 OK`)
13. `PATCH /api/test-cases/:id` — Update test case name, description, or DSL (`200 OK`)

### Step 5: Cleanup & Deletion
14. `DELETE /api/test-cases/:id` — Delete test case (`200 OK`)
15. `DELETE /api/projects/:id` — Delete project (`200 OK`)

---

## 4. Negative Test Scenarios to Verify

- **Missing / Invalid Auth Token**: Call protected route (`GET /api/auth/me` or `/api/projects`) without token or with malformed token $\rightarrow$ `401 Unauthorized`
- **Invalid MongoDB ObjectId**: Pass `/api/projects/invalid-id` or `/api/test-cases/12345` $\rightarrow$ `404 Not Found`
- **Cross-User Access (Ownership Check)**: Attempt to fetch or modify another user's project ID $\rightarrow$ `404 Not Found`
- **Protected Field Updates**: Attempt to PATCH `user` or `_id` on projects/test-cases $\rightarrow$ `400 Bad Request`
- **Validation Failure**: Register with short password or create test case with non-object DSL $\rightarrow$ `400 Bad Request`
