import { toTsString } from './utils.js';

/**
 * Converts a TestForge locator DSL object into a Playwright TypeScript locator expression.
 *
 * @param {{ strategy: 'role' | 'text' | 'css', value: string, name?: string }} locator
 * @returns {string} Playwright locator code (e.g. `page.getByRole("button", { name: "Login" })`)
 */
export const generateLocator = (locator) => {
  if (!locator || typeof locator !== 'object') {
    throw new Error('Locator object is required');
  }

  const { strategy, value, name } = locator;

  if (!strategy || typeof strategy !== 'string') {
    throw new Error('Locator strategy is required');
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Locator value is required and must not be empty');
  }

  switch (strategy) {
    case 'role': {
      const roleStr = toTsString(value);
      if (name && typeof name === 'string' && name.trim().length > 0) {
        const nameStr = toTsString(name);
        return `page.getByRole(${roleStr}, { name: ${nameStr} })`;
      }
      return `page.getByRole(${roleStr})`;
    }

    case 'text': {
      const textStr = toTsString(value);
      return `page.getByText(${textStr})`;
    }

    case 'css': {
      const cssStr = toTsString(value);
      return `page.locator(${cssStr})`;
    }

    default:
      throw new Error(`Unsupported locator strategy: ${strategy}`);
  }
};
