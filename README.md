<p align="center">
  <img src="assets/banner.jpg" alt="TestForge — Enterprise Test Automation Platform" width="100%" style="max-width: 80px; border-radius: 8px;" />
</p>

<p align="center">
  <strong>An Enterprise No-Code Web Test Automation & AI Diagnosis Platform</strong>
</p>

<p align="center">
  <a href="https://testforge-client.vercel.app"><img src="https://img.shields.io/badge/Production_App-Live_on_Vercel-000000?logo=vercel" alt="Live App on Vercel" /></a>
  <a href="https://testforge-server.vercel.app"><img src="https://img.shields.io/badge/Production_API-Live_on_Vercel-000000?logo=vercel" alt="Live API on Vercel" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=nodedotjs" alt="Node.js Version" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.0-61DAFB?logo=react" alt="React" /></a>
  <a href="https://playwright.dev/"><img src="https://img.shields.io/badge/Playwright-1.44-2EAD33?logo=playwright" alt="Playwright" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4.19-000000?logo=express" alt="Express.js" /></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb" alt="MongoDB" /></a>
  <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-4.8-010101?logo=socketdotio" alt="Socket.IO" /></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E75B2?logo=google" alt="Google Gemini AI" /></a>
  <a href="#-testing--build-verification"><img src="https://img.shields.io/badge/Tests-117_Passed-success" alt="Build Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT" /></a>
</p>

---

## 📌 Executive Summary

**TestForge** is an end-to-end visual web test automation platform built for software development teams, QA engineers, and product managers. It enables users to construct, maintain, execute, and troubleshoot automated browser tests visually—**without writing manual Playwright code**.

TestForge converts visual test workflows into a structured JSON Domain Specific Language (**DSL**), compiles the DSL into production-ready Playwright TypeScript (`.spec.ts`) scripts, executes tests in headless **Chromium** worker processes, streams live execution events via **Socket.IO**, triggers automated test suites on **GitHub code pushes**, and diagnoses failures using **Google Gemini AI**.

---

## 📋 Functional & Non-Functional Requirements

### ⚙️ Functional Requirements

1. **Public Landing Page & Presentation**:
   - High-impact SaaS landing page showcasing platform features, visual architecture, and interactive end-to-end workflow walk-throughs.
   - Top navigation bar featuring brand identity, navigation links, and direct `Sign In` / `Sign Up` / `Dashboard` action links.

2. **User Authentication & Session Management**:
   - Secure JWT-based user registration, login, and session persistence.
   - Resource ownership checks ensuring users access only their own projects, test cases, execution runs, screenshots, and AI failure analyses.

3. **Visual Test Builder & DSL Engine**:
   - Visual drag-and-drop canvas supporting 7 action step types: `Navigate`, `Click`, `Fill`, `Assert Visible`, `Assert Text`, `Wait`, and `Screenshot`.
   - Property inspector for configuring target locators (`role`, `text`, `css`) and fallback locators.
   - Step reordering, duplication, parameter editing, deletion, and real-time schema validation via Ajv.

4. **Playwright Code Generation**:
   - Automated conversion of visual Test DSL JSON into valid, executable Playwright TypeScript (`.spec.ts`) scripts.
   - Parameter interpolation (`{{BASE_URL}}`), string escaping, and locator strategy generation.

5. **Isolated Test Execution Worker**:
   - Asynchronous worker process spawning executing tests in headless Chromium.
   - Live real-time event streaming via Socket.IO (`RUN_QUEUED`, `RUN_STARTED`, `STEP_STARTED`, `STEP_PASSED`, `STEP_FAILED`, `RUN_COMPLETED`).
   - Failure screenshot capture (`.png`) and detailed console log output collection.

6. **GitHub Webhook Auto-Testing**:
   - Automated trigger handler supporting GitHub `push` event webhooks with HMAC SHA-256 signature verification.
   - Project repository URL matching, branch filtering (e.g. `main`), and deduplication (`X-GitHub-Delivery`).

7. **Google Gemini AI Failure Diagnosis**:
   - Automatic credential redaction (passwords, JWTs, Bearer headers, API keys sanitized to `<REDACTED>`).
   - Generative failure diagnosis powered by `gemini-2.5-flash`, providing structured JSON outputs (root cause, observed error, technical explanation, evidence, suggested investigation, and fix recommendations).

---

## 🧩 Module Description

### 1. Frontend Module (`apps/client`)

- **Public Landing Page (`LandingPage.tsx`)**: Enterprise product presentation page with hero section, 4-step start-to-end workflow showcase, feature grid, architecture diagram, and top navigation links.
- **Visual Test Builder (`TestCaseDetailPage.tsx`)**: Visual drag-and-drop builder canvas for constructing test step sequences with real-time property editing.
- **Dashboard (`DashboardPage.tsx`)**: Real-time aggregate metric overview cards (`Total Projects`, `Test Cases`, `Total Runs`, `Pass Rate %`, `Auto Runs`, `Auto Pass Rate %`), project dropdown filter, and trigger tab views.
- **Run History & Detail Modal (`RunHistory.tsx`, `RunDetailModal.tsx`)**: History table sorted newest first, showing step breakdown, durations, console logs, failure screenshots, and AI analysis card.
- **Project Detail (`ProjectDetailPage.tsx`)**: Project overview, test case listing, environment management, and Webhook Auto-Test configuration UI.

### 2. Server Module (`apps/server`)

