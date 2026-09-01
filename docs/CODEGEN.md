# TestForge — Playwright Code Generation Engine (Day 8)

The **TestForge Code Generation Engine** (`@testforge/codegen`) converts TestForge DSL JSON test workflows into clean, executable Playwright TypeScript statements.

As of Day 8, **all 7 TestForge DSL step types** are fully supported by the code generation engine.

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
- **DSL**: `{ "strategy": "role", "value": "button", "name": "Login" }`
- **Output**: `page.getByRole("button", { name: "Login" })`
- **DSL (no name)**: `{ "strategy": "role", "value": "button" }`
- **Output**: `page.getByRole("button")`

### 2.2 Text Locator (`text`)
- **DSL**: `{ "strategy": "text", "value": "Welcome Back" }`
- **Output**: `page.getByText("Welcome Back")`

### 2.3 CSS Locator (`css`)
- **DSL**: `{ "strategy": "css", "value": "#email-input" }`
- **Output**: `page.locator("#email-input")`

---

## 3. Detailed Step Conversion Examples

### 3.1 Navigate (`generateNavigate`)
- **Input**: `{ "id": "step-1", "type": "navigate", "url": "{{BASE_URL}}/login" }`
- **Output**: ``await page.goto(`${BASE_URL}/login`);``

### 3.2 Click (`generateClick`)
- **Input**: `{ "id": "step-2", "type": "click", "locator": { "strategy": "role", "value": "button", "name": "Submit" } }`
- **Output**: `await page.getByRole("button", { name: "Submit" }).click();`

### 3.3 Fill (`generateFill`)
- **Input**: `{ "id": "step-3", "type": "fill", "locator": { "strategy": "css", "value": "#email" }, "value": "test@example.com" }`
- **Output**: `await page.locator("#email").fill("test@example.com");`

### 3.4 Assert Visible (`generateAssertVisible`)
- **Input**: `{ "id": "step-4", "type": "assertVisible", "locator": { "strategy": "text", "value": "Dashboard" } }`
- **Output**: `await expect(page.getByText("Dashboard")).toBeVisible();`

### 3.5 Assert Text (`generateAssertText`)
- **Input**: `{ "id": "step-5", "type": "assertText", "locator": { "strategy": "css", "value": "h1" }, "expectedText": "Example Domain" }`
- **Output**: `await expect(page.locator("h1")).toHaveText("Example Domain");`

### 3.6 Wait (`generateWait`)
- **Input**: `{ "id": "step-6", "type": "wait", "duration": 1000 }`
- **Output**: `await page.waitForTimeout(1000);`

### 3.7 Screenshot (`generateScreenshot`)
- **Input**: `{ "id": "step-7", "type": "screenshot", "name": "homepage", "fullPage": true }`
- **Output**:
  ```typescript
  await page.screenshot({
    path: "homepage.png",
    fullPage: true
  });
  ```

---

## 4. Screenshot Filename Sanitization (`sanitizeScreenshotFilename`)

Screenshot step filenames are deterministically sanitized to guarantee filesystem safety:
- **Path Traversal Protection**: Sequences like `../../secret` are stripped to prevent unauthorized directory access.
- **Illegal Characters**: Characters like `/ \ ? % * : | " < >` are replaced or removed.
- **Space Replacement**: Spaces are converted to hyphens (e.g. `"Login Success"` $\rightarrow$ `"login-success.png"`).
- **Fallback Naming**: If `name` is omitted, the step `id` (e.g. `"step-7"`) is used as the filename (`"step-7.png"`).

---

## 5. String Escaping & Code Injection Prevention

All user string values (`fill.value`, `assertText.expectedText`, locator values) are encoded using `JSON.stringify()` via `toTsString()`. This prevents code injection attacks (e.g. `"); process.exit(1); //`), rendering user data strictly as safe string literals inside generated TypeScript code.

---

## 6. Complete Conversion Example

### Input DSL (`full-test.json`)

```json
{
  "version": "1.0",
  "name": "Complete TestForge Demo",
  "description": "Demonstrates all supported TestForge steps",
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

### Generated Playwright TypeScript Output (`generateSteps(dsl)`)

```typescript
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
```

---

## 7. Current Implementation Scope & Roadmap

- **Implemented (Day 8)**: Code generation for all 7 step types (`navigate`, `click`, `fill`, `assertVisible`, `assertText`, `wait`, `screenshot`), locator conversion, filename sanitization, string escaping.
- **Not Yet Implemented**:
  - Full `.spec.ts` Playwright test wrapper assembly (`import { test, expect } from "@playwright/test"; test(...)` - Day 9)
  - Browser worker process & Playwright execution engine (Week 3)
