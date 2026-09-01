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

/**
 * Deterministically sanitizes a screenshot name or step ID to produce a safe filename.
 * Prevents path traversal (e.g. ../../secret), removes illegal characters, replaces spaces with hyphens,
 * and ensures a .png extension is appended.
 *
 * @param {string} [name] - Optional screenshot name from step
 * @param {string} [stepId] - Step ID used as fallback if name is omitted
 * @returns {string} Safe PNG filename (e.g. "homepage.png")
 */
export const sanitizeScreenshotFilename = (name, stepId) => {
  let baseName = '';

  if (typeof name === 'string' && name.trim().length > 0) {
    baseName = name.trim();
  } else if (typeof stepId === 'string' && stepId.trim().length > 0) {
    baseName = stepId.trim();
  } else {
    baseName = 'screenshot';
  }

  // Remove path traversal and directory separators (../, .\, /, \)
  baseName = baseName.replace(/(\.\.[\/\\])+/g, '');
  baseName = baseName.replace(/[\/\\]/g, '-');

  // Remove illegal characters for Windows/Linux filenames: ? % * : | " < >
  baseName = baseName.replace(/[?%*:|"<>]/g, '');

  // Replace spaces with hyphens
  baseName = baseName.replace(/\s+/g, '-');

  // Strip multiple consecutive hyphens
  baseName = baseName.replace(/-+/g, '-');

  // Trim leading/trailing hyphens or dots
  baseName = baseName.replace(/^[-.]+|[-.]+$/g, '');

  if (!baseName) {
    baseName = 'screenshot';
  }

  // Append .png extension if not already present
  if (!baseName.toLowerCase().endsWith('.png')) {
    baseName += '.png';
  }

  return baseName;
};
