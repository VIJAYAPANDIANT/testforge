import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { validateTestDsl } from '@testforge/dsl-schema';
import { dslToPlaywrightScript, generateStep, toTsString } from '@testforge/codegen';
import mongoose from 'mongoose';
import Run from '../models/Run.js';
import RunResult from '../models/RunResult.js';
import { emitRunEvent, SOCKET_EVENTS } from '../socket/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_RUN_OUTPUT_LENGTH = 50000;

/**
 * Safely truncates long process output strings to avoid unbounded document growth in MongoDB.
 *
 * @param {string} text - Raw output string
 * @param {number} [maxLength=50000] - Maximum allowed string length
 * @returns {string} Truncated string
 */
export const truncateOutput = (text, maxLength = MAX_RUN_OUTPUT_LENGTH) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + `\n[Output truncated at ${maxLength} characters]`;
};

/**
 * Builds an instrumented Playwright script that logs machine-readable step execution events.
 *
 * @param {object} validDsl - Validated DSL object
 * @returns {string} Instrumented Playwright spec file string
 */
export const buildInstrumentedPlaywrightScript = (validDsl) => {
  const testNameStr = toTsString(validDsl.name);

  const stepBlocks = (validDsl.steps || [])
    .map((step, index) => {
      const rawStepCode = generateStep(step);
      const stepTypeStr = JSON.stringify(step.type);

      return `  console.log("TESTFORGE_STEP_START:" + JSON.stringify({ stepIndex: ${index}, stepType: ${stepTypeStr} }));
  try {
    ${rawStepCode}
    console.log("TESTFORGE_STEP_PASS:" + JSON.stringify({ stepIndex: ${index}, stepType: ${stepTypeStr} }));
  } catch (err) {
    console.log("TESTFORGE_STEP_FAIL:" + JSON.stringify({ stepIndex: ${index}, stepType: ${stepTypeStr}, error: err.message || String(err) }));
    throw err;
  }`;
    })
    .join('\n\n');

  return `import { test, expect } from "@playwright/test";

test(${testNameStr}, async ({ page }) => {
${stepBlocks}
});
`;
};

/**
 * Derive repository root directory relative to this service file (__dirname is apps/server/src/services).
 */
const getRepoRoot = () => {
  return path.resolve(__dirname, '../../../..');
};

/**
 * Helper to safely save Mongoose document if MongoDB is connected.
 */
const safeSaveRun = async (runRecord) => {
  if (runRecord && typeof runRecord.save === 'function' && mongoose.connection.readyState !== 0) {
    try {
      await runRecord.save();
    } catch (err) {
      console.error('[TestForge] Error saving Run record:', err.message);
    }
  }
};

/**
 * Helper to safely create RunResult document if MongoDB is connected.
 */
const safeCreateRunResult = async (payload) => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await RunResult.create(payload);
    } catch (err) {
      console.error('[TestForge] Error creating RunResult record:', err.message);
    }
  }
};

/**
 * Executes a TestCase DSL by generating a temporary Playwright .spec.ts file,
 * persisting execution records in MongoDB (Run & RunResult), emitting live Socket.IO events,
 * and spawning the standalone worker process.
 *
 * @param {object} params
 * @param {object} params.testCase - Mongoose TestCase document or object
 * @param {object} [params.environment] - Optional Mongoose Environment document or object
 * @param {object|string} [params.user] - Authenticated user object or ID
 * @param {string} [params.triggerSource='manual'] - Run trigger source ('manual' | 'webhook')
 * @param {object} [params.triggerMetadata] - Optional metadata (branch, commit, repository, event, eventId)
 * @returns {Promise<{ statusCode?: number, success: boolean, data?: { runId: string, status: string, exitCode: number|null, stdout: string, stderr: string, durationMs: number, screenshotPath: string|null, signal?: string }, error?: string, message?: string, details?: any }>}
 */
