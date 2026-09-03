/**
 * Generates Playwright TypeScript code for a Wait step.
 *
 * @param {{ id: string, type: 'wait', duration?: number, milliseconds?: number }} step
 * @returns {string} Playwright TypeScript code string
 */
export const generateWait = (step) => {
  if (!step || typeof step !== 'object') {
    throw new Error('Step object is required');
  }

  if (step.type !== 'wait') {
    throw new Error(`Expected wait step, received '${step.type}'`);
  }

  const durationVal = step.duration !== undefined ? step.duration : step.milliseconds;

  if (durationVal === undefined || durationVal === null) {
    throw new Error('duration is required for wait step');
  }

  if (
    typeof durationVal !== 'number' ||
    !Number.isFinite(durationVal) ||
    durationVal <= 0
  ) {
    throw new Error('Invalid wait duration');
  }

  return `await page.waitForTimeout(${durationVal});`;
};
