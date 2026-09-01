/**
 * Generates Playwright TypeScript code for a Wait step.
 *
 * @param {{ id: string, type: 'wait', duration: number }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateWait = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'wait') {
    throw new Error(`Expected wait step, received '${step.type}'`);
  }

  if (step.duration === undefined || step.duration === null) {
    throw new Error('duration is required for wait step');
  }

  if (
    typeof step.duration !== 'number' ||
    !Number.isFinite(step.duration) ||
    step.duration <= 0
  ) {
    throw new Error('Invalid wait duration');
  }

  return `await page.waitForTimeout(${step.duration});`;
};
