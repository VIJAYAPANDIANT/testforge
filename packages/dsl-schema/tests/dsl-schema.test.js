import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTestDsl } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DSL Schema Validator', () => {
  // ─── VALID TESTS ─────────────────────────────────────────────────────────────

  test('1. Validates sample valid login test JSON', () => {
    const validJsonPath = path.join(__dirname, '../examples/valid-login-test.json');
    const validJson = JSON.parse(fs.readFileSync(validJsonPath, 'utf8'));
    const result = validateTestDsl(validJson);

    assert.equal(result.success, true);
    assert.ok(result.data);
    assert.equal(result.data.steps.length, 8);
  });

  test('2. Validates navigate step with HTTPS URL', () => {
    const dsl = {
      version: '1.0',
      name: 'HTTPS Navigate',
      steps: [
        {
          id: 'step-1',
          type: 'navigate',
          url: 'https://example.com',
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('3. Validates navigate step with {{BASE_URL}} placeholder', () => {
    const dsl = {
      version: '1.0',
      name: 'Placeholder Navigate',
      steps: [
        {
          id: 'step-1',
          type: 'navigate',
          url: '{{BASE_URL}}/dashboard',
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('4. Validates role locator strategy', () => {
    const dsl = {
      version: '1.0',
      name: 'Role Locator',
      steps: [
        {
          id: 'step-1',
          type: 'click',
          locator: {
            strategy: 'role',
            value: 'button',
            name: 'Submit',
          },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('5. Validates text locator strategy', () => {
    const dsl = {
      version: '1.0',
      name: 'Text Locator',
      steps: [
        {
          id: 'step-1',
          type: 'assertVisible',
          locator: {
            strategy: 'text',
            value: 'Success Message',
          },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('6. Validates CSS locator strategy', () => {
    const dsl = {
      version: '1.0',
      name: 'CSS Locator',
      steps: [
        {
          id: 'step-1',
          type: 'click',
          locator: {
            strategy: 'css',
            value: '#main-btn',
          },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('7. Validates fill step with empty string value (clearing input)', () => {
    const dsl = {
      version: '1.0',
      name: 'Clear Input',
      steps: [
        {
          id: 'step-1',
          type: 'fill',
          locator: {
            strategy: 'css',
            value: '#search-input',
          },
          value: '',
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('8. Validates assertVisible step', () => {
    const dsl = {
      version: '1.0',
      name: 'Assert Visible',
      steps: [
        {
          id: 'step-1',
          type: 'assertVisible',
          locator: {
            strategy: 'css',
            value: '.modal-header',
          },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('9. Validates assertText step', () => {
    const dsl = {
      version: '1.0',
      name: 'Assert Text',
      steps: [
        {
          id: 'step-1',
          type: 'assertText',
          locator: {
            strategy: 'css',
            value: '#status',
          },
          expectedText: 'Active',
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('10. Validates wait step duration', () => {
    const dsl = {
      version: '1.0',
      name: 'Wait Step',
      steps: [
        {
          id: 'step-1',
          type: 'wait',
          duration: 5000,
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  test('11. Validates screenshot step', () => {
    const dsl = {
      version: '1.0',
      name: 'Screenshot Step',
      steps: [
        {
          id: 'step-1',
          type: 'screenshot',
          name: 'after-login',
          fullPage: true,
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, true);
  });

  // ─── INVALID TESTS ───────────────────────────────────────────────────────────

  test('12. Rejects missing DSL version', () => {
    const dsl = {
      name: 'No Version',
      steps: [{ id: 'step-1', type: 'wait', duration: 1000 }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'version'));
  });

  test('13. Rejects invalid DSL version', () => {
    const dsl = {
      version: '2.0',
      name: 'Bad Version',
      steps: [{ id: 'step-1', type: 'wait', duration: 1000 }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'version'));
  });

  test('14. Rejects empty steps array', () => {
    const dsl = {
      version: '1.0',
      name: 'Empty Steps',
      steps: [],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps'));
  });

  test('15. Rejects more than 100 steps', () => {
    const steps = Array.from({ length: 101 }, (_, i) => ({
      id: `step-${i + 1}`,
      type: 'wait',
      duration: 500,
    }));
    const dsl = {
      version: '1.0',
      name: 'Too Many Steps',
      steps,
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps'));
  });

  test('16. Rejects duplicate step IDs', () => {
    const dsl = {
      version: '1.0',
      name: 'Duplicate IDs',
      steps: [
        { id: 'step-1', type: 'wait', duration: 500 },
        { id: 'step-1', type: 'wait', duration: 500 },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[1].id'));
  });

  test('17. Rejects unsupported step type', () => {
    const dsl = {
      version: '1.0',
      name: 'Bad Type',
      steps: [{ id: 'step-1', type: 'hover' }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.message.includes('Unsupported step type: hover')));
  });

  test('18. Rejects navigate without URL', () => {
    const dsl = {
      version: '1.0',
      name: 'Navigate No URL',
      steps: [{ id: 'step-1', type: 'navigate' }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].url'));
  });

  test('19. Rejects invalid navigate URL protocol', () => {
    const dsl = {
      version: '1.0',
      name: 'Bad URL',
      steps: [{ id: 'step-1', type: 'navigate', url: 'ftp://example.com' }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].url'));
  });

  test('20. Rejects invalid locator strategy', () => {
    const dsl = {
      version: '1.0',
      name: 'Bad Locator Strategy',
      steps: [
        {
          id: 'step-1',
          type: 'click',
          locator: { strategy: 'xpath', value: '//button' },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].locator.strategy'));
  });

  test('21. Rejects missing locator value', () => {
    const dsl = {
      version: '1.0',
      name: 'No Locator Value',
      steps: [
        {
          id: 'step-1',
          type: 'click',
          locator: { strategy: 'css', value: '   ' },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].locator.value'));
  });

  test('22. Rejects fill step without value', () => {
    const dsl = {
      version: '1.0',
      name: 'Fill No Value',
      steps: [
        {
          id: 'step-1',
          type: 'fill',
          locator: { strategy: 'css', value: '#email' },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].value'));
  });

  test('23. Rejects assertText step without expectedText', () => {
    const dsl = {
      version: '1.0',
      name: 'AssertText No Text',
      steps: [
        {
          id: 'step-1',
          type: 'assertText',
          locator: { strategy: 'css', value: '#header' },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].expectedText'));
  });

  test('24. Rejects wait duration below 100ms', () => {
    const dsl = {
      version: '1.0',
      name: 'Wait Too Short',
      steps: [{ id: 'step-1', type: 'wait', duration: 50 }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].duration'));
  });

  test('25. Rejects wait duration above 120000ms', () => {
    const dsl = {
      version: '1.0',
      name: 'Wait Too Long',
      steps: [{ id: 'step-1', type: 'wait', duration: 150000 }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].duration'));
  });

  test('26. Rejects invalid screenshot fullPage type', () => {
    const dsl = {
      version: '1.0',
      name: 'Bad FullPage',
      steps: [{ id: 'step-1', type: 'screenshot', fullPage: 'yes' }],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].fullPage'));
  });

  test('27. Rejects invalid timeout', () => {
    const dsl = {
      version: '1.0',
      name: 'Bad Timeout',
      steps: [
        {
          id: 'step-1',
          type: 'click',
          timeout: -500,
          locator: { strategy: 'css', value: '#btn' },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].timeout'));
  });

  test('28. Rejects fallback locator identical to primary locator', () => {
    const dsl = {
      version: '1.0',
      name: 'Identical Fallback',
      steps: [
        {
          id: 'step-1',
          type: 'click',
          locator: { strategy: 'css', value: '#btn' },
          fallbackLocator: { strategy: 'css', value: '#btn' },
        },
      ],
    };
    const result = validateTestDsl(dsl);
    assert.equal(result.success, false);
    assert.ok(result.errors.some((e) => e.path === 'steps[0].fallbackLocator'));
  });
});
