import { generateNavigate } from './generateNavigate.js';
import { generateClick } from './generateClick.js';
import { generateFill } from './generateFill.js';
import { generateAssertVisible } from './generateAssertVisible.js';
import { generateAssertText } from './generateAssertText.js';
import { generateWait } from './generateWait.js';
import { generateScreenshot } from './generateScreenshot.js';
import { generateLocator } from './generateLocator.js';
import { dslToPlaywrightScript, writePlaywrightTestFile } from './dslToPlaywrightScript.js';
import { toTsString, formatUrlExpression, sanitizeScreenshotFilename } from './utils.js';

export {
  generateNavigate,
  generateClick,
  generateFill,
  generateAssertVisible,
  generateAssertText,
  generateWait,
  generateScreenshot,
  generateLocator,
  dslToPlaywrightScript,
  writePlaywrightTestFile,
  toTsString,
  formatUrlExpression,
  sanitizeScreenshotFilename,
};

/**
 * Dispatches code generation for a single TestForge DSL step.
 * Supports all 7 step types: 'navigate', 'click', 'fill', 'assertVisible', 'assertText', 'wait', 'screenshot'.
 *
 * @param {object} step - DSL step object
 * @returns {string} Generated Playwright TypeScript code string
 */
export const generateStep = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (!step.type || typeof step.type !== 'string') {
    throw new Error('Step type is required');
  }

  switch (step.type) {
    case 'navigate':
      return generateNavigate(step);
    case 'click':
      return generateClick(step);
    case 'fill':
      return generateFill(step);
    case 'assertVisible':
      return generateAssertVisible(step);
    case 'assertText':
      return generateAssertText(step);
    case 'wait':
      return generateWait(step);
    case 'screenshot':
      return generateScreenshot(step);
    default:
      throw new Error(`Unsupported step type: ${step.type}`);
  }
};

/**
 * Converts an array of TestForge DSL steps (or a root DSL object with a steps array)
 * into a sequential block of Playwright TypeScript statements.
 *
 * @param {Array<object> | { steps: Array<object> }} input - Array of steps or DSL object
 * @returns {string} Generated TypeScript code block joined by double newlines
 */
export const generateSteps = (input) => {
  let steps = input;

  if (input && typeof input === 'object' && Array.isArray(input.steps)) {
    steps = input.steps;
  }

  if (!Array.isArray(steps)) {
    throw new Error('Input must be an array of steps or a DSL object containing a steps array');
  }

  return steps.map((step) => generateStep(step)).join('\n\n');
};
