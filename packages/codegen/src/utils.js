/**
 * Safely converts a raw JavaScript string into a TypeScript string literal.
 * Uses JSON.stringify to escape quotes, backslashes, newlines, and control characters,
 * preventing code injection.
 *
 * @param {string} val - Input string to escape
 * @returns {string} Escaped TypeScript string literal (e.g. "Hello \"World\"")
 */
export const toTsString = (val) => {
  if (typeof val !== 'string') {
    return '""';
  }
  return JSON.stringify(val);
};

/**
 * Formats a URL string for Playwright page.goto().
 * If the URL contains environment placeholders like {{BASE_URL}},
 * it converts them to template literal placeholders like `${BASE_URL}/login`.
 * Otherwise, it returns a standard escaped double-quoted string.
 *
 * @param {string} url - Input URL string
 * @returns {string} Formatted TypeScript URL expression
 */
export const formatUrlExpression = (url) => {
  if (typeof url !== 'string' || !url) {
    return '""';
  }

  // Check for {{VARIABLE}} placeholders
  if (url.includes('{{') && url.includes('}}')) {
    // Replace {{VAR_NAME}} with ${VAR_NAME}
    const templateContent = url.replace(/\{\{([^}]+)\}\}/g, '${$1}');
    // Escape any raw backticks in the template content
    const safeContent = templateContent.replace(/`/g, '\\`');
    return `\`${safeContent}\``;
  }

  return toTsString(url);
};
