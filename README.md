# TestForge — No-Code Browser Test Automation Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Architecture: Monorepo](https://img.shields.io/badge/Architecture-Monorepo-blue.svg)](https://github.com/VIJAYAPANDIANT/testforge)
[![Build Status](https://img.shields.io/badge/tests-117%20passed-success.svg)](#testing)

> **TestForge** is a visual web test automation platform that allows QA engineers and developers to build browser tests visually without manually writing Playwright code. TestForge converts visual test steps into a structured DSL, generates Playwright TypeScript tests, executes them in Chromium, streams execution results in real-time, supports GitHub webhook triggers on code push, and provides AI-powered failure analysis.

---

## 🎯 The Problem & Solution

### The Problem
- **Repetitive Manual Testing**: Regression testing by clicking manually through web applications consumes valuable developer time.
- **High Barrier to Entry**: Writing code-based browser automation requires expertise in TypeScript, Playwright selectors, async handling, and assertion frameworks.
- **Opaque Test Failures**: Troubleshooting broken tests without clear error tracebacks, failure screenshots, or root-cause explanations is slow and frustrating.

### The Solution
TestForge bridges visual test creation with real Playwright browser automation and AI failure diagnosis:

```
Visual Test Builder  ➜  Test DSL  ➜  Playwright Codegen  ➜  Chromium Worker  ➜  Socket.IO & Run History  ➜  AI Failure Analysis  ➜  Dashboard
```

1. **Visual Builder**: Users build test flows using drag-and-drop or click-to-add action blocks.
2. **Structured Test DSL**: Workflow is stored as a validated, version-controlled JSON DSL schema.
3. **Playwright Codegen Engine**: Translates high-level DSL steps into production-ready Playwright TypeScript (`.spec.ts`).
4. **Isolated Chromium Worker**: Spawns isolated worker processes executing tests in headless Chromium.
5. **Real-time & Persistent Reporting**: Streams live execution status via Socket.IO, persists results to MongoDB, captures failure screenshots, and renders real-time aggregate Dashboard metrics.
6. **GitHub Webhook Automation**: Automatically triggers test suites when code is pushed to configured repository branches.
7. **AI Failure Analysis**: Provides structured failure explanations, evidence points, technical causes, investigation steps, and suggested fixes on demand.

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
- **GitHub & Generic Webhook Automation**: HMAC-SHA256 authenticated webhooks trigger automated test runs on website code pushes.
- **AI-Powered Failure Analysis**: On-demand AI diagnosis powered by Google Gemini explaining why a test failed, key evidence, likely technical cause, investigation steps, and suggested fixes.
- **Real Dashboard Metrics**: Aggregate metric cards (`Total Projects`, `Test Cases`, `Total Runs`, `Pass Rate %`, `Automatic Runs`, `Auto Pass Rate %`) and recent test executions table powered by real MongoDB data.
- **Enterprise-Grade Security**: Enforces JWT authentication, user-scoped data authorization, input sanitization, and secret redaction.

---

## 🏛️ System Architecture

```
User (Browser)
  │
  ├─► React Frontend (apps/client)
  │     ├── Visual Builder Canvas
  │     ├── Socket.IO Client
  │     └── Dashboard Metrics, Run History & AI Analysis UI
  │
  └─► Express REST API (apps/server) ◄──► MongoDB Atlas
        │   ├── Auth, Projects, Test Cases, Runs, Webhooks, AI APIs
        │   └── Socket.IO Real-Time Server
        │
        ├──► Shared DSL Schema Validator (@testforge/dsl-schema)
        ├──► Playwright Code Generator (@testforge/codegen)
        ├──► AI Failure Analysis Service (Google Gemini API)
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
│   ├── client/              # React 18 + Vite + TypeScript frontend (Visual Canvas, Dashboard, AI Analysis)
│   ├── server/              # Express REST API & Socket.IO server (Auth, CRUD, Execution, Webhooks, AI)
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
6. **AI Failure Analysis**: If execution fails, click `[ Analyze Failure ]` in the Run Detail modal to get a structured AI diagnosis.

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
   GEMINI_API_KEY=your_gemini_api_key_here
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

TestForge maintains an extensive unit test suite across all monorepo workspaces:

```bash
# Build React frontend application
npm run build --workspace=apps/client

# Run all monorepo unit test suites (117 tests)
npm test --workspace=packages/dsl-schema --workspace=packages/codegen --workspace=apps/server
```

---

## 🔄 Auto-Test on Update & GitHub Integration

TestForge supports automatic test execution triggered by code updates via webhooks.

### GitHub Webhook Integration (`POST /api/webhooks/github/:projectId`)
- **Endpoint**: `POST /api/webhooks/github/:projectId`
- **Authentication**: Header `X-Hub-Signature-256: sha256=<HMAC_SHA256_HEX>`
- **Event**: `X-GitHub-Event: push`

##### GitHub Setup Steps:
1. Open your GitHub repository ➜ **Settings** ➜ **Webhooks** ➜ **Add webhook**.
2. **Payload URL**: `http://localhost:5000/api/webhooks/github/<projectId>` (or your server domain).
3. **Content type**: `application/json`.
4. **Secret**: Copy your project's Webhook Secret from TestForge.
5. **Which events**: Select **Just the push event**.
6. Pushes to your configured branch (e.g. `main`) automatically trigger visual test runs in Chromium!

---

## 🤖 AI Failure Analysis

When an execution fails:
1. Open **Run History** ➜ Click the failed run row to open **Run Detail**.
2. Click `[ 🪄 Analyze Failure ]`.
3. TestForge collects worker stderr, step errors, and DSL context, sanitizes sensitive data (passwords, JWTs, secrets), and sends it to Gemini.
4. Returns structured diagnosis:
   - **Summary**: Overview of what failed.
   - **Failed Step**: Specific step and locator details.
   - **Observed Error**: Exact assertion or timeout error.
   - **Likely Cause**: Technical explanation.
   - **Evidence**: Key logs and assertions.
   - **Suggested Investigation**: Actionable steps to debug.
   - **Possible Fix**: Recommended adjustments.
   - **Uncertainty**: Known limitations or missing context.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
