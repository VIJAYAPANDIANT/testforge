# TestForge — System Architecture Documentation

This document describes the high-level system architecture, component topology, execution pipelines, data models, and security boundaries of the **TestForge** platform.

---

## 1. Architectural Overview

TestForge is designed as a modular npm-workspaces monorepo separating presentation, API routing, code generation, schema validation, test execution, and AI failure diagnostics.

```mermaid
graph TB
    subgraph ClientLayer["Frontend Layer (apps/client)"]
        UI["React 18 + Tailwind CSS + Vite SPA"]
        Builder["Visual Workflow Canvas (7 Steps)"]
        Inspector["Step Properties & Locator Panel"]
        LiveViewer["Live Run Modal & Socket.IO Listener"]
        Theme["Dark / Light Mode Token System"]
    end

    subgraph ServerLayer["Backend API & Gateway (apps/server)"]
        Express["Express.js 4 REST API"]
        AuthMid["JWT Auth & Ownership Middleware"]
        SocketServer["Socket.IO Real-Time Gateway"]
        RunCtrl["Run Controller & History Engine"]
        WebhookCtrl["GitHub & Generic Webhook Dispatcher"]
        AiEngine["AI Failure Analysis & Heuristic Engine"]
    end

    subgraph CorePackages["Shared Monorepo Packages"]
        DSLSchema["@testforge/dsl-schema (Ajv JSON Schema)"]
        Codegen["@testforge/codegen (Playwright Spec Generator)"]
    end

    subgraph ExecutionLayer["Test Execution Engine (apps/worker)"]
        WorkerManager["Worker Execution Manager"]
        BrowserSpawn["Playwright Chromium Headless Process"]
        SpecSandbox["Isolated Execution Sandbox"]
        Artifacts["Screenshots & Console Logs Capturer"]
        RemoteWorker["Remote Worker Service (HTTP)"]
    end

    subgraph ExternalServices["External Infrastructure"]
        Mongo["MongoDB Atlas Database"]
        Gemini["Google Gemini Generative AI (2.5/1.5 Flash)"]
        GitHub["GitHub Push Webhooks (CI/CD)"]
    end

    UI -->|"HTTPS REST API"| Express
    UI <-->|"WebSockets (WSS)"| SocketServer
    Express --> AuthMid
    AuthMid --> RunCtrl
    AuthMid --> WebhookCtrl
    AuthMid --> AiEngine

    Builder --> DSLSchema
    RunCtrl --> Codegen
    Codegen --> DSLSchema

    RunCtrl -->|"child_process.spawn (Local)"| BrowserSpawn
    RunCtrl -.->|"POST /execute (Serverless / Remote)"| RemoteWorker
    RemoteWorker --> BrowserSpawn

    BrowserSpawn --> SpecSandbox
    BrowserSpawn --> Artifacts
    BrowserSpawn -->|"Events"| SocketServer

    Express --> Mongo
    AiEngine -->|"Sanitized Prompts"| Gemini
    GitHub -->|"Push Webhook (HMAC)"| WebhookCtrl
```

---

## 2. Monorepo Package Topology

```text
testforge/
├── apps/
│   ├── client/               # React 18 SPA (Vite, TypeScript, Tailwind CSS, Lucide)
│   │   ├── src/components/   # Visual Test Builder, Execution Modals, Nav, Dashboards
│   │   ├── src/services/     # Axios API Clients & Socket.IO Listeners
│   │   └── src/types/        # Shared TypeScript interfaces
│   ├── server/               # Express.js REST API + Socket.IO Server
│   │   ├── src/controllers/  # Auth, Project, Environment, TestCase, Run, Webhook
│   │   ├── src/models/       # Mongoose Schemas (User, Project, TestCase, Run, RunResult)
│   │   ├── src/services/     # Execution Service, AI Service, Webhook Service
│   │   └── src/socket/       # Socket.IO Connection & Room Management
│   └── worker/               # Headless Playwright Chromium Execution Worker
│       └── uploads/          # Static failure screenshot storage
├── packages/
│   ├── dsl-schema/           # Ajv JSON Schema validator for TestForge DSL v1.0
│   └── codegen/              # DSL-to-Playwright TypeScript compiler
└── docs/                     # Architecture, DSL spec, codegen, webhooks, and API testing
```

---

## 3. End-to-End Test Execution Pipeline

The execution of a test flow progresses through 7 strictly coordinated stages:

```mermaid
sequenceDiagram
    autonumber
    actor User as QA Engineer / Developer
    participant Client as TestForge Client (React)
    participant Server as TestForge Server (Express)
    participant Mongo as MongoDB Atlas
    participant Worker as Playwright Worker (Chromium)
    participant Socket as Socket.IO Gateway
    participant AI as Gemini AI / Heuristic Engine

    User->>Client: Click "Run Test" or Push to GitHub
    Client->>Server: POST /api/runs/execute { testCaseId, environmentId }
    Server->>Mongo: Create Run (status: 'queued')
    Server-->>Client: 200 OK { runId, status: 'queued' }
    Client->>Socket: join:run (runId)

    Server->>Worker: Spawn Chromium or Dispatch to Remote Worker
    Server->>Socket: Emit RUN_STARTED
    Socket-->>Client: Update UI status: 'running'

    loop For each DSL Step
        Worker->>Worker: Execute Playwright Step (Click, Fill, Navigate, Assert)
        Worker->>Socket: Emit STEP_STARTED / STEP_PASSED / STEP_FAILED
        Socket-->>Client: Update Step Badge in Live Modal
    end

    alt Execution Passed
        Worker->>Server: Exit Code 0 + Console Logs
        Server->>Mongo: Update Run (status: 'passed') & create RunResult
        Server->>Socket: Emit RUN_COMPLETED (status: 'passed')
    else Execution Failed
        Worker->>Worker: Capture Failure Screenshot (.png)
        Worker->>Server: Exit Code 1 + Error Stack + Screenshot Path
        Server->>Mongo: Update Run (status: 'failed') & create RunResult
        Server->>Socket: Emit RUN_COMPLETED (status: 'failed')
        User->>Client: Click "Analyze Failure"
        Client->>Server: POST /api/runs/:id/analyze
        Server->>Server: Redact Passwords, JWTs, API Keys (<REDACTED>)
        Server->>AI: Send Sanitized Evidence to Gemini API
        AI-->>Server: Structured JSON Diagnosis
        Server->>Mongo: Save failureAnalysis to Run
        Server-->>Client: Return Failure Diagnosis (Root Cause, Fixes, Evidence)
    end
```