- **Authentication & Controllers**: User registration, JWT login (`auth.controller.js`), project CRUD (`project.controller.js`), testcase CRUD (`testcase.controller.js`), execution management (`run.controller.js`), and webhook handlers (`webhook.controller.js`).
- **Execution Service (`execution.service.js`)**: Spawns Playwright worker processes, manages temporary `.spec.ts` files, emits Socket.IO events, records `Run` & `RunResult` MongoDB documents.
- **AI Failure Analysis Service (`aiService.js`)**: Redacts sensitive credentials (`<REDACTED>`), constructs Gemini AI prompts, parses structured JSON diagnoses, and handles provider failures gracefully.
- **Real-Time Socket.IO Server (`socket/index.js`)**: WebSockets server managing run room subscriptions and streaming execution transitions.
- **Serverless API Handler (`api/index.js`)**: Vercel serverless function entrypoint providing connection caching to MongoDB Atlas.

### 3. Worker Module (`apps/worker`)

- **Execution CLI (`cli.js`)**: Standalone CLI entrypoint that reads generated Playwright spec files, launches headless Chromium via `@playwright/test`, captures output logs, generates failure PNG screenshots, and returns exit codes.
- **Upload Storage (`uploads/screenshots`)**: Statically served screenshot filesystem directory.

### 4. Shared Packages (`packages/`)

- **DSL Schema Validator (`packages/dsl-schema`)**: Shared JSON schema definition and validator using Ajv for 7 step types and locator strategies.
- **Code Generator Engine (`packages/codegen`)**: Code generation module converting Test DSL JSON into executable Playwright TypeScript code.

---

## 💻 Technology Stack

| Category               | Technology                         | Usage / Purpose                                      |
| :--------------------- | :--------------------------------- | :--------------------------------------------------- |
| **Frontend Framework** | React 18 + Vite                    | Single Page Application framework with HMR           |
| **Language**           | TypeScript 5.0 / JavaScript ES2022 | Strict type safety across client and packages        |
| **Styling & Icons**    | Tailwind CSS + Lucide React        | Modern dark-mode UI styling and icon set             |
| **Backend Runtime**    | Node.js (>= 18.0.0)                | Asynchronous JavaScript backend runtime              |
| **REST Server**        | Express.js 4.19                    | HTTP REST API routing and middleware                 |
| **Database**           | MongoDB Atlas / Mongoose 8         | Document database and ODM modeling                   |
| **Real-Time Engine**   | Socket.IO 4.8                      | WebSockets execution event streaming                 |
| **Test Automation**    | Playwright 1.44                    | Headless Chromium browser automation engine          |
| **AI Diagnosis**       | Google Gemini 2.5 Flash            | Server-side AI failure analysis engine               |
| **Security & Auth**    | JWT + bcryptjs + crypto            | Token authentication, password hashing, HMAC SHA-256 |
| **Deployment Host**    | Vercel                             | Cloud production hosting for frontend & serverless   |
| **Workspace Manager**  | npm Workspaces                     | Monorepo package management                          |

---

## 🎨 UI Design & Workflows

### 1. Landing Page (`/`)
- **Header Navigation**: Brand logo, navigation anchors, and direct `[ Sign In ]` / `[ Sign Up ]` / `[ Go to Dashboard ]` buttons.
- **Hero & Badge Banner**: Glowing status badges (`117/117 Passed`, `Socket.IO`, `Playwright`, `Gemini 2.5 Flash`).
- **Start-to-End Workflow**: 4-card interactive workflow guide (Visual Builder ➔ Codegen ➔ Headless Execution ➔ AI Diagnosis).

### 2. Dashboard View (`/dashboard`)
- **Header & Filter Bar**: Welcome banner with user greeting, project context filter dropdown (`All Projects` or specific project), and `[Refresh]` button.
- **Auto-Test Summary Banner**: Prominently displays selected project Auto-Test configuration (`Enabled`/`Disabled`), provider (`GitHub Webhook` / `Generic Webhook`), target repository, monitored branch, configured test count, and `[Configure Settings]` link.
- **8 Metric Overview Cards**: `Total Projects`, `Test Cases`, `Total Runs`, `Overall Pass Rate %`, `Automatic Runs`, `Auto Pass Rate %`, `Auto Passed`, `Auto Failed`.

### 3. Visual Test Builder Canvas (`/projects/:projectId/test-cases/:testCaseId`)
- **Action Blocks Palette**: Click or drag to add `Navigate`, `Click`, `Fill`, `Assert Visible`, `Assert Text`, `Wait`, or `Screenshot` steps.
- **Step Property Inspector**: Edit step target locator strategy (`role`, `text`, `css`), value, timeout, and fallback locator properties.
- **Toolbar**: `[ Save Test Case ]`, `[ Run Test ]`, step reordering handles, step duplication, step deletion, and instant DSL validation indicator.

### 4. Run Detail & AI Failure Analysis Modal
- **Execution Overview**: Duration, Exit Code, Started At, Completed At, Trigger Source & Webhook Metadata badges.
- **AI Failure Analysis Card** (Failed Runs Only):
  - `[ 🪄 Analyze Failure ]` action button.
  - **Summary**, **Failed Step**, **Observed Error**, **Likely Technical Cause**, **Evidence**, **Suggested Investigation**, **Possible Fix**, and **Uncertainty**.
- **Console Output & Screenshot**: Embedded failure PNG screenshot and toggleable STDOUT / STDERR terminal viewer.

---

## 🛠️ Setup & Development Guide

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
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.ntm2bcn.mongodb.net/testforge?retryWrites=true&w=majority
   CLIENT_URL=http://localhost:5173,https://testforge-client.vercel.app
   JWT_SECRET=your_secure_jwt_secret_2026
   GEMINI_API_KEY=your_gemini_api_key_here

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

TestForge maintains an extensive automated test suite across all monorepo packages:

```bash
# 1. Verify Frontend Production Build
npm run build --workspace=apps/client

# 2. Execute Monorepo Automated Test Suite (117 Unit Tests)
npm test --workspace=packages/dsl-schema --workspace=packages/codegen --workspace=apps/server
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
