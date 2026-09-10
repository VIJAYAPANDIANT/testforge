# TestForge

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Architecture: Monorepo](https://img.shields.io/badge/Architecture-Monorepo-blue.svg)](https://github.com/VIJAYAPANDIANT/testforge)
[![Build Status](https://img.shields.io/badge/tests-126%20passed-success.svg)](#testing)

> **TestForge** is a modern, enterprise-grade, no-code Playwright test automation platform. It empowers QA engineers and developers to visually build browser end-to-end test workflows, automatically generate robust Playwright TypeScript code, and execute tests in isolated browser environments with real-time reporting and failure screenshot capture.

---

## 🚀 Key Features

- **No-Code Visual Workflows**: Define browser end-to-end tests using a strictly typed, validated JSON Domain Specific Language (DSL).
- **Playwright Code Generation Engine**: Dynamically converts JSON DSL steps into production-ready Playwright TypeScript (`.spec.ts`) test code.
- **Robust Locator Strategies**: Supports `role`, `text`, and `css` locators with automatic fallback locator strategies for maximum selector resilience.
- **Isolated Execution Engine**: Spawns isolated Playwright worker processes executing tests against headless Chromium.
- **Automatic Failure Screenshot Capture**: Instantly captures and serves high-resolution failure screenshots on test assertion or timeout failures.
- **MongoDB Test Execution Persistence**: Fully persists every test execution (`Run`) and outcome (`RunResult`), tracking status transitions (`queued` → `running` → `passed`/`failed`), exit codes, execution timing, `stdout`, and `stderr`.
- **Enterprise-Grade Security**: Enforces JWT authentication and multi-tenant resource ownership checks across Projects, Environments, TestCases, and Runs.

---

## 🏗️ Architecture Overview

```
 ┌─────────────────────────────────────────────────────────┐
 │                      React Client                       │
 │                     (apps/client)                       │
 └────────────────────────────┬────────────────────────────┘
                              │ HTTP / REST API (JWT Auth)
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │                       Express API                       │
 │                      (apps/server)                      │
 ├────────────────────────────┬────────────────────────────┤
 │  • Auth & Authorization    │  • DSL Validator           │
 │  • Project & Test Admin    │  • Execution Persistence   │
 └──────────────┬─────────────┴──────────────┬─────────────┘
                │                            │
                ▼                            ▼
 ┌──────────────────────────┐  ┌──────────────────────────┐
 │      MongoDB Database    │  │ Playwright Execution     │
 │ (Run & RunResult Models) │  │ Worker (apps/worker)     │
 └──────────────────────────┘  └─────────────┬────────────┘
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │     Headless Chromium    │
                               └──────────────────────────┘
```

---

## 📦 Monorepo Structure

TestForge is structured as a high-performance monorepo powered by npm workspaces:

```
testforge/
├── apps/
│   ├── client/              # React frontend workspace (Test Builder UI)
│   ├── server/              # Express REST API (Auth, CRUD, Execution Orchestration)
│   └── worker/              # Standalone Playwright Execution Worker & CLI
│       └── uploads/         # Failure screenshot storage (/uploads/screenshots)
│
├── packages/
│   ├── dsl-schema/          # Shared TestForge JSON DSL schema definition & validator
│   └── codegen/             # Playwright TypeScript code generation engine
│
├── docs/
│   ├── DSL_SPEC.md          # Complete TestForge DSL specification v1.0
│   ├── CODEGEN.md           # Playwright Code Generation Engine documentation
│   └── API_TESTING.md       # API Testing & Postman integration guide
│
├── package.json             # Root monorepo configuration
└── README.md
```

---

## ⚙️ Test Workflow DSL & Code Generation

TestForge transforms high-level JSON test steps into optimized Playwright TypeScript scripts.

### Supported Step Types

| Step Type | Description | Key Parameters |
|---|---|---|
| **`navigate`** | Navigates browser to target URL | `url` (supports `{{BASE_URL}}` placeholders) |
| **`click`** | Clicks target element | `locator`, optional `fallback` |
| **`fill`** | Inputs text into form fields | `locator`, `value` |
| **`assertVisible`** | Asserts element visibility in DOM | `locator`, optional `fallback` |
| **`assertText`** | Asserts element text content | `locator`, `expectedText` |
| **`wait`** | Pauses execution for duration | `duration` (100ms – 120,000ms) |
| **`screenshot`** | Captures page screenshot | `name`, optional `fullPage` |

### Supported Locator Strategies

- **`role`**: Selects element by ARIA role and optional accessible name (`role: "button", name: "Submit"`)
- **`text`**: Selects element containing exact or substring text (`value: "Welcome Back"`)
- **`css`**: Selects element matching CSS selector (`value: "#login-button"`)
- **`fallback`**: Secondary locator automatically attempted if the primary locator strategy fails

---

## 📡 REST API Reference

All protected endpoints require a `Authorization: Bearer <token>` header.

### 🏃 Test Execution API

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/runs` | ✅ | Execute test case, persist `Run`/`RunResult`, capture screenshots |
| `GET` | `/api/runs/:id` | ✅ | Get execution run details and outcome result by ID |
| `GET` | `/uploads/*` | ❌ | Access statically served failure screenshot PNG files |

#### Execute Test Case (`POST /api/runs`)

**Request Payload:**
```json
{
  "testCaseId": "66d9a10777f204cd53e56d96",
  "environmentId": "66d9a10777f204cd53e56d97"
}
```

**Response (`200 OK` - Passed Execution):**
```json
{
  "success": true,
  "data": {
    "runId": "66d9a10777f204cd53e56d96",
    "status": "passed",
    "exitCode": 0,
    "stdout": "...",
    "stderr": "",
    "durationMs": 2340,
    "screenshotPath": null
  }
}
```

**Response (`200 OK` - Assertion Failure with Screenshot):**
```json
{
  "success": false,
  "data": {
    "runId": "66d9a10867f204cd53e56d98",
    "status": "failed",
    "exitCode": 1,
    "stdout": "...",
    "stderr": "...",
    "durationMs": 3410,
    "screenshotPath": "/uploads/screenshots/66d9a10867f204cd53e56d98/test-failed-1.png"
  }
}
```

---

### 🔐 Authentication API

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user account |
| `POST` | `/api/auth/login` | ❌ | Authenticate user & issue JWT token |
| `GET` | `/api/auth/me` | ✅ | Fetch currently authenticated user profile |

---

### 📁 Projects API

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/projects` | ✅ | Create a new project |
| `GET` | `/api/projects` | ✅ | List all projects owned by user |
| `GET` | `/api/projects/:id` | ✅ | Retrieve project details by ID |
| `PATCH` | `/api/projects/:id` | ✅ | Update project metadata |
| `DELETE` | `/api/projects/:id` | ✅ | Delete project and associated resources |

---

### 🌐 Environments API

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/projects/:projectId/environments` | ✅ | Create environment in project |
| `GET` | `/api/projects/:projectId/environments` | ✅ | List environments for a project |
| `GET` | `/api/environments/:id` | ✅ | Get environment by ID |
| `PATCH` | `/api/environments/:id` | ✅ | Update environment (`name`, `baseUrl`) |
| `DELETE` | `/api/environments/:id` | ✅ | Delete environment |

---

### 🧪 Test Cases API

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/projects/:projectId/test-cases` | ✅ | Create test case in project (DSL validated) |
| `GET` | `/api/projects/:projectId/test-cases` | ✅ | List test cases in a project |
| `GET` | `/api/test-cases/:id` | ✅ | Retrieve test case by ID |
| `PATCH` | `/api/test-cases/:id` | ✅ | Update test case (`name`, `description`, `dsl`) |
| `DELETE` | `/api/test-cases/:id` | ✅ | Delete test case |

---

## 🛠️ Local Development & Setup

### Prerequisites

- **Node.js**: `>= 18.0.0`
- **npm**: `>= 8.0.0`
- **MongoDB**: Local MongoDB instance or MongoDB Atlas Connection URI

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/VIJAYAPANDIANT/testforge.git
   cd testforge
   ```

2. **Install Workspace Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```
   Configure `MONGODB_URI`, `JWT_SECRET`, and optional `PORT` inside `apps/server/.env`.

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The REST API will start at `http://localhost:5000/`.

---

## 🧪 Testing

TestForge maintains a comprehensive test suite across all monorepo workspaces:

```bash
# Run server test suite
npm test --workspace=apps/server

# Run package test suites
npm test --workspace=packages/dsl-schema --workspace=packages/codegen --workspace=apps/worker
```

### Test Coverage Summary

- `@testforge/dsl-schema`: 28 / 28 tests passing
- `@testforge/codegen`: 69 / 69 tests passing
- `@testforge/worker`: 9 / 9 tests passing
- `@testforge/server`: 20 / 20 tests passing
- **Total Test Suite**: **126 / 126 passing tests (100% pass rate)**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