---

## 4. Database Entity-Relationship Model (ERD)

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ RUN : triggers
    PROJECT ||--o{ ENVIRONMENT : contains
    PROJECT ||--o{ TEST_CASE : contains
    PROJECT ||--o{ RUN : tracks
    TEST_CASE ||--o{ RUN : executes
    RUN ||--|| RUN_RESULT : produces

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password
        date createdAt
    }

    PROJECT {
        ObjectId _id PK
        ObjectId user FK
        string name
        string description
        string repositoryUrl
        string webhookSecret
        date createdAt
    }

    ENVIRONMENT {
        ObjectId _id PK
        ObjectId project FK
        ObjectId user FK
        string name
        string baseUrl
        boolean isDefault
    }

    TEST_CASE {
        ObjectId _id PK
        ObjectId project FK
        ObjectId user FK
        string name
        string description
        json dsl
        date createdAt
    }

    RUN {
        ObjectId _id PK
        ObjectId testCase FK
        ObjectId project FK
        ObjectId user FK
        ObjectId environment FK
        string status "queued | running | passed | failed"
        string triggerSource "manual | webhook | github"
        json triggerMetadata
        string screenshotPath
        json failureAnalysis
        number exitCode
        number durationMs
        date startedAt
        date completedAt
    }

    RUN_RESULT {
        ObjectId _id PK
        ObjectId run FK
        string status
        json stepResults
        string stdout
        string stderr
        number durationMs
    }
```

---

## 5. Worker Architecture: Local vs. Serverless & Remote

Playwright requires launching full browser binaries (Chromium, Firefox, WebKit). Because serverless environments (such as Vercel Functions or AWS Lambda) enforce a **read-only filesystem** (except `/tmp`) and do not include bundled browser binaries, TestForge implements a **Hybrid Worker Architecture**:

1. **Local Development & Dedicated Servers**:
   - The server spawns child processes directly via `child_process.spawn`.
   - Temporary test specs are written into isolated run directories (`/scratch/testforge-runs/<runId>`) and cleaned up immediately upon completion.
2. **Serverless (Vercel) Deployment**:
   - When running on Vercel (`process.env.VERCEL === '1'`), the execution service checks for `WORKER_SERVICE_URL`.
   - If `WORKER_SERVICE_URL` is set, the execution request is delegated over HTTP to the dedicated worker instance (running in Docker, Railway, Render, or EC2).
   - If `WORKER_SERVICE_URL` is not set, the server returns an explicit **`503 Service Unavailable`** with code **`WORKER_UNAVAILABLE`**, directing the user to connect a remote worker instead of crashing with an unhandled `ENOENT` error.

---

## 6. AI Failure Diagnostic Architecture

The AI Failure Analysis engine (Day 29–30) provides automated, safe failure explanations:

### 1. Mandatory Data Sanitization (`sanitizeValue`)
Before any data is transmitted to an external AI provider:
- JWT tokens (`eyJ...`) $\rightarrow$ `<REDACTED_JWT>`
- Authorization Bearer tokens $\rightarrow$ `Authorization: Bearer <REDACTED>`
- Password parameters (`password=...`, `"password": "..."`) $\rightarrow$ `password=<REDACTED>`
- API keys (`AIzaSy...`, `sk-...`) $\rightarrow$ `<REDACTED_API_KEY>`

### 2. Dual-Layer AI & Heuristic Fallback
1. **Primary Model**: Calls `gemini-2.5-flash` with low temperature (`0.2`) and strict JSON schema generation.
2. **Model Fallback**: If the primary model returns HTTP 404, the service automatically retries with `gemini-1.5-flash`.
3. **Deterministic Heuristic Engine**: If the Gemini API is unconfigured, rate-limited (HTTP 429), or offline, TestForge activates its built-in Playwright heuristic analyzer to diagnose:
   - Locator wait timeouts
   - Strict mode selector collisions (multiple matching elements)
   - Assertion expectations mismatch (`toHaveText`, `toBeVisible`)
   - Page navigation and network connection errors (`net::ERR_CONNECTION_REFUSED`)

---

## 7. Security & Authorization

- **JWT Authentication**: Signed with HMAC SHA-256 (`JWT_SECRET`), expiring in 7 days by default.
- **Strict User Scoping**: All queries filter by `user: req.user._id`. Cross-user access returns `403 Forbidden` or `404 Not Found`.
- **Webhook HMAC Verification**: Incoming GitHub webhooks verify the `X-Hub-Signature-256` header using constant-time cryptographic comparison (`crypto.timingSafeEqual`) against the project's `webhookSecret`.
- **Delivery Deduplication**: In-flight and recently processed webhook IDs (`X-GitHub-Delivery`) are tracked in memory to prevent duplicate test runs on webhook retries.
