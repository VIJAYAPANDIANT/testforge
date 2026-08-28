# TestForge

> TestForge is a no-code test automation platform that allows users to build browser end-to-end tests visually and execute them using Playwright.

## Architecture

```
React Client (apps/client)
        ↓
Express API (apps/server)
        ↓
   MongoDB Atlas

        ↓
Playwright Worker (apps/worker)
```

## Current Status

```
🚧 Week 1 — Backend Foundation
✅ Day 1 — Express server, MongoDB connection, health check
✅ Day 2 — JWT Authentication completed
✅ Day 3 — Project and Test Case CRUD completed
✅ Day 4 — API validation and testing completed
```

## Repository Structure

```
testforge/
├── apps/
│   ├── client/              # React frontend  (coming Week 2)
│   ├── server/              # Express REST API ← active
│   │   └── src/
│   │       ├── config/      # MongoDB connection
│   │       ├── controllers/ # Auth, Project, TestCase controllers
│   │       ├── middleware/  # Auth, ObjectId & error handling middleware
│   │       ├── models/      # User, Project, TestCase Mongoose models
│   │       ├── routes/      # Auth, Health, Project, TestCase routers
│   │       └── utils/       # Shared utilities
│   └── worker/              # Playwright execution worker (coming Week 3)
│
├── docs/
│   ├── API_TESTING.md       # Complete API testing guide
│   └── postman/             # Postman collection & environment
│
├── packages/
│   └── dsl-schema/          # Shared test workflow schema
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API Testing & Quality Assurance

- **Postman Collection**: Pre-configured collection at [`docs/postman/TestForge_API.postman_collection.json`](file:///c:/testforge/testforge/docs/postman/TestForge_API.postman_collection.json) with automated environment variable capture (`authToken`, `projectId`, `testCaseId`).
- **Postman Environment**: Environment configuration file at [`docs/postman/TestForge_Local.postman_environment.json`](file:///c:/testforge/testforge/docs/postman/TestForge_Local.postman_environment.json).
- **API Testing Guide**: Comprehensive instructions at [`docs/API_TESTING.md`](file:///c:/testforge/testforge/docs/API_TESTING.md).
- **Validation**: Strict input validation for Auth, Project, and Test Case payloads. Protected field updates (`user`, `_id`, etc.) are explicitly rejected.
- **Ownership Security**: Multi-tenant authorization enforces `user: req.user._id` across all queries, returning `404 Not Found` for unauthorized resource access.
- **Error Handling**: Centralized error middleware standardizes responses for Mongoose validation, CastErrors, duplicate keys, and JWT errors.

## Authentication API

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login and receive a JWT |
| `GET` | `/api/auth/me` | ✅ Bearer | Get current user |

## Projects API

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|---|
| `POST` | `/api/projects` | ✅ Bearer | Create a new project |
| `GET` | `/api/projects` | ✅ Bearer | Get all projects owned by user |
| `GET` | `/api/projects/:id` | ✅ Bearer | Get project by ID |
| `PATCH` | `/api/projects/:id` | ✅ Bearer | Update project details |
| `DELETE` | `/api/projects/:id` | ✅ Bearer | Delete a project |

## Test Cases API

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|---|
| `POST` | `/api/projects/:projectId/test-cases` | ✅ Bearer | Create test case in project |
| `GET` | `/api/projects/:projectId/test-cases` | ✅ Bearer | Get all test cases in project |
| `GET` | `/api/test-cases/:id` | ✅ Bearer | Get test case by ID |
| `PATCH` | `/api/test-cases/:id` | ✅ Bearer | Update test case (name, description, dsl) |
| `DELETE` | `/api/test-cases/:id` | ✅ Bearer | Delete a test case |

## Utility API

| Method | Endpoint | Description |
|--------|----------|---|
| `GET` | `/` | Root welcome message |
| `GET` | `/api/health` | API health check |

## Local Development

### Prerequisites

- Node.js >= 18
- npm >= 8
- A MongoDB Atlas account and cluster

### 1. Clone the repository

```bash
git clone https://github.com/VIJAYAPANDIANT/testforge.git
cd testforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env` and fill in:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — a secure random string (e.g. use `openssl rand -hex 64`)

### 4. Start the development server

```bash
npm run dev
```

The API will be available at:

- `http://localhost:5000/` — Root welcome route
- `http://localhost:5000/api/health` — Health check
- `http://localhost:5000/api/auth/register` — Register
- `http://localhost:5000/api/auth/login` — Login
- `http://localhost:5000/api/auth/me` — Get current user (protected)
- `http://localhost:5000/api/projects` — Projects management
- `http://localhost:5000/api/test-cases` — Test Cases management

## Packages

| Package | Description |
|---|---|
| `@testforge/server` | Express REST API |
| `@testforge/client` | React frontend (placeholder) |
| `@testforge/worker` | Playwright worker (placeholder) |
| `@testforge/dsl-schema` | Shared DSL schema definitions |
