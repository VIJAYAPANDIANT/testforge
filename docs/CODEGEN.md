# TestForge — Playwright Code Generation Engine (Day 10)

The **TestForge Code Generation Engine** (`@testforge/codegen`) converts TestForge DSL JSON test workflows into clean, executable Playwright TypeScript (`.spec.ts`) test files.

As of Day 10, the engine features enhanced **locator generation, validation, developer-friendly error handling, and fallback locator support**.

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

## 2. Locator Conversion (`generateLocator`)

The generator translates TestForge locator DSL objects into canonical Playwright locator expressions:

### 2.1 Role Locator (`role`)
- **DSL (using `role`)**: `{ "strategy": "role", "role": "button", "name": "Login" }`
- **DSL (using `value`)**: `{ "strategy": "role", "value": "button", "name": "Login" }`
- **Output**: `page.getByRole("button", { name: "Login" })`
- **DSL (no name)**: `{ "strategy": "role", "role": "textbox" }`
- **Output**: `page.getByRole("textbox")`

### 2.2 Text Locator (`text`)
- **DSL**: `{ "strategy": "text", "value": "Welcome Back" }`
- **Output**: `page.getByText("Welcome Back")`

### 2.3 CSS Locator (`css`)
- **DSL**: `{ "strategy": "css", "value": "#login-button" }`
- **Output**: `page.locator("#login-button")`

---

## 3. Fallback Locators (`fallback`)

TestForge supports optional fallback locators when a primary locator might fail:

```json
{
  "strategy": "role",
  "role": "button",
  "name": "Login",
  "fallback": {
    "strategy": "css",
    "value": "#login-button"
  }
}
```

### Generated Fallback TypeScript Pattern
```typescript
(await (async () => {
  const primary = page.getByRole("button", { name: "Login" });
  if (await primary.count() > 0) {
    return primary;
  }
  return page.locator("#login-button");
})())
```

### Fallback Constraints & Rules
- Fallback is optional.
- Fallback must itself be a valid locator strategy (`role`, `text`, or `css`).
- Only **1 level** of fallback is supported. Nested fallbacks (`fallback.fallback`) are explicitly rejected.
- Fallback locator must not be identical to the primary locator.

---

## 4. Developer-Friendly Error Handling & Validation

Invalid locator objects throw clear, actionable errors during code generation:

- **Missing Strategy**: `Locator strategy is required`
- **Unsupported Strategy**: `Unsupported locator strategy: xpath`
- **Missing Role**: `Invalid role locator: "role" or "value" is required`
- **Missing Text Value**: `Invalid text locator: "value" is required`
- **Missing CSS Value**: `Invalid css locator: "value" is required`
- **Nested Fallback**: `Invalid fallback locator: nested fallbacks are not supported`
- **Identical Fallback**: `Invalid fallback locator: Fallback locator must not be identical to the primary locator`

---

## 5. Complete Playwright Test Generation (`dslToPlaywrightScript`)

`dslToPlaywrightScript(dsl)` accepts a TestForge DSL JSON object, validates it against the shared `@testforge/dsl-schema`, and wraps the generated step statements inside a full ES module Playwright test wrapper:

```typescript
import { test, expect } from "@playwright/test";

test("Login Test", async ({ page }) => {
  await page.goto("https://example.com");

  await page.getByRole("button", { name: "Login" }).click();
});
```

---

## 6. Environment Variable Placeholders (`{{BASE_URL}}`)

URLs containing environment variable placeholders (such as `{{BASE_URL}}/login`) are automatically translated into TypeScript `process.env` template literals:

- **Input DSL**: `{ "type": "navigate", "url": "{{BASE_URL}}/login" }`
- **Generated Output**: ``await page.goto(`${process.env.BASE_URL}/login`);``

---

## 7. File Writer & CLI Tooling

### File Writer API (`writePlaywrightTestFile`)

```javascript
import { writePlaywrightTestFile } from '@testforge/codegen';

const outputPath = writePlaywrightTestFile(dsl, './examples/generated/full-test.spec.ts');
```

### Command Line Interface (CLI)

```bash
node packages/codegen/src/cli.js packages/codegen/examples/full-test.json packages/codegen/examples/generated/full-test.spec.ts
```

---

## 8. String Escaping & Security

All user string values (`dsl.name`, `fill.value`, `assertText.expectedText`, locator values) are safely escaped using `JSON.stringify()` via `toTsString()`. This prevents code injection attacks (e.g. `Login"); process.exit(1); //`), rendering user input strictly as literal strings inside generated TypeScript code.

---

## 9. Complete 7-Step Conversion Example with Fallback

### Input DSL

```json
{
  "version": "1.0",
  "name": "Day 10 Full Regression Test",
  "steps": [
    { "id": "s1", "type": "navigate", "url": "{{BASE_URL}}/login" },
    { "id": "s2", "type": "fill", "locator": { "strategy": "role", "role": "textbox", "name": "Email" }, "value": "test@example.com" },
    { "id": "s3", "type": "fill", "locator": { "strategy": "css", "value": "#password" }, "value": "password123" },
    { "id": "s4", "type": "click", "locator": { "strategy": "role", "role": "button", "name": "Login", "fallback": { "strategy": "css", "value": "#login" } } },
    { "id": "s5", "type": "assertVisible", "locator": { "strategy": "text", "value": "Dashboard" } },
    { "id": "s6", "type": "assertText", "locator": { "strategy": "css", "value": "#message" }, "expectedText": "Success" },
    { "id": "s7", "type": "wait", "duration": 1000 },
    { "id": "s8", "type": "screenshot", "name": "login-success" }
  ]
}
```

### Generated Playwright TypeScript Output

```typescript
import { test, expect } from "@playwright/test";

test("Day 10 Full Regression Test", async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/login`);

  await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");

  await page.locator("#password").fill("password123");

  await (await (async () => {
    const primary = page.getByRole("button", { name: "Login" });
    if (await primary.count() > 0) {
      return primary;
    }
    return page.locator("#login");
  })()).click();

  await expect(page.getByText("Dashboard")).toBeVisible();

  await expect(page.locator("#message")).toHaveText("Success");

  await page.waitForTimeout(1000);

  await page.screenshot({
    path: "login-success.png",
    fullPage: false
  });
});
```

---

## 10. Current Implementation Scope & Roadmap

- **Implemented (Day 10)**: Full DSL $\rightarrow$ Playwright `.spec.ts` generator, role/text/css locator strategies, fallback locator resolution & code generation, developer-friendly validation error messages, 69 passing unit tests.
- **Not Yet Implemented**:
  - Playwright browser execution worker service (`apps/worker` - Week 3)
  - Run model, screenshot storage backend, React UI (Week 3+)
