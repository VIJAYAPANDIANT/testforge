# TestForge — Playwright Code Generation Engine (Day 9)

The **TestForge Code Generation Engine** (`@testforge/codegen`) converts TestForge DSL JSON test workflows into clean, executable Playwright TypeScript (`.spec.ts`) test files.

As of Day 9, the generator converts complete DSL workflows containing all 7 step types into valid, runnable ES module Playwright test suites.

---

## 1. Supported Step Types

| DSL Step Type | Generated Playwright TypeScript | Description |
|---|---|---|
| `navigate` | `await page.goto("https://example.com");` | Opens URL or template placeholder |
| `click` | `await page.getByRole("button", { name: "Login" }).click();` | Clicks target element |
| `fill` | `await page.locator("#email").fill("test@example.com");` | Inputs text into form field |
| `assertVisible` | `await expect(page.getByText("Welcome")).toBeVisible();` | Asserts element visibility |
| `assertText` | `await expect(page.locator(".msg")).toHaveText("Welcome");` | Asserts element text content |
| `wait` | `await page.waitForTimeout(1000);` | Pauses execution for duration in ms |
| `screenshot` | `await page.screenshot({ path: "homepage.png", fullPage: true });` | Captures page screenshot |

---

## 2. Complete Playwright Test Generation (`dslToPlaywrightScript`)

`dslToPlaywrightScript(dsl)` accepts a TestForge DSL JSON object, validates it against the shared `@testforge/dsl-schema`, and wraps the generated step statements inside a full ES module Playwright test wrapper:

```typescript
import { test, expect } from "@playwright/test";

test("Login Test", async ({ page }) => {
  await page.goto("https://example.com");

  await page.getByRole("button", { name: "Login" }).click();
});
```

---

## 3. Environment Variable Placeholders (`{{BASE_URL}}`)

URLs containing environment variable placeholders (such as `{{BASE_URL}}/login`) are automatically translated into TypeScript `process.env` template literals:

- **Input DSL**: `{ "type": "navigate", "url": "{{BASE_URL}}/login" }`
- **Generated Output**: ``await page.goto(`${process.env.BASE_URL}/login`);``

---

## 4. File Writer & CLI Tooling

### File Writer API (`writePlaywrightTestFile`)

```javascript
import { writePlaywrightTestFile } from '@testforge/codegen';

const outputPath = writePlaywrightTestFile(dsl, './examples/generated/full-test.spec.ts');
```

This helper validates the DSL payload, creates any required target directories, and writes the formatted `.spec.ts` source code to disk.

### Command Line Interface (CLI)

Generate Playwright test files directly from JSON DSL files:

```bash
node packages/codegen/src/cli.js packages/codegen/examples/full-test.json packages/codegen/examples/generated/full-test.spec.ts
```

Output:
```text
TestForge code generation successful.

Generated:
packages/codegen/examples/generated/full-test.spec.ts
```

---

## 5. Locator Conversion (`generateLocator`)

The generator translates TestForge locator DSL objects into canonical Playwright locator expressions:

### 5.1 Role Locator (`role`)
- **DSL**: `{ "strategy": "role", "value": "button", "name": "Login" }`
- **Output**: `page.getByRole("button", { name: "Login" })`
- **DSL (no name)**: `{ "strategy": "role", "value": "button" }`
- **Output**: `page.getByRole("button")`

### 5.2 Text Locator (`text`)
- **DSL**: `{ "strategy": "text", "value": "Welcome Back" }`
- **Output**: `page.getByText("Welcome Back")`

### 5.3 CSS Locator (`css`)
- **DSL**: `{ "strategy": "css", "value": "#email-input" }`
- **Output**: `page.locator("#email-input")`

---

## 6. Screenshot Filename Sanitization (`sanitizeScreenshotFilename`)

Screenshot step filenames are deterministically sanitized to guarantee filesystem safety:
- **Path Traversal Protection**: Sequences like `../../secret` are stripped to prevent unauthorized directory access.
- **Illegal Characters**: Characters like `/ \ ? % * : | " < >` are replaced or removed.
- **Space Replacement**: Spaces are converted to hyphens (e.g. `"Login Success"` $\rightarrow$ `"login-success.png"`).
- **Fallback Naming**: If `name` is omitted, the step `id` (e.g. `"step-7"`) is used as the filename (`"step-7.png"`).

---

## 7. String Escaping & Security

All user string values (`dsl.name`, `fill.value`, `assertText.expectedText`, locator values) are safely escaped using `JSON.stringify()` via `toTsString()`. This prevents code injection attacks (e.g. `Login"); process.exit(1); //`), rendering user input strictly as literal strings inside generated TypeScript code.

---

## 8. Complete Conversion Example

### Input DSL (`full-test.json`)

```json
{
  "version": "1.0",
  "name": "TestForge Complete Demo",
  "description": "Demonstrates all TestForge step types",
  "steps": [
    {
      "id": "step-1",
      "type": "navigate",
      "url": "https://example.com"
    },
    {
      "id": "step-2",
      "type": "click",
      "locator": {
        "strategy": "role",
        "value": "link",
        "name": "More information"
      }
    },
    {
      "id": "step-3",
      "type": "fill",
      "locator": {
        "strategy": "css",
        "value": "#search"
      },
      "value": "TestForge"
    },
    {
      "id": "step-4",
      "type": "assertVisible",
      "locator": {
        "strategy": "text",
        "value": "Example Domain"
      }
    },
    {
      "id": "step-5",
      "type": "assertText",
      "locator": {
        "strategy": "css",
        "value": "h1"
      },
      "expectedText": "Example Domain"
    },
    {
      "id": "step-6",
      "type": "wait",
      "duration": 1000
    },
    {
      "id": "step-7",
      "type": "screenshot",
      "name": "complete-test",
      "fullPage": true
    }
  ]
}
```

### Generated Playwright TypeScript (`full-test.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";

test("TestForge Complete Demo", async ({ page }) => {
  await page.goto("https://example.com");

  await page.getByRole("link", { name: "More information" }).click();

  await page.locator("#search").fill("TestForge");

  await expect(page.getByText("Example Domain")).toBeVisible();

  await expect(page.locator("h1")).toHaveText("Example Domain");

  await page.waitForTimeout(1000);

  await page.screenshot({
    path: "complete-test.png",
    fullPage: true
  });
});
```

---

## 9. Current Implementation Scope & Roadmap

- **Implemented (Day 9)**: Full DSL $\rightarrow$ Playwright `.spec.ts` generator (`dslToPlaywrightScript`), file writer (`writePlaywrightTestFile`), CLI runner (`cli.js`), 7 step generators, process.env URL template literals, safe string escaping, path sanitization.
- **Not Yet Implemented**:
  - Playwright browser execution worker service (`apps/worker` - Week 3)
  - Run model, screenshot storage backend, React UI (Week 3+)
