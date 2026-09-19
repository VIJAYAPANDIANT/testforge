# TestForge 🚀

**An Enterprise No-Code Web Test Automation & AI Diagnosis Platform**

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.44-2EAD33.svg?style=for-the-badge&logo=playwright)](https://playwright.dev/)
[![Express.js](https://img.shields.io/badge/Express-4.19-000000.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-4.8-010101.svg?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![Google Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E75B2.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Build Status](https://img.shields.io/badge/Tests-117_Passed-success.svg?style=for-the-badge)](#-testing--build-verification)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary

**TestForge** is a modern, end-to-end visual test automation platform built for software development teams, QA engineers, and product managers. It enables users to construct, maintain, execute, and troubleshoot automated browser tests visually—**without writing manual Playwright code**.

TestForge converts visual test workflows into a structured JSON Domain Specific Language (**DSL**), compiles the DSL into production-ready Playwright TypeScript (`.spec.ts`) scripts, executes tests in headless **Chromium** worker processes, streams live execution events via **Socket.IO**, triggers automated test suites on **GitHub code pushes**, and diagnoses failures using **Google Gemini AI**.

---

## 🌟 Key Capabilities

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  Visual Test Builder   │ ────►│   Test DSL Schema      │ ────►│ Playwright Code Engine │
│  (Drag-and-Drop steps) │      │ (@testforge/dsl-schema)│      │   (@testforge/codegen) │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                            │
                                                                            ▼
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  Auto-Test Dashboard   │ ◄────│   AI Failure Analysis  │ ◄────│ Headless Chromium      │
│  & GitHub Webhooks     │      │ (Google Gemini API)    │      │ (Playwright Worker)    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

### 🎨 Visual Test Builder & Resilient DSL
- **No-Code Drag-and-Drop Canvas**: Visually assemble test flows using interactive action blocks. Supports step reordering, duplication, parameter editing, and instant validation.
- **7 Core Test Actions**:
  1. `Navigate`: Webpage navigation with URL parameterization (`{{BASE_URL}}`).
  2. `Click`: Element clicks using role, text, or CSS selectors.
  3. `Fill`: Form input population.
  4. `Assert Visible`: Verifies DOM element visibility.
  5. `Assert Text`: Validates element text against expected values.
  6. `Wait`: Custom execution delays (`100ms` to `120,000ms`).
  7. `Screenshot`: Full-page or element screenshot capture.
- **Multi-Tier Locator Fallbacks**: Combines `role`, `text`, and `css` selector strategies with automatic backup fallbacks to prevent test flakiness when UI elements shift.

### ⚙️ Code Generation & Headless Execution
- **Automated Playwright Codegen**: `@testforge/codegen` transforms structured JSON DSL into strictly typed, production-ready Playwright TypeScript spec files.
- **Isolated Worker Processes**: Spawns isolated worker child processes executing tests in headless Chromium.
- **Real-Time Execution Streaming**: Live status events (`QUEUED`, `RUNNING`, step-by-step progress, `PASSED`, `FAILED`) streamed via Socket.IO.
- **Failure Screenshots**: Automatically captures high-resolution PNG screenshots upon step assertion failures or timeouts.

### 🔄 CI/CD & Webhook Test Automation
- **GitHub Webhook Integration**: HMAC-SHA256 authenticated webhooks trigger automated test runs on GitHub code pushes (`X-Hub-Signature-256`).
- **Generic Webhook Triggers**: Trigger test executions from external CI/CD pipelines (Jenkins, GitLab, CircleCI) using secret token authentication.
- **Branch & Repository Filtering**: Target specific repository branches (`main`, `develop`) and specific test case subsets.
- **Delivery Deduplication**: Guarantees idempotent execution handling via `X-GitHub-Delivery` tracking.

### 🪄 AI-Powered Failure Analysis
- **Automated Root-Cause Diagnosis**: On-demand AI diagnosis using Google Gemini (`gemini-2.5-flash`).
- **Structured Failure Intelligence**:
  - **Summary**: Concise explanation of the failure.
  - **Failed Step**: Precise step index, action type, and locator details.
  - **Observed Error**: Exact error trace or assertion failure.
  - **Likely Technical Cause**: Underlying reason (e.g., locator mismatch, element timeout, UI drift).
  - **Evidence**: Key log lines and DOM state references.
  - **Suggested Investigation**: Actionable debugging steps for developers.
  - **Possible Fix**: Recommended locator or code adjustments.
  - **Uncertainty**: Transparent assessment of missing context or ambiguity.
- **Zero-Trust Data Sanitization**: Passwords, JWTs, Bearer authorization headers, API keys, and database secrets are automatically redacted (`<REDACTED>`) before sending context to AI providers.

---

## 🏛️ System Architecture & Monorepo Structure

TestForge is organized as an enterprise-grade monorepo powered by npm workspaces:

```
testforge/
├── apps/
│   ├── client/                  # React 18 + Vite + TypeScript Frontend
│   │   ├── src/components/      # Visual Builder Canvas, Run History, Run Detail Modal, AI Card
│   │   ├── src/pages/           # Dashboard, Projects, Test Cases, Settings
│   │   └── src/services/        # Axios API Client & Socket.IO Event Handlers
│   │
│   ├── server/                  # Express REST API & Socket.IO Server
│   │   ├── src/controllers/     # Auth, Project, TestCase, Run, Webhook, AI Controllers
│   │   ├── src/models/          # MongoDB Mongoose Schemas (User, Project, TestCase, Run, RunResult)
│   │   ├── src/services/        # Execution Service & AI Analysis Service
│   │   └── tests/               # Backend Unit & Integration Test Suites
│   │
│   └── worker/                  # Standalone Playwright Execution Engine
│       ├── src/cli.js           # Worker Process CLI Execution Script
│       └── uploads/             # Statically Served Failure Screenshots (/uploads/screenshots)
│
├── packages/
│   ├── dsl-schema/              # Shared TestForge JSON DSL Schema & Validator (@testforge/dsl-schema)
│   └── codegen/                 # Playwright TypeScript Code Generation Engine (@testforge/codegen)
│
├── .env.example                 # Environment Variable Configuration Template
└── README.md                    # Project Documentation
```

---

## 🛠️ Getting Started & Quick Start Guide

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 8.0.0`
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

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
   # Server Configuration (apps/server)
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/testforge
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key_here

   # Client Configuration (apps/client)
   VITE_API_URL=http://localhost:5000
   ```

4. **Start Development Servers:**
   ```bash
   # Start backend API server (http://localhost:5000)
   npm run dev:server

   # Start frontend React application (http://localhost:5173)
   npm run dev:client
   ```

---

## 🧪 Testing & Build Verification

TestForge maintains a comprehensive unit and integration test suite across all monorepo packages:

```bash
# 1. Verify Frontend Production Build
npm run build --workspace=apps/client

# 2. Execute Monorepo Automated Test Suite (117 Unit Tests)
npm test --workspace=packages/dsl-schema --workspace=packages/codegen --workspace=apps/server
```

---

## 🔌 API Reference Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new user account | ❌ No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | ❌ No |
| `GET` | `/api/projects` | List projects owned by user | ✅ Yes |
| `POST` | `/api/projects` | Create new test project | ✅ Yes |
| `GET` | `/api/test-cases` | List test cases (filtered by project) | ✅ Yes |
| `POST` | `/api/test-cases` | Save new visual test case DSL | ✅ Yes |
| `POST` | `/api/runs` | Execute test case using Playwright worker | ✅ Yes |
| `GET` | `/api/runs/stats` | Fetch dashboard aggregate execution metrics | ✅ Yes |
| `GET` | `/api/runs/:id` | Fetch run details, step results & screenshots | ✅ Yes |
| `POST` | `/api/runs/:id/analyze` | Trigger AI failure analysis on failed run | ✅ Yes |
| `POST` | `/api/webhooks/github/:projectId` | GitHub Push Webhook endpoint (HMAC SHA256) | 🔑 Webhook Secret |
| `POST` | `/api/webhooks/project/:projectId` | Generic CI/CD Webhook endpoint | 🔑 Webhook Secret |
| `GET` | `/health` | API Health Check endpoint (`{ status: "ok" }`) | ❌ No |

---

## 🔒 Security & Privacy Practices

- **Strict Server-Side AI API Keys**: `GEMINI_API_KEY` is kept exclusively on the backend server. It is never bundled into client JS code or exposed to frontends.
- **Sensitive Data Masking**: Automatic regex redaction masks passwords, JWT tokens, Bearer authorization headers, API keys, and database credentials before sending failure context to AI providers.
- **HMAC SHA-256 Webhook Verification**: GitHub webhooks are authenticated using timing-safe comparisons over unparsed raw request body bytes (`req.rawBody`).
- **Static File Serving Security**: Screenshot endpoints serve images through `express.static` with strict path isolation, protecting against directory traversal.
- **Child Process Command Safety**: Worker execution uses safe argument arrays with `spawn` (avoiding shell interpolation).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
