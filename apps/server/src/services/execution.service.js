import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { validateTestDsl } from '@testforge/dsl-schema';
import { dslToPlaywrightScript } from '@testforge/codegen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Derive repository root directory relative to this service file (__dirname is apps/server/src/services).
 */
const getRepoRoot = () => {
  return path.resolve(__dirname, '../../../..');
};

/**
 * Executes a TestCase DSL by generating a temporary Playwright .spec.ts file
 * and spawning the standalone worker process.
 *
 * @param {object} params
 * @param {object} params.testCase - Mongoose TestCase document or object
 * @param {object} [params.environment] - Optional Mongoose Environment document or object
 * @returns {Promise<{ statusCode?: number, success: boolean, data?: { status: string, exitCode: number, stdout: string, stderr: string, durationMs: number, signal?: string }, error?: string, message?: string, details?: any }>}
 */
export const runTestCaseExecution = async ({ testCase, environment }) => {
  if (!testCase || !testCase.dsl) {
    return {
      statusCode: 400,
      success: false,
      message: 'Invalid test case payload',
    };
  }

  // 1. Validate DSL workflow
  const dslValidation = validateTestDsl(testCase.dsl);
  if (!dslValidation.success) {
    return {
      statusCode: 400,
      success: false,
      message: 'Invalid test DSL',
      details: dslValidation.errors,
    };
  }

  // 2. Resolve BASE_URL
  const baseUrl = environment?.baseUrl || process.env.BASE_URL;
  const scriptContent = dslToPlaywrightScript(dslValidation.data);

  const requiresBaseUrl = scriptContent.includes('process.env.BASE_URL') || scriptContent.includes('{{BASE_URL}}');
  if (requiresBaseUrl && !baseUrl) {
    return {
      statusCode: 400,
      success: false,
      message: 'BASE_URL environment variable is required but was not provided.',
    };
  }

  // 3. Create unique temporary file inside workspace scratch directory
  const repoRoot = getRepoRoot();
  const tempDir = path.resolve(repoRoot, 'scratch/testforge-runs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const uniqueId = crypto.randomUUID();
  const tempFilePath = path.join(tempDir, `run-${uniqueId}.spec.ts`);

  try {
    fs.writeFileSync(tempFilePath, scriptContent, 'utf8');

    // 4. Resolve worker CLI path
    const workerCliPath = path.resolve(repoRoot, 'apps/worker/src/cli.js');
    if (!fs.existsSync(workerCliPath)) {
      return {
        statusCode: 500,
        success: false,
        message: 'Worker CLI script not found',
        details: `Worker CLI script not found at ${workerCliPath}`,
      };
    }

    // 5. Spawn worker child process
    const timeoutMs = parseInt(process.env.TEST_EXECUTION_TIMEOUT_MS, 10) || 60000;
    const startTime = Date.now();

    console.log(`[TestForge] Starting test execution for TestCase: ${testCase._id || testCase.id}`);

    return await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isSettled = false;

      const childEnv = {
        ...process.env,
        ...(baseUrl ? { BASE_URL: baseUrl } : {}),
        FORCE_COLOR: '0',
      };

      const child = spawn(process.execPath, [workerCliPath, tempFilePath], {
        cwd: repoRoot,
        env: childEnv,
      });

      console.log(`[TestForge] Worker process started (PID: ${child.pid})`);

      // Protect against process execution timeout
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            child.kill('SIGTERM');
          } catch (e) {
            // ignore kill errors
          }
          const durationMs = Date.now() - startTime;
          console.log(`[TestForge] Worker execution timed out after ${timeoutMs}ms`);
          resolve({
            statusCode: 200,
            success: false,
            data: {
              status: 'failed',
              exitCode: 1,
              stdout: stdout.trim(),
              stderr: (stderr + '\nExecution timed out after ' + timeoutMs + 'ms').trim(),
              durationMs,
            },
          });
        }
      }, timeoutMs);

      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (spawnError) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          const durationMs = Date.now() - startTime;
          console.error('[TestForge] Worker process spawn error:', spawnError.message);
          resolve({
            statusCode: 500,
            success: false,
            message: 'Worker process failed to start',
            details: spawnError.message,
            durationMs,
          });
        }
      });

      child.on('close', (code, signal) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          const durationMs = Date.now() - startTime;
          const exitCode = code !== null ? code : 1;
          const isPassed = exitCode === 0;

          console.log(`[TestForge] Execution completed: ${isPassed ? 'passed' : 'failed'} (Exit code: ${exitCode})`);

          resolve({
            statusCode: 200,
            success: isPassed,
            data: {
              status: isPassed ? 'passed' : 'failed',
              exitCode,
              ...(signal ? { signal } : {}),
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              durationMs,
            },
          });
        }
      });
    });
  } finally {
    // 6. Cleanup temporary spec file
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('[TestForge] Failed to clean up temp file:', cleanupError.message);
      }
    }
  }
};
