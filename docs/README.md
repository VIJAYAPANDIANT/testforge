# TestForge Documentation Hub

Welcome to the **TestForge** technical documentation repository. This directory contains comprehensive specifications, architectural blueprints, integration guides, and API testing collections for the platform.

---

## 📚 Documentation Index

| Document | Purpose & Key Topics | Audience |
|---|---|---|
| [**Architecture Guide**](./ARCHITECTURE.md) | High-level system topology, monorepo packages, end-to-end execution pipeline, database ER diagram, remote worker delegation, and security boundaries. | Architects, Backend Engineers |
| [**API Testing Guide**](./API_TESTING.md) | Complete guide for testing REST endpoints and WebSockets with Postman or cURL: Auth, Projects, Environments, TestCases, Execution, AI Analysis, and Webhooks. | QA Engineers, API Developers |
| [**AI Failure Analysis**](./AI_FAILURE_ANALYSIS.md) | Detailed specification of the Day 29–30 AI root-cause diagnosis engine: Secret redaction, Google Gemini AI integration, model fallback, and deterministic Playwright heuristic engine. | Full-stack Engineers, QA Leads |
| [**CI/CD Webhooks Guide**](./WEBHOOKS.md) | Setting up GitHub push webhooks and generic CI/CD pipelines, HMAC SHA-256 verification, branch filtering, delivery deduplication, and auto-test metrics. | DevOps, CI/CD Engineers |
| [**Deployment & Operations**](./DEPLOYMENT.md) | Production setup on Vercel (Client SPA + Serverless Express API), MongoDB Atlas connection pooling, and deploying dedicated Playwright worker containers. | DevOps, Platform Engineers |
| [**Test DSL Specification**](./DSL_SPEC.md) | Formal specification of TestForge JSON DSL (v1.0), 7 supported step types (`navigate`, `click`, `fill`, `assertVisible`, `assertText`, `wait`, `screenshot`), and locators. | Frontend/QA Engineers |
| [**Playwright Codegen Engine**](./CODEGEN.md) | Technical guide for the `@testforge/codegen` compiler converting visual DSL JSON into clean, executable Playwright TypeScript (`.spec.ts`) scripts. | Core Engine Developers |
| [**Postman Collection & Environment**](./postman/) | Ready-to-import Postman collection (`TestForge_API.postman_collection.json`) and local environment (`TestForge_Local.postman_environment.json`) covering 25+ requests. | API Testers |

---

## 🚀 Quick Navigation for Common Tasks

### 1. I want to test the API locally
👉 Follow the [API Testing Guide](./API_TESTING.md) and import the [Postman Collection](./postman/TestForge_API.postman_collection.json).

### 2. I want to connect GitHub to run tests automatically on code push
👉 Follow the [CI/CD Webhooks Guide](./WEBHOOKS.md).

### 3. I want to understand how Gemini AI diagnoses test failures
👉 Read the [AI Failure Analysis Specification](./AI_FAILURE_ANALYSIS.md).

### 4. I want to deploy TestForge to Vercel and production
👉 Follow the [Production Deployment & Operations Guide](./DEPLOYMENT.md).

### 5. I want to understand the Test DSL and Playwright code generator
👉 Read the [Test DSL Specification](./DSL_SPEC.md) and [Playwright Codegen Engine Guide](./CODEGEN.md).
