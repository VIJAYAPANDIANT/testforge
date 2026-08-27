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
│   │       ├── middleware/  # Auth + error handling
│   │       ├── models/      # User, Project, TestCase Mongoose models
│   │       ├── routes/      # Auth, Health, Project, TestCase routers
│   │       └── utils/       # Shared utilities
│   └── worker/              # Playwright execution worker (coming Week 3)
│
├── packages/
│   └── dsl-schema/          # Shared test workflow schema
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

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
