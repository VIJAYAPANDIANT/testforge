# TestForge — Test DSL Specification (v1.0)

The **TestForge Domain-Specific Language (DSL)** is a structured JSON format used to define browser end-to-end test workflows visually. It acts as the single source of truth shared between the backend API, the upcoming Playwright code generation engine, and future drag-and-drop UI builders.

---

## 1. Supported Step Types

TestForge supports 7 core browser automation steps:

| Step Type | Action / Purpose | Key Fields |
|---|---|---|
| `navigate` | Open a web page URL | `url` |
| `click` | Click on a target element | `locator`, `fallbackLocator` |
| `fill` | Type text into an input field | `locator`, `value`, `fallbackLocator` |
| `assertVisible` | Assert an element is visible in the DOM | `locator`, `fallbackLocator` |
| `assertText` | Assert an element contains expected text | `locator`, `expectedText`, `fallbackLocator` |
| `wait` | Pause execution for a specified duration | `duration` |
| `screenshot` | Capture a visual page screenshot | `name`, `fullPage` |

---

## 2. Root Structure

Every valid TestForge DSL document must contain the following top-level properties:

```json
{
  "version": "1.0",
  "name": "Homepage Navigation Test",
  "description": "Verifies homepage loading and login navigation",
  "steps": []
}
```

### Root Fields

| Field | Type | Required | Rules & Validation |
|---|---|:---:|---|
| `version` | String | ✅ | Must equal `"1.0"`. |
| `name` | String | ✅ | Trimmed string, 2 to 150 characters. |
| `description` | String | ❌ | Optional string, max 1000 characters. |
| `steps` | Array | ✅ | Array of step objects. Minimum 1 step, maximum 100 steps. |

---

## 3. Step ID Rules & Common Properties

Every step in the `steps` array must contain:

- `id` (String, required): Unique identifier for the step within the test workflow (max 100 characters). Duplicate step IDs are rejected.
- `type` (String, required): One of the 7 supported step types.
- `timeout` (Number, optional): Custom step timeout in milliseconds (1 to 120,000 ms). Not applicable to `wait` steps.

---

## 4. Locator Strategy & Fallback Locators

Interactive steps (`click`, `fill`, `assertVisible`, `assertText`) target page elements using a **Locator** object.

### Locator Format

```json
{
  "strategy": "role",
  "value": "button",
  "name": "Login"
}
```

### Supported Strategies

1. **`role`**: Targets ARIA roles (e.g. `button`, `textbox`, `link`). Uses `value` for the role name and optional `name` for accessible name.
2. **`text`**: Targets elements containing visible text (e.g. `value: "Welcome"`).
3. **`css`**: Targets elements using CSS selectors (e.g. `value: "#submit-btn"`).

### Fallback Locators

Any step accepting a `locator` can optionally specify a `fallbackLocator` to attempt if the primary locator fails:

```json
{
  "id": "step-2",
  "type": "click",
  "locator": {
    "strategy": "role",
    "value": "button",
    "name": "Submit"
  },
  "fallbackLocator": {
    "strategy": "css",
    "value": "#submit-btn"
  }
}
```

*Note: The fallback locator must not be identical to the primary locator.*

---

## 5. Detailed Step Definitions

### 5.1 Navigate (`navigate`)
Opens a URL in the browser. Supports direct URLs and environment placeholders like `{{BASE_URL}}`.

```json
{
  "id": "step-1",
  "type": "navigate",
  "url": "{{BASE_URL}}/login"
}
```

### 5.2 Click (`click`)
Clicks an element.

```json
{
  "id": "step-2",
  "type": "click",
  "locator": {
    "strategy": "role",
    "value": "button",
    "name": "Login"
  }
}
```

### 5.3 Fill (`fill`)
Types text into an input field. Exact value formatting is preserved.

```json
{
  "id": "step-3",
  "type": "fill",
  "locator": {
    "strategy": "css",
    "value": "#username"
  },
  "value": "user@example.com"
}
```

### 5.4 Assert Visible (`assertVisible`)
Verifies element visibility.

```json
{
  "id": "step-4",
  "type": "assertVisible",
  "locator": {
    "strategy": "text",
    "value": "Dashboard"
  }
}
```

### 5.5 Assert Text (`assertText`)
Verifies element text content.

```json
{
  "id": "step-5",
  "type": "assertText",
  "locator": {
    "strategy": "css",
    "value": ".welcome-banner"
  },
  "expectedText": "Welcome, User!"
}
```

### 5.6 Wait (`wait`)
Pauses execution for a specified duration in milliseconds (100 to 120,000 ms).

```json
{
  "id": "step-6",
  "type": "wait",
  "duration": 2000
}
```

### 5.7 Screenshot (`screenshot`)
Captures a page screenshot.

```json
{
  "id": "step-7",
  "type": "screenshot",
  "name": "dashboard-view",
  "fullPage": true
}
```

---

## 6. Validation Error Format

When validating a DSL object via `validateTestDsl(dsl)`, validation errors are returned as an array of path-message pairs:

```json
{
  "success": false,
  "message": "Invalid test DSL",
  "errors": [
    {
      "path": "steps[1].locator.value",
      "message": "Locator value is required and must not be empty"
    }
  ]
}
```

---

## 7. Complete Example

```json
{
  "version": "1.0",
  "name": "Login Test",
  "description": "Verify user can log in successfully",
  "steps": [
    {
      "id": "step-1",
      "type": "navigate",
      "url": "{{BASE_URL}}/login"
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
      },
      "fallbackLocator": {
        "strategy": "css",
        "value": "#login-button"
      }
    },
    {
      "id": "step-5",
      "type": "assertVisible",
      "locator": {
        "strategy": "text",
        "value": "Welcome"
      }
    },
    {
      "id": "step-6",
      "type": "assertText",
      "locator": {
        "strategy": "css",
        "value": ".welcome-message"
      },
      "expectedText": "Welcome"
    },
    {
      "id": "step-7",
      "type": "wait",
      "duration": 1000
    },
    {
      "id": "step-8",
      "type": "screenshot",
      "name": "login-success",
      "fullPage": true
    }
  ]
}
```
