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
```

## Repository Structure

```
testforge/
├── apps/
│   ├── client/              # React frontend  (coming Week 2)
│   ├── server/              # Express REST API ← active
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

Edit `apps/server/.env` and fill in your MongoDB Atlas URI.

### 4. Start the development server

```bash
npm run dev
```

The API will be available at:

- `http://localhost:5000/` — Root welcome route
- `http://localhost:5000/api/health` — Health check

## Packages

| Package | Description |
|---|---|
| `@testforge/server` | Express REST API |
| `@testforge/client` | React frontend (placeholder) |
| `@testforge/worker` | Playwright worker (placeholder) |
| `@testforge/dsl-schema` | Shared DSL schema definitions |
