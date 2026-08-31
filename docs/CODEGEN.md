# TestForge — Code Generation Engine (Day 7)

The **TestForge Code Generation Engine** (`@testforge/codegen`) converts TestForge DSL JSON test workflows into clean, executable Playwright TypeScript code statements.

---

## 1. Supported Step Types (Day 7)

Day 7 implements step-to-code conversion for the first 3 core step types:

| Step Type | Generated Playwright TypeScript |
|---|---|
| `navigate` | `await page.goto("https://example.com");` or ``await page.goto(`${BASE_URL}/login`);`` |
| `click` | `await page.getByRole("button", { name: "Login" }).click();` |
| `fill` | `await page.locator("#email").fill("test@example.com");` |

> [!NOTE]
> The remaining steps (`assertVisible`, `assertText`, `wait`, `screenshot`) and full `.spec.ts` test wrapper generation will be added in subsequent days of Week 2.

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

## 3. String Escaping & Code Injection Prevention

User inputs (such as input fill values, URL strings, and locator values) are safely escaped using `JSON.stringify()` formatting via `toTsString()`.

This guarantees that user values containing quotes, backslashes, or code snippets (e.g. `John "Smith"\Test"); process.exit(1); //`) are safely encoded as literal string data rather than executable JavaScript code:

```typescript
// Safe escaped output
await page.locator("#name").fill("John \"Smith\"\\Test\"); process.exit(1); //");
```

---

## 4. Unsupported Step Behavior

If `generateStep(step)` encounters a step type not yet supported in Day 7 (such as `assertVisible`, `assertText`, `wait`, or `screenshot`), it throws a clear exception:

```text
Error: Unsupported step type for Day 7 codegen: assertVisible
```

---

## 5. Sample Conversion Example

### Input DSL (`sample-login.json`)

```json
{
  "version": "1.0",
  "name": "Login Test",
  "description": "Basic login flow",
  "steps": [
    {
      "id": "step-1",
      "type": "navigate",
      "url": "https://example.com/login"
    },
    {
      "id": "step-2",
      "type": "fill",
      "locator": {
        "strategy": "css",
        "value": "#email"
      },
      "value": "test@example.com"
    },
    {
      "id": "step-3",
      "type": "fill",
      "locator": {
        "strategy": "css",
        "value": "#password"
      },
      "value": "password123"
    },
    {
      "id": "step-4",
      "type": "click",
      "locator": {
        "strategy": "role",
        "value": "button",
        "name": "Login"
      }
    }
  ]
}
```

### Generated Playwright TypeScript Output (`generateSteps(dsl)`)

```typescript
await page.goto("https://example.com/login");

await page.locator("#email").fill("test@example.com");

await page.locator("#password").fill("password123");

await page.getByRole("button", { name: "Login" }).click();
```

---

## 6. Current Implementation Scope & Roadmap

- **Implemented (Day 7)**: `navigate`, `click`, `fill`, locator translation, string escaping.
- **Not Yet Implemented**:
  - `assertVisible`, `assertText`, `wait`, `screenshot` (Day 8)
  - Full `.spec.ts` Playwright test wrapper assembly (Day 9)
  - Playwright browser worker execution (Week 3)
