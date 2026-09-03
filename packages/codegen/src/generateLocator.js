import { toTsString } from './utils.js';

/**
 * Validates and converts a single locator object (without fallback) into a Playwright locator string.
 *
 * @param {object} locator - Single locator object
 * @param {boolean} [isFallback=false] - Whether this locator is being processed as a fallback
 * @returns {string} Playwright locator code (e.g. `page.getByRole("button", { name: "Login" })`)
 */
export const generateSingleLocator = (locator, isFallback = false) => {
  const prefix = isFallback ? 'Invalid fallback locator: ' : '';

  if (!locator || typeof locator !== 'object' || Array.isArray(locator)) {
    throw new Error(`${prefix}Locator must be a valid object`);
  }

  const { strategy, name } = locator;

  if (!strategy || typeof strategy !== 'string') {
    throw new Error(`${prefix}Locator strategy is required`);
  }

  switch (strategy) {
    case 'role': {
      const roleVal = locator.role || locator.value;
      if (typeof roleVal !== 'string' || roleVal.trim().length === 0) {
        throw new Error(`${prefix}Invalid role locator: "role" or "value" is required`);
      }

      const roleStr = toTsString(roleVal.trim());
      if (name && typeof name === 'string' && name.trim().length > 0) {
        const nameStr = toTsString(name.trim());
        return `page.getByRole(${roleStr}, { name: ${nameStr} })`;
      }
      return `page.getByRole(${roleStr})`;
    }

    case 'text': {
      const textVal = locator.value;
      if (typeof textVal !== 'string' || textVal.trim().length === 0) {
        throw new Error(`${prefix}Invalid text locator: "value" is required`);
      }
      return `page.getByText(${toTsString(textVal)})`;
    }

    case 'css': {
      const cssVal = locator.value;
      if (typeof cssVal !== 'string' || cssVal.trim().length === 0) {
        throw new Error(`${prefix}Invalid css locator: "value" is required`);
      }
      return `page.locator(${toTsString(cssVal)})`;
    }

    default:
      throw new Error(`${prefix}Unsupported locator strategy: ${strategy}`);
  }
};

/**
 * Converts a TestForge locator DSL object into a Playwright TypeScript locator expression,
 * handling primary locators and optional fallback locators.
 *
 * @param {object} locator - Primary locator object (may include `fallback` or `fallbackLocator`)
 * @returns {string} Playwright TypeScript locator expression
 */
export const generateLocator = (locator) => {
  if (!locator || typeof locator !== 'object' || Array.isArray(locator)) {
    throw new Error('Locator object is required');
  }

  // 1. Generate primary locator
  const primaryCode = generateSingleLocator(locator, false);

  // 2. Check for optional fallback locator
  const fallback = locator.fallback || locator.fallbackLocator;
  if (!fallback) {
    return primaryCode;
  }

  // 3. Reject nested fallbacks
  if (fallback.fallback || fallback.fallbackLocator) {
    throw new Error('Invalid fallback locator: nested fallbacks are not supported');
  }

  // 4. Generate fallback locator
  const fallbackCode = generateSingleLocator(fallback, true);

  // 5. Check if primary and fallback are identical
  if (primaryCode === fallbackCode) {
    throw new Error('Invalid fallback locator: Fallback locator must not be identical to the primary locator');
  }

  // 6. Return Playwright fallback expression
  return `(await (async () => {
  const primary = ${primaryCode};
  if (await primary.count() > 0) {
    return primary;
  }
  return ${fallbackCode};
})())`;
};
