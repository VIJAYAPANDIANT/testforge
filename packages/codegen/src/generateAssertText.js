import { generateLocator } from './generateLocator.js';
import { toTsString } from './utils.js';

/**
 * Generates Playwright TypeScript assertion code for an AssertText step.
 *
 * @param {{ id: string, type: 'assertText', locator: object, expectedText: string }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateAssertText = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'assertText') {
    throw new Error(`Expected assertText step, received '${step.type}'`);
  }

  if (!step.locator) {
    throw new Error('Locator is required for assertText step');
  }

  if (
    step.expectedText === undefined ||
    step.expectedText === null ||
    typeof step.expectedText !== 'string'
  ) {
    throw new Error('expectedText is required for assertText step');
  }

  const locatorCode = generateLocator(step.locator);
  const expectedTextCode = toTsString(step.expectedText);

  return `await expect(${locatorCode}).toHaveText(${expectedTextCode});`;
};
