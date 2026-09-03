import { generateLocator } from './generateLocator.js';

/**
 * Generates Playwright TypeScript assertion code for an AssertVisible step.
 *
 * @param {{ id: string, type: 'assertVisible', locator: object, fallbackLocator?: object }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateAssertVisible = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'assertVisible') {
    throw new Error(`Expected assertVisible step, received '${step.type}'`);
  }

  if (!step.locator) {
    throw new Error('Locator is required for assertVisible step');
  }

  const locatorObj =
    step.fallbackLocator && !step.locator.fallback && !step.locator.fallbackLocator
      ? { ...step.locator, fallback: step.fallbackLocator }
      : step.locator;

  const locatorCode = generateLocator(locatorObj);
  return `await expect(${locatorCode}).toBeVisible();`;
};