export const runTestCaseExecution = async ({ testCase, environment, user, triggerSource = 'manual', triggerMetadata = null }) => {
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

  // 2. Resolve BASE_URL & Generate Instrumented Playwright Script
  const baseUrl = environment?.baseUrl || process.env.BASE_URL;
  const scriptContent = buildInstrumentedPlaywrightScript(dslValidation.data);

  const requiresBaseUrl = scriptContent.includes('process.env.BASE_URL') || scriptContent.includes('{{BASE_URL}}');
  if (requiresBaseUrl && !baseUrl) {
    return {
      statusCode: 400,
      success: false,
      message: 'BASE_URL environment variable is required but was not provided.',
    };
  }

  // 3. Create initial Run document in MongoDB with status "queued"
  const userId = user?._id || (mongoose.Types.ObjectId.isValid(user) ? user : (testCase.user && mongoose.Types.ObjectId.isValid(testCase.user) ? testCase.user : new mongoose.Types.ObjectId()));
  const projectId = testCase.project && mongoose.Types.ObjectId.isValid(testCase.project) ? testCase.project : new mongoose.Types.ObjectId();
  const testCaseId = mongoose.Types.ObjectId.isValid(testCase._id || testCase.id) ? (testCase._id || testCase.id) : new mongoose.Types.ObjectId();

  let runRecord = null;
  if (mongoose.connection.readyState !== 0) {
    try {
      runRecord = await Run.create({
        testCase: testCaseId,
        project: projectId,
        user: userId,
        environment: environment?._id || environment?.id || null,
        status: 'queued',
        triggerSource: triggerSource || 'manual',
        ...(triggerMetadata ? { triggerMetadata } : {}),
      });
    } catch (dbErr) {
      console.error('[TestForge] Failed to create Run record in DB:', dbErr.message);
    }
  }

  // In-memory fallback object if MongoDB is disconnected during unit testing
  if (!runRecord) {
    const fallbackId = new mongoose.Types.ObjectId();
    runRecord = {
      _id: fallbackId,
      testCase: testCaseId,
      project: projectId,
      user: userId,
      status: 'queued',
      triggerSource: triggerSource || 'manual',
      triggerMetadata: triggerMetadata || null,
      startedAt: null,
      completedAt: null,
      durationMs: 0,
      exitCode: null,
      stdout: '',
      stderr: '',
      screenshotPath: null,
      save: async function () { return this; },
    };
  }

  const runId = runRecord._id.toString();

  // Emit RUN_QUEUED event immediately
  emitRunEvent(runId, SOCKET_EVENTS.RUN_QUEUED, {
    runId,
    status: 'queued',
  });

  // 4. Create unique temporary file inside workspace scratch directory
  const repoRoot = getRepoRoot();
  const tempDir = path.resolve(repoRoot, 'scratch/testforge-runs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `run-${runId}.spec.ts`);

  try {
    fs.writeFileSync(tempFilePath, scriptContent, 'utf8');

    // 5. Resolve worker CLI path
    const workerCliPath = path.resolve(repoRoot, 'apps/worker/src/cli.js');
    if (!fs.existsSync(workerCliPath)) {
      const completedAt = new Date();
      runRecord.status = 'failed';
      runRecord.completedAt = completedAt;
      runRecord.stderr = 'Worker CLI script not found';
      await safeSaveRun(runRecord);

      await safeCreateRunResult({
        run: runRecord._id,
        status: 'failed',
        exitCode: 1,
        stderr: 'Worker CLI script not found',
      });

      emitRunEvent(runId, SOCKET_EVENTS.RUN_FAILED, {
        runId,
        status: 'failed',
        error: 'Worker CLI script not found',
        completedAt: completedAt.toISOString(),
      });

      return {
        statusCode: 500,
        success: false,
        message: 'Worker CLI script not found',
        details: `Worker CLI script not found at ${workerCliPath}`,
      };
    }

    // 6. Update Run status to "running" immediately before worker process spawn
    const startedAt = new Date();
    const startTime = Date.now();
    runRecord.status = 'running';
    runRecord.startedAt = startedAt;
    await safeSaveRun(runRecord);

    // Emit RUN_STARTED event
    emitRunEvent(runId, SOCKET_EVENTS.RUN_STARTED, {
      runId,
      status: 'running',
      startedAt: startedAt.toISOString(),
    });

    const timeoutMs = parseInt(process.env.TEST_EXECUTION_TIMEOUT_MS, 10) || 60000;

    console.log(`[TestForge] Starting test execution for TestCase: ${testCase._id || testCase.id} (Run: ${runId})`);

    return await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isSettled = false;
      let stdoutLineBuffer = '';
      const stepResults = [];

      const childEnv = {
        ...process.env,
        ...(baseUrl ? { BASE_URL: baseUrl } : {}),
        FORCE_COLOR: '0',
      };

      const child = spawn(process.execPath, [workerCliPath, tempFilePath, '--run-id', runId], {
        cwd: repoRoot,
        env: childEnv,
      });

      console.log(`[TestForge] Worker process started (PID: ${child.pid})`);

      // Protect against process execution timeout
      const timer = setTimeout(async () => {
        if (!isSettled) {
          isSettled = true;
          try {
            child.kill('SIGTERM');
          } catch (e) {
            // ignore kill errors
          }
          const completedAt = new Date();
          const durationMs = Date.now() - startTime;
          const timeoutErrMsg = (stderr + '\nExecution timed out after ' + timeoutMs + 'ms').trim();
          const safeStdout = truncateOutput(stdout.trim());
          const safeStderr = truncateOutput(timeoutErrMsg);

          console.log(`[TestForge] Worker execution timed out after ${timeoutMs}ms`);

          try {
            runRecord.status = 'failed';
            runRecord.completedAt = completedAt;
            runRecord.durationMs = durationMs;
            runRecord.exitCode = 1;
            runRecord.stdout = safeStdout;
            runRecord.stderr = safeStderr;
            runRecord.screenshotPath = null;
            await safeSaveRun(runRecord);

            await safeCreateRunResult({
              run: runRecord._id,
              status: 'failed',
              exitCode: 1,
              stdout: safeStdout,
              stderr: safeStderr,
              screenshotPath: null,
              durationMs,
              stepResults,
            });
          } catch (dbError) {
            console.error('[TestForge] Failed to update timeout Run record:', dbError.message);
          }

          emitRunEvent(runId, SOCKET_EVENTS.RUN_FAILED, {
            runId,
            status: 'failed',
            durationMs,
            error: `Execution timed out after ${timeoutMs}ms`,
            screenshotPath: null,
            completedAt: completedAt.toISOString(),
          });

          resolve({
            statusCode: 200,
            success: false,
            data: {
              runId,
              status: 'failed',
              exitCode: 1,
              stdout: safeStdout,
              stderr: safeStderr,
              durationMs,
              screenshotPath: null,
            },
          });
        }
      }, timeoutMs);

      child.stdout?.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        stdout += chunkStr;
        stdoutLineBuffer += chunkStr;

        const lines = stdoutLineBuffer.split('\n');
        stdoutLineBuffer = lines.pop() || ''; // keep last incomplete line segment

        for (const rawLine of lines) {
          const line = rawLine.trim();

          if (line.startsWith('TESTFORGE_STEP_START:')) {
            try {
              const data = JSON.parse(line.substring('TESTFORGE_STEP_START:'.length));
              emitRunEvent(runId, SOCKET_EVENTS.STEP_STARTED, {
                runId,
                stepIndex: data.stepIndex,
                stepType: data.stepType,
                status: 'running',
              });
            } catch (err) {
              console.error('[TestForge] Failed to parse STEP_START marker:', err.message);
            }
          } else if (line.startsWith('TESTFORGE_STEP_PASS:')) {
            try {
              const data = JSON.parse(line.substring('TESTFORGE_STEP_PASS:'.length));
              stepResults.push({
                stepIndex: data.stepIndex,
                stepType: data.stepType,
                status: 'passed',
              });
              emitRunEvent(runId, SOCKET_EVENTS.STEP_PASSED, {
                runId,
                stepIndex: data.stepIndex,
                stepType: data.stepType,
                status: 'passed',
              });
            } catch (err) {
              console.error('[TestForge] Failed to parse STEP_PASS marker:', err.message);
            }
          } else if (line.startsWith('TESTFORGE_STEP_FAIL:')) {
            try {
              const data = JSON.parse(line.substring('TESTFORGE_STEP_FAIL:'.length));
              stepResults.push({
                stepIndex: data.stepIndex,
                stepType: data.stepType,
                status: 'failed',
                error: data.error,
              });
              emitRunEvent(runId, SOCKET_EVENTS.STEP_FAILED, {
                runId,
                stepIndex: data.stepIndex,
                stepType: data.stepType,
                status: 'failed',
                error: data.error,
              });
            } catch (err) {
              console.error('[TestForge] Failed to parse STEP_FAIL marker:', err.message);
            }
          }
        }
      });

      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', async (spawnError) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          const completedAt = new Date();
          const durationMs = Date.now() - startTime;
          const safeStderr = truncateOutput(spawnError.message);

          console.error('[TestForge] Worker process spawn error:', spawnError.message);

          try {
            runRecord.status = 'failed';
            runRecord.completedAt = completedAt;
            runRecord.durationMs = durationMs;
            runRecord.exitCode = null;
            runRecord.stdout = '';
            runRecord.stderr = safeStderr;
            runRecord.screenshotPath = null;
            await safeSaveRun(runRecord);

            await safeCreateRunResult({
              run: runRecord._id,
              status: 'failed',
              exitCode: null,
              stdout: '',
              stderr: safeStderr,
              screenshotPath: null,
              durationMs,
              stepResults,
            });
          } catch (dbError) {
            console.error('[TestForge] Failed to update spawn error Run record:', dbError.message);
          }

          emitRunEvent(runId, SOCKET_EVENTS.RUN_FAILED, {
            runId,
            status: 'failed',
            durationMs,
            error: spawnError.message,
            screenshotPath: null,
            completedAt: completedAt.toISOString(),
          });

          resolve({
            statusCode: 500,
            success: false,
            message: 'Worker process failed to start',
            details: spawnError.message,
            durationMs,
          });
        }
      });

      child.on('close', async (code, signal) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          const completedAt = new Date();
          const durationMs = Date.now() - startTime;
          const exitCode = code !== null ? code : 1;
          const isPassed = exitCode === 0;

          let parsedResult = null;
          const resultLine = stdout.split('\n').find((line) => line.trim().startsWith('TESTFORGE_RESULT:'));
          if (resultLine) {
            try {
              const jsonStr = resultLine.trim().substring('TESTFORGE_RESULT:'.length).trim();
              parsedResult = JSON.parse(jsonStr);
            } catch (e) {
              console.error('[TestForge] Failed to parse TESTFORGE_RESULT:', e.message);
            }
          }

          const screenshotPath = parsedResult?.screenshotPath || null;
          const safeStdout = truncateOutput(stdout.trim());
          const safeStderr = truncateOutput(stderr.trim());

          console.log(`[TestForge] Execution completed: ${isPassed ? 'passed' : 'failed'} (Exit code: ${exitCode})`);
          if (screenshotPath) {
            console.log(`[TestForge] Failure screenshot saved: ${screenshotPath}`);
          }

          try {
            runRecord.status = isPassed ? 'passed' : 'failed';
            runRecord.completedAt = completedAt;
            runRecord.durationMs = durationMs;
            runRecord.exitCode = exitCode;
            runRecord.stdout = safeStdout;
            runRecord.stderr = safeStderr;
            runRecord.screenshotPath = screenshotPath;
            await safeSaveRun(runRecord);

            await safeCreateRunResult({
              run: runRecord._id,
              status: isPassed ? 'passed' : 'failed',
              exitCode,
              stdout: safeStdout,
              stderr: safeStderr,
              screenshotPath,
              durationMs,
              stepResults,
            });
          } catch (dbError) {
            console.error('[TestForge] Failed to persist execution Run/RunResult:', dbError.message);
          }

          if (isPassed) {
            emitRunEvent(runId, SOCKET_EVENTS.RUN_COMPLETED, {
              runId,
              status: 'passed',
              durationMs,
              completedAt: completedAt.toISOString(),
            });
          } else {
            emitRunEvent(runId, SOCKET_EVENTS.RUN_FAILED, {
              runId,
              status: 'failed',
              durationMs,
              error: safeStderr || 'Execution failed',
              screenshotPath,
              completedAt: completedAt.toISOString(),
            });
          }

          resolve({
            statusCode: 200,
            success: isPassed,
            data: {
              runId,
              status: isPassed ? 'passed' : 'failed',
              exitCode,
              ...(signal ? { signal } : {}),
              stdout: safeStdout,
              stderr: safeStderr,
              durationMs,
              screenshotPath,
            },
          });
        }
      });
    });
  } finally {
    // 7. Cleanup temporary spec file
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('[TestForge] Failed to clean up temp file:', cleanupError.message);
      }
    }
  }
};
