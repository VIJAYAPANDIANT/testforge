import { generateNavigate } from './generateNavigate.js';
import { generateClick } from './generateClick.js';
import { generateFill } from './generateFill.js';
import { generateLocator } from './generateLocator.js';
import { toTsString, formatUrlExpression } from './utils.js';

export {
  generateNavigate,
  generateClick,
  generateFill,
  generateLocator,
  toTsString,
  formatUrlExpression,
};

/**
 * Dispatches code generation for a single TestForge DSL step.
 * Day 7 supports: 'navigate', 'click', 'fill'.
 *
 * @param {object} step - DSL step object
 * @returns {string} Generated Playwright TypeScript code line
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
    default:
      throw new Error(`Unsupported step type for Day 7 codegen: ${step.type}`);
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
