import { generateLocator } from './generateLocator.js';
import { toTsString } from './utils.js';

/**
 * Generates Playwright TypeScript code for a Fill step.
 *
 * @param {{ id: string, type: 'fill', locator: object, value: string }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateFill = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'fill') {
    throw new Error(`Expected fill step, received '${step.type}'`);
  }

  if (!step.locator) {
    throw new Error('Fill step requires a locator object');
  }

  if (step.value === undefined || step.value === null || typeof step.value !== 'string') {
    throw new Error('Fill step requires a string value');
  }

  const locatorCode = generateLocator(step.locator);
  const valueCode = toTsString(step.value);

  return `await ${locatorCode}.fill(${valueCode});`;
};
