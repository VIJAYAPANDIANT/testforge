# TestForge — No-Code Browser Test Automation Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Architecture: Monorepo](https://img.shields.io/badge/Architecture-Monorepo-blue.svg)](https://github.com/VIJAYAPANDIANT/testforge)
[![Build Status](https://img.shields.io/badge/tests-99%20passed-success.svg)](#testing)

> **TestForge** is a visual web test automation platform that allows QA engineers and developers to build browser tests visually without manually writing Playwright code. TestForge converts visual test steps into a structured DSL, generates Playwright TypeScript tests, executes them in Chromium, and displays execution results in real-time.

---

## 🎯 The Problem & Solution

### The Problem
- **Repetitive Manual Testing**: Regression testing by clicking manually through web applications consumes valuable developer time.
- **High Barrier to Entry**: Writing code-based browser automation requires expertise in TypeScript, Playwright selectors, async handling, and assertion frameworks.
- **Opaque Test Failures**: Troubleshooting broken tests without clear error tracebacks or failure screenshots is slow and frustrating.

### The Solution
TestForge bridges visual test creation with real Playwright browser automation:

```
Visual Test Builder  ➜  Test DSL  ➜  Playwright Codegen  ➜  Chromium Worker  ➜  Socket.IO & Run History  ➜  Dashboard
```

1. **Visual Builder**: Users build test flows using drag-and-drop or click-to-add action blocks.
2. **Structured Test DSL**: Workflow is stored as a validated, version-controlled JSON DSL schema.
3. **Playwright Codegen Engine**: Translates high-level DSL steps into production-ready Playwright TypeScript (`.spec.ts`).
4. **Isolated Chromium Worker**: Spawns isolated worker processes executing tests in headless Chromium.
5. **Real-time & Persistent Reporting**: Streams live execution status via Socket.IO, persists results to MongoDB, captures failure screenshots, and renders real-time aggregate Dashboard metrics.

---

## 🚀 Key Features

- **Visual Drag-and-Drop Test Builder**: Drag or click action blocks to build sequential test workflows with real-time property editors, step reordering, duplication, and deletion.
- **7 Supported Test Actions**:
  - `Navigate`: Browser navigation (supports `{{BASE_URL}}` placeholders).
  - `Click`: Clicks target element by role, text, or CSS selector.
  - `Fill`: Inputs text into form fields.
  - `Assert Visible`: Verifies element visibility in the DOM.
  - `Assert Text`: Verifies element text content against expected values.
  - `Wait`: Pauses execution for specified duration (100ms – 120,000ms).
  - `Screenshot`: Captures page screenshots (element or full-page).
- **Resilient Locator Strategies**: Supports `role`, `text`, and `css` strategies with automatic backup fallback locators.
- **Playwright Code Generation Engine**: Generates safe, executable Playwright TypeScript test scripts (`.spec.ts`).
- **Real-time Execution Streaming**: Socket.IO streams live execution transitions (`QUEUED`, `RUNNING`, step-by-step progress, `PASSED`, `FAILED`).
- **Failure Screenshot Capture**: Captures and statically serves high-resolution PNG screenshots upon test assertion or timeout failures.
- **Persistent Run History & Detail Modal**: Explore past executions, step-by-step stdout/stderr logs, duration metrics, and embedded failure screenshots.
- **Real Dashboard Metrics**: Aggregate metric cards (`Total Projects`, `Test Cases`, `Total Runs`, `Pass Rate %`, `Passed Runs`, `Failed Runs`) and recent test executions table powered by real MongoDB data.
- **Enterprise-Grade Security**: Enforces JWT authentication and user-scoped data authorization.

---

## 🏛️ System Architecture

```
User (Browser)
  │
  ├─► React Frontend (apps/client)
  │     ├── Visual Builder Canvas
  │     ├── Socket.IO Client
  │     └── Dashboard Metrics & Run History
  │
  └─► Express REST API (apps/server) ◄──► MongoDB Atlas
        │   ├── Auth, Projects, Test Cases, Runs APIs
        │   └── Socket.IO Real-Time Server
        │
        ├──► Shared DSL Schema Validator (@testforge/dsl-schema)
        ├──► Playwright Code Generator (@testforge/codegen)
        │
        └─► Playwright Execution Worker (apps/worker)
              └── Headless Chromium Engine
                    └── Failure Screenshots (/uploads/screenshots)
```

---

## 📦 Monorepo Structure

```
testforge/
├── apps/
│   ├── client/              # React 18 + Vite + TypeScript frontend (Visual Canvas, Dashboard)
│   ├── server/              # Express REST API & Socket.IO server (Auth, CRUD, Execution)
│   └── worker/              # Standalone Playwright Execution Worker
│       └── uploads/         # Statically served failure screenshots (/uploads/screenshots)
│
├── packages/
│   ├── dsl-schema/          # Shared TestForge JSON DSL schema definition & validator
│   └── codegen/             # Playwright TypeScript code generation engine
│
├── .env.example             # Environment variable placeholders
└── README.md
```

---

## ⚙️ Example Test Workflow

1. **Create Project**: Name: `MyShop E-Commerce`.
2. **Create Test Case**: Name: `User Login & Dashboard Assertion`.
3. **Build Steps in Visual Canvas**:
   - `1. Navigate`: `https://example.com/login`
   - `2. Fill`: Locator `role: textbox "Email"` ➜ Value: `user@example.com`
   - `3. Fill`: Locator `role: textbox "Password"` ➜ Value: `SecretPass123`
   - `4. Click`: Locator `role: button "Sign In"`
   - `5. Assert Visible`: Locator `role: heading "Dashboard"`
   - `6. Screenshot`: Name `login-success`
4. **Save & Execute**: Click `[ Save Test Case ]` ➜ Click `[ Run Test ]`.
5. **Real-time Status**: Watch live Socket.IO step indicators ➜ View final status, duration, failure screenshots (if any), and updated Dashboard metrics.

---

## 🛠️ Setup & Local Development Guide

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
   npm run install:all
   ```

3. **Configure Environment Variables:**
   Create `.env` in `apps/server/.env` based on `.env.example`:
   ```ini
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/testforge
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   ```

4. **Start Development Servers:**
   ```bash
   # Start backend Express API server (http://localhost:5000)
   npm run dev:server

   # Start frontend React client (http://localhost:5173)
   npm run dev:client
   ```

---

## 🧪 Testing & Build Verification

TestForge maintains a unit test suite across all monorepo workspaces:

```bash
# Build React frontend application
npm run build --workspace=apps/client

# Run all monorepo unit test suites
npm test --workspace=packages/dsl-schema --workspace=packages/codegen --workspace=apps/server
```

---

## 🔄 Auto-Test on Update (Post-MVP)

TestForge supports automatic test case execution triggered by external code updates or deployment events via a generic webhook endpoint.

```
Website Code Update / Deployment Event
                  │
                  ▼
   Generic Webhook POST Request
   (x-testforge-webhook-secret Header)
                  │
                  ▼
       TestForge API Server
       (Branch Filtering & Deduplication)
                  │
                  ▼
       Reuses Execution Pipeline
       (Playwright + Chromium Worker)
                  │
                  ▼
     Live Socket.IO & Dashboard
```

### Webhook Endpoint & Payload Structure

- **Endpoint**: `POST /api/webhooks/project/:projectId`
- **Authentication**: `x-testforge-webhook-secret: <your_webhook_secret>`

#### Example Webhook Request (cURL)
```bash
curl -X POST "http://localhost:5000/api/webhooks/project/66f1234567890abcdef11111" \
  -H "Content-Type: application/json" \
  -H "x-testforge-webhook-secret: 3f8a91b2c4e5d6f7890123456789abcd" \
  -d '{
    "event": "deployment",
    "branch": "main",
    "commit": "abc1234",
    "repository": "myorg/myshop"
  }'
```

#### Example Response (HTTP 202 Accepted)
```json
{
  "success": true,
  "message": "Automatic tests triggered",
  "projectId": "66f1234567890abcdef11111",
  "triggeredTests": 3,
  "runIds": ["66f1234567890abcdef22222", "66f1234567890abcdef33333"]
}
```

---

## ⚠️ MVP Limitations

- **Browser Scope**: Headless Chromium browser automation.
- **Execution Model**: Single-runner execution per worker process.
- **Triggers**: Manual execution trigger & generic POST webhook trigger.

---

## 🔮 Future Roadmap

- **Full CI/CD Provider Apps**: Native GitHub App and GitLab CI integration.
- **Multi-Browser Support**: Firefox and WebKit browser execution environments.
- **Parallel Execution**: Distributed worker queue for concurrent test suite runs.
- **Test Scheduling**: Scheduled cron triggers for recurring automated health checks.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
