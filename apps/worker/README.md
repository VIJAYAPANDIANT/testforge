# TestForge Worker (`@testforge/worker`)

> Standalone Playwright test execution runner for TestForge workflows.

The **TestForge Worker** executes generated Playwright TypeScript (`.spec.ts`) test files independently using Chromium in headless mode.

---

## 1. Capabilities

- **Single Test Execution**: Executes a single requested `.spec.ts` test file in isolation.
- **Chromium Only**: Targets Playwright's Chromium engine.
- **Headless Default**: Runs headless by default (`HEADLESS=true`), supporting `--headed` or `HEADLESS=false` override.
- **Environment Resolution**: Passes `BASE_URL` environment variables to the Playwright process.
- **Automatic Failure Screenshot Capture**: Automatically captures screenshots on test failures when `screenshot: 'only-on-failure'` is enabled and saves PNG images under `apps/worker/uploads/screenshots/run-<uuid>/`.
- **Structured Execution Result**: Returns status (`passed` / `failed`), exit code (`0` / `1`), stdout, stderr, duration in ms, `runId`, and `screenshotPath`.
- **CLI & Module API**: Exposed via programmatic API (`runPlaywrightTest`) and CLI tool (`node apps/worker/src/cli.js`).

---

## 2. API Usage (`runPlaywrightTest`)

```javascript
import { runPlaywrightTest } from '@testforge/worker';

const result = await runPlaywrightTest('./fixtures/passing.spec.ts', {
  runId: 'run-1234',
  baseUrl: 'https://example.com',
  headless: true
});

console.log(result);
/*
{
  success: true,
  status: 'passed',
  exitCode: 0,
  stdout: '...',
  stderr: '',
  durationMs: 2300,
  testFilePath: 'C:\\testforge\\testforge\\apps\\worker\\fixtures\\passing.spec.ts',
  runId: 'run-1234',
  screenshotPath: null
}
*/
```

---

## 3. Command Line Usage (CLI)

Run a test file directly from the command line:

```bash
node apps/worker/src/cli.js apps/worker/fixtures/passing.spec.ts --run-id run-1234
```

Or using npm workspace script:

```bash
npm run execute --workspace=apps/worker -- apps/worker/fixtures/passing.spec.ts
```

### CLI Options

| Flag / Env Var | Description |
|---|---|
| `--base-url <url>` | Pass target `BASE_URL` for `{{BASE_URL}}` placeholders |
| `--run-id <run-id>` | Assign a unique execution run ID |
| `--headed` | Run browser in visible headed mode |
| `BASE_URL=<url>` | Environment variable for target URL |
| `HEADLESS=false` | Environment variable to disable headless execution |

---

## 4. Development Fixtures & Testing

- **Passing Smoke Test**: `apps/worker/fixtures/passing.spec.ts` (targets `https://example.com` and asserts page heading).
- **Intentionally Failing Test**: `apps/worker/fixtures/failing.spec.ts` (targets `https://example.com` with an intentionally failing assertion).

Run tests:

```bash
npm test --workspace=apps/worker
```

---

## 5. Exit Code Behavior

- **Passing Test**: Returns process exit code `0`.
- **Failing Test**: Returns process exit code `1`.
- **Invalid Argument / Missing File / Missing BASE_URL**: Returns process exit code `1`.
