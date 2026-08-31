import { formatUrlExpression } from './utils.js';

/**
 * Generates Playwright TypeScript code for a Navigate step.
 *
 * @param {{ id: string, type: 'navigate', url: string }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateNavigate = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'navigate') {
    throw new Error(`Expected navigate step, received '${step.type}'`);
  }

  if (!step.url || typeof step.url !== 'string' || step.url.trim().length === 0) {
    throw new Error('Navigate step requires a valid URL');
  }

  const urlExpr = formatUrlExpression(step.url);
  return `await page.goto(${urlExpr});`;
};
