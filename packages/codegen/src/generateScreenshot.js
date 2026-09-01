import { sanitizeScreenshotFilename, toTsString } from './utils.js';

/**
 * Generates Playwright TypeScript code for a Screenshot step.
 *
 * @param {{ id: string, type: 'screenshot', name?: string, fullPage?: boolean }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateScreenshot = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'screenshot') {
    throw new Error(`Expected screenshot step, received '${step.type}'`);
  }

  const safeFilename = sanitizeScreenshotFilename(step.name, step.id);
  const pathTsStr = toTsString(safeFilename);
  const fullPageBool = Boolean(step.fullPage);

  return `await page.screenshot({\n  path: ${pathTsStr},\n  fullPage: ${fullPageBool}\n});`;
};
