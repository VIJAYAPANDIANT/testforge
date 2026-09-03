import { generateLocator } from './generateLocator.js';

/**
 * Generates Playwright TypeScript code for a Click step.
 *
 * @param {{ id: string, type: 'click', locator: object, fallbackLocator?: object }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateClick = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'click') {
    throw new Error(`Expected click step, received '${step.type}'`);
  }

  if (!step.locator) {
    throw new Error('Click step requires a locator object');
  }

  const locatorObj =
    step.fallbackLocator && !step.locator.fallback && !step.locator.fallbackLocator
      ? { ...step.locator, fallback: step.fallbackLocator }
      : step.locator;

  const locatorCode = generateLocator(locatorObj);
  return `await ${locatorCode}.click();`;
};
