import fs from 'node:fs';
import path from 'node:path';
import { validateTestDsl } from '@testforge/dsl-schema';
import { generateSteps } from './index.js';
import { toTsString } from './utils.js';

/**
 * Converts a validated TestForge DSL JSON object into a complete, runnable Playwright TypeScript (.spec.ts) test file string.
 *
 * @param {object} dsl - TestForge DSL object
 * @returns {string} Complete Playwright TypeScript test file content
 */
export const dslToPlaywrightScript = (dsl) => {
  // Validate DSL using shared schema validator
  const validation = validateTestDsl(dsl);

  if (!validation.success) {
    const errorDetails = validation.errors
      .map((err) => `${err.path ? err.path + ': ' : ''}${err.message}`)
      .join('\n');
    throw new Error(`Invalid TestForge DSL:\n${errorDetails}`);
  }

  const validDsl = validation.data;
  const testNameStr = toTsString(validDsl.name);

  // Generate step statements using existing generateSteps() engine
  const stepStatements = generateSteps(validDsl.steps);

  // Indent non-empty step lines by 2 spaces
  const indentedSteps = stepStatements
    .split('\n')
    .map((line) => (line.trim().length > 0 ? `  ${line}` : ''))
    .join('\n');

  // Format complete ES module Playwright test file wrapper
  return `import { test, expect } from "@playwright/test";

test(${testNameStr}, async ({ page }) => {
${indentedSteps}
});
`;
};

/**
 * Validates a TestForge DSL JSON object, generates Playwright TypeScript code,
 * and writes the result to the specified output file path.
 *
 * @param {object} dsl - TestForge DSL object
 * @param {string} outputPath - Target file path (e.g. "./generated/login.spec.ts")
 * @returns {string} Absolute path of the written file
 */
export const writePlaywrightTestFile = (dsl, outputPath) => {
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('Target output path is required');
  }

  const scriptCode = dslToPlaywrightScript(dsl);

  const absolutePath = path.resolve(outputPath);
  const targetDir = path.dirname(absolutePath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(absolutePath, scriptCode, 'utf8');

  return absolutePath;
};
