import { generateLocator } from './generateLocator.js';
import { toTsString } from './utils.js';

/**
 * Generates Playwright TypeScript assertion code for an AssertText step.
 *
 * @param {{ id: string, type: 'assertText', locator: object, expectedText?: string, value?: string, fallbackLocator?: object }} step
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

  const textVal = step.expectedText !== undefined ? step.expectedText : step.value;

  if (textVal === undefined || textVal === null || typeof textVal !== 'string') {
    throw new Error('expectedText is required for assertText step');
  }

  const locatorObj =
    step.fallbackLocator && !step.locator.fallback && !step.locator.fallbackLocator
      ? { ...step.locator, fallback: step.fallbackLocator }
      : step.locator;

  const locatorCode = generateLocator(locatorObj);
  const expectedTextCode = toTsString(textVal);

  return `await expect(${locatorCode}).toHaveText(${expectedTextCode});`;
};
