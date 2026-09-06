import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/**
 * Recursively searches a directory for the first .png screenshot file.
 *
 * @param {string} dirPath - Directory path to search
 * @returns {string|null} Absolute path to the screenshot file, or null if not found
 */
const findScreenshotFile = (dirPath) => {
  if (!fs.existsSync(dirPath)) return null;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const found = findScreenshotFile(fullPath);
      if (found) return found;
    } else if (entry.isFile() && entry.name.endsWith('.png')) {
      return fullPath;
    }
  }
  return null;
};

/**
 * Validates the input test file path for existence, file type, extension, and readability.
 *
 * @param {string} testFilePath - Path to the test file
 * @returns {string} Absolute path to the validated test file
 */
export const validateTestFilePath = (testFilePath) => {
  if (!testFilePath || typeof testFilePath !== 'string' || testFilePath.trim().length === 0) {
    throw new Error('Test file path is required');
  }

  const resolvedPath = path.resolve(testFilePath.trim());

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Test file not found: ${resolvedPath}`);
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }

  const validExtensions = ['.ts', '.js'];
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!validExtensions.includes(ext)) {
    throw new Error(`Expected a Playwright test file (.spec.ts, .test.ts, .ts, .js), received extension '${ext}'`);
  }

  try {
    fs.accessSync(resolvedPath, fs.constants.R_OK);
  } catch {
    throw new Error(`Test file is not readable: ${resolvedPath}`);
  }

  return resolvedPath;
};

/**
 * Executes a single Playwright test file using Chromium in headless mode.
 *
 * @param {string} testFilePath - Path to the Playwright .spec.ts or .spec.js file
 * @param {object} [options={}] - Execution options
 * @param {string} [options.runId] - Unique execution ID (default: run-<uuid>)
 * @param {string} [options.baseUrl] - Base URL for process.env.BASE_URL
 * @param {boolean} [options.headless] - Whether to run in headless mode (default: true)
 * @param {number} [options.timeout=60000] - Maximum execution timeout in milliseconds
 * @param {object} [options.env={}] - Additional environment variables
 * @returns {Promise<{ success: boolean, status: 'passed'|'failed', exitCode: number, stdout: string, stderr: string, durationMs: number, testFilePath: string, runId: string, screenshotPath: string|null, error?: string }>}
 */
export const runPlaywrightTest = (testFilePath, options = {}) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const runId = options.runId || `run-${crypto.randomUUID()}`;
    const outputDir = options.outputDir || path.resolve(__dirname, '../uploads/screenshots', runId);

    // 1. Validate file path
    let resolvedPath;
    try {
      resolvedPath = validateTestFilePath(testFilePath);
    } catch (validationError) {
      const durationMs = Date.now() - startTime;
      return resolve({
        success: false,
        status: 'failed',
        exitCode: 1,
        stdout: '',
        stderr: validationError.message,
        durationMs,
        testFilePath: testFilePath ? path.resolve(testFilePath) : '',
        runId,
        screenshotPath: null,
        error: validationError.message,
      });
    }

    // 2. Check for BASE_URL requirement in file content
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    const requiresBaseUrl =
      fileContent.includes('process.env.BASE_URL') || fileContent.includes('{{BASE_URL}}');
    const effectiveBaseUrl = options.baseUrl || process.env.BASE_URL;

    if (requiresBaseUrl && !effectiveBaseUrl) {
      const errorMessage = 'BASE_URL environment variable is required but was not provided.';
      const durationMs = Date.now() - startTime;
      return resolve({
        success: false,
        status: 'failed',
        exitCode: 1,
        stdout: '',
        stderr: errorMessage,
        durationMs,
        testFilePath: resolvedPath,
        runId,
        screenshotPath: null,
        error: errorMessage,
      });
    }

    // 3. Resolve Playwright CLI binary
    let playwrightCliPath;
    try {
      playwrightCliPath = require.resolve('@playwright/test/cli');
    } catch {
      const errorMessage = 'Unable to resolve @playwright/test package. Ensure Playwright is installed.';
      const durationMs = Date.now() - startTime;
      return resolve({
        success: false,
        status: 'failed',
        exitCode: 1,
        stdout: '',
        stderr: errorMessage,
        durationMs,
        testFilePath: resolvedPath,
        runId,
        screenshotPath: null,
        error: errorMessage,
      });
    }

    const isHeadless = options.headless !== false && process.env.HEADLESS !== 'false';
    const timeoutMs = options.timeout && options.timeout > 0 ? options.timeout : 60000;

    const childEnv = {
      ...process.env,
      ...(options.env || {}),
      ...(effectiveBaseUrl ? { BASE_URL: effectiveBaseUrl } : {}),
      HEADLESS: isHeadless ? 'true' : 'false',
      FORCE_COLOR: '0',
    };

    // Convert Windows backslashes to forward slashes for Playwright CLI pattern matching
    const normalizedPath = resolvedPath.replace(/\\/g, '/');
    const normalizedOutputDir = outputDir.replace(/\\/g, '/');
    const configPath = path.resolve(__dirname, '../playwright.config.js').replace(/\\/g, '/');

    const args = [
      playwrightCliPath,
      'test',
      normalizedPath,
      '--project=chromium',
      `--config=${configPath}`,
      `--output=${normalizedOutputDir}`,
    ];

    execFile(
      process.execPath,
      args,
      {
        cwd: path.resolve(__dirname, '../../..'),
        env: childEnv,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const exitCode = error && error.code !== undefined ? (typeof error.code === 'number' ? error.code : 1) : 0;
        const success = exitCode === 0;

        let screenshotPath = null;
        if (!success) {
          const foundFile = findScreenshotFile(outputDir);
          if (foundFile) {
            const relativeToOutputDir = path.relative(outputDir, foundFile).replace(/\\/g, '/');
            screenshotPath = `/uploads/screenshots/${runId}/${relativeToOutputDir}`;
          }
        }

        resolve({
          success,
          status: success ? 'passed' : 'failed',
          exitCode: success ? 0 : 1,
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          durationMs,
          testFilePath: resolvedPath,
          runId,
          screenshotPath,
          ...(error && !success ? { error: error.message } : {}),
        });
      }
    );
  });
};
