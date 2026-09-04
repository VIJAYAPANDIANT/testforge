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
🚧 Week 3 — Execution Engine
✅ Day 6 — Formal DSL Schema & Validator completed
✅ Day 7 — Navigate, Click and Fill code generation completed
✅ Day 8 — AssertVisible, AssertText, Wait and Screenshot code generation completed
✅ Day 9 — Complete DSL → Playwright .spec.ts generation completed
✅ Day 10 — Locator Strategies, Validation & Fallback Locators completed
✅ Day 11 — Standalone Playwright Execution Worker (apps/worker) completed
```

## Test Workflow DSL & Code Generation Engine

TestForge converts visual test workflows defined in JSON DSL into complete, runnable Playwright TypeScript (`.spec.ts`) test files and executes them via the standalone worker module.

- **DSL Schema**: Defined in `@testforge/dsl-schema` (spec in [`docs/DSL_SPEC.md`](file:///c:/testforge/testforge/docs/DSL_SPEC.md)).
- **Code Generation Engine**: Implemented in `@testforge/codegen` (doc in [`docs/CODEGEN.md`](file:///c:/testforge/testforge/docs/CODEGEN.md)).
- **Execution Worker**: Implemented in `@testforge/worker` (doc in [`apps/worker/README.md`](file:///c:/testforge/testforge/apps/worker/README.md)). Executes generated `.spec.ts` test files using Playwright & Chromium in headless mode, returning structured results (`status`, `exitCode`, `stdout`, `stderr`, `durationMs`).

Supported step types:
- **`navigate`**: Open a web page URL (supports placeholders like `{{BASE_URL}}` mapped to `process.env.BASE_URL`)
- **`click`**: Click an element using `role`, `text`, or `css` locator (supports optional `fallback` locator)
- **`fill`**: Input text into a form field
- **`assertVisible`**: Assert an element is visible in the DOM
- **`assertText`**: Assert an element contains expected text
- **`wait`**: Pause execution for a specified duration in milliseconds
- **`screenshot`**: Capture a page screenshot with optional fullPage flag and safe path sanitization

### System Roadmap

| Feature | Status |
|---|---|
| Backend REST API (Auth, Projects, TestCases, Environments) | ✅ Completed (Week 1) |
| Shared DSL Schema & Validation | ✅ Completed (Week 2 Day 6) |
| Playwright Step Code Generation (All 7 Steps) | ✅ Completed (Week 2 Days 7-8) |
| Full `.spec.ts` Test File Code Generator | ✅ Completed (Week 2 Day 9) |
| Locator Strategies, Validation & Fallback Locators | ✅ Completed (Week 2 Day 10) |
| Standalone Playwright Execution Worker | ✅ Completed (Week 3 Day 11) |
| Server Execution Integration & API | ⏳ Coming Week 3 Day 12 |
| React Visual Test Builder UI | ⏳ Coming Week 3 (`apps/client`) |

## Repository Structure

```
testforge/
├── apps/
│   ├── client/              # React frontend  (coming Week 3)
│   ├── server/              # Express REST API ← active
│   │   └── src/
│   │       ├── config/      # MongoDB connection
│   │       ├── controllers/ # Auth, Project, TestCase, Environment controllers
│   │       ├── middleware/  # Auth, ObjectId & error handling middleware
│   │       ├── models/      # User, Project, TestCase, Environment Mongoose models
│   │       ├── routes/      # Auth, Health, Project, TestCase, Environment routers
│   │       └── utils/       # Shared utilities
│   └── worker/              # Standalone Playwright execution worker ← active
│       ├── fixtures/        # Passing & failing test fixtures
│       ├── src/             # Execution runner & CLI tool
│       └── tests/           # Worker unit & integration tests
│
├── docs/
│   ├── DSL_SPEC.md          # Complete TestForge DSL specification v1.0
│   ├── CODEGEN.md           # Playwright Code Generation Engine documentation
│   ├── API_TESTING.md       # Complete API testing guide
│   └── postman/             # Postman collection & environment
│
├── packages/
│   ├── dsl-schema/          # Shared DSL schema definitions and validator
│   └── codegen/             # Playwright TypeScript code generation engine
│       ├── src/             # Step generators, locator generators, dslToPlaywrightScript, CLI
│       ├── examples/        # DSL fixtures and generated .spec.ts files
│       └── tests/           # Unit test suite for code generator & locators
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API Testing & Quality Assurance

- **Postman Collection**: Pre-configured collection at [`docs/postman/TestForge_API.postman_collection.json`](file:///c:/testforge/testforge/docs/postman/TestForge_API.postman_collection.json) with automated environment variable capture (`authToken`, `projectId`, `environmentId`, `testCaseId`).
- **Postman Environment**: Environment configuration file at [`docs/postman/TestForge_Local.postman_environment.json`](file:///c:/testforge/testforge/docs/postman/TestForge_Local.postman_environment.json).
- **API Testing Guide**: Comprehensive instructions at [`docs/API_TESTING.md`](file:///c:/testforge/testforge/docs/API_TESTING.md).
- **Validation**: Strict input validation for Auth, Project, Environment (HTTP/HTTPS URL check), and Test Case payloads (validated via `@testforge/dsl-schema`). Protected field updates (`user`, `_id`, etc.) are explicitly rejected.
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

## Environments API

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|---|
| `POST` | `/api/projects/:projectId/environments` | ✅ Bearer | Create environment in project |
| `GET` | `/api/projects/:projectId/environments` | ✅ Bearer | Get all environments for project |
| `GET` | `/api/environments/:id` | ✅ Bearer | Get environment by ID |
| `PATCH` | `/api/environments/:id` | ✅ Bearer | Update environment (name, baseUrl) |
| `DELETE` | `/api/environments/:id` | ✅ Bearer | Delete environment |

## Test Cases API

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|---|
| `POST` | `/api/projects/:projectId/test-cases` | ✅ Bearer | Create test case in project (DSL validated) |
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
- `http://localhost:5000/api/environments` — Environments management
- `http://localhost:5000/api/test-cases` — Test Cases management

## Packages

| Package | Description |
|---|---|
| `@testforge/server` | Express REST API |
| `@testforge/client` | React frontend (placeholder) |
| `@testforge/worker` | Standalone Playwright test execution worker |
| `@testforge/dsl-schema` | Shared DSL schema definitions and validator |
| `@testforge/codegen` | Playwright TypeScript code generation engine |
