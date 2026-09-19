import mongoose from 'mongoose';
import TestCase from '../models/TestCase.js';
import Environment from '../models/Environment.js';
import Run from '../models/Run.js';
import RunResult from '../models/RunResult.js';
import Project from '../models/Project.js';
import { runTestCaseExecution } from '../services/execution.service.js';

/**
 * POST /api/runs
 * Executes a single test case using the standalone Playwright worker process.
 * Requires JWT authentication. Verifies test case and optional environment ownership.
 */
export const executeRun = async (req, res, next) => {
  try {
    const { testCaseId, environmentId } = req.body || {};

    // 1. Validate request body
    if (!testCaseId || typeof testCaseId !== 'string' || testCaseId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'testCaseId is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(testCaseId.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid testCaseId format',
      });
    }

    if (environmentId !== undefined && environmentId !== null && environmentId !== '') {
      if (typeof environmentId !== 'string' || !mongoose.Types.ObjectId.isValid(environmentId.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid environmentId format',
        });
      }
    }

    // 2. Find TestCase and verify ownership
    const testCase = await TestCase.findOne({ _id: testCaseId.trim(), user: req.user._id });
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found',
      });
    }

    // 3. Find Environment (optional) and verify ownership & project match
    let environment = null;
    if (environmentId && environmentId.trim().length > 0) {
      environment = await Environment.findOne({
        _id: environmentId.trim(),
        user: req.user._id,
        project: testCase.project,
      });

      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'Environment not found',
        });
      }
    }

    // 4. Delegate execution to service
    const executionResult = await runTestCaseExecution({ testCase, environment, user: req.user });

    // Handle 400 validation failures from service
    if (executionResult.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: executionResult.message || 'Validation failed',
        ...(executionResult.details ? { errors: executionResult.details } : {}),
      });
    }

    // Handle 500 infrastructure failures from service
    if (executionResult.statusCode === 500) {
      return res.status(500).json({
        success: false,
        message: executionResult.message || 'Worker execution error',
        ...(executionResult.details ? { details: executionResult.details } : {}),
      });
    }

    // Return 200 response with structured test execution result
    return res.status(200).json({
      success: executionResult.success,
      data: executionResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/runs
 * Fetches run history list sorted newest first (createdAt DESC).
 * Can be filtered by query params: testCaseId, projectId, limit.
 * Requires JWT authentication and enforces user authorization.
 */
export const getRuns = async (req, res, next) => {
  try {
    const { testCaseId, projectId, limit = 50 } = req.query;

    const filter = { user: req.user._id };

    if (testCaseId) {
      if (!mongoose.Types.ObjectId.isValid(testCaseId.toString().trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid testCaseId format',
        });
      }
      filter.testCase = testCaseId.toString().trim();
    }

    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId.toString().trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid projectId format',
        });
      }
      filter.project = projectId.toString().trim();
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 50, 100);

    const runs = await Run.find(filter)
      .sort({ createdAt: -1 })
      .limit(maxLimit)
      .populate('testCase', 'name')
      .populate('project', 'name')
      .lean();

    const formattedRuns = runs.map((run) => ({
      id: run._id.toString(),
      testCaseId: run.testCase?._id?.toString() || run.testCase?.toString() || '',
      testCaseName: run.testCase?.name || 'Unknown Test Case',
      projectId: run.project?._id?.toString() || run.project?.toString() || '',
      projectName: run.project?.name || '',
      status: run.status,
      durationMs: run.durationMs,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      createdAt: run.createdAt,
      exitCode: run.exitCode,
      screenshotPath: run.screenshotPath,
    }));

    return res.status(200).json({
      success: true,
      count: formattedRuns.length,
      data: formattedRuns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/runs/:id
 * Fetches execution run details and associated run result by ID.
 * Requires JWT authentication.
 * Verifies that the run belongs to the authenticated user.
 */
export const getRunById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Run not found',
      });
    }

    const run = await Run.findById(id);
    if (!run) {
      return res.status(404).json({
        success: false,
        message: 'Run not found',
      });
    }

    // Ownership check: verify run.user matches req.user._id
    if (run.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not own this run',
      });
    }

    // Safely populate testCase and project if populate method exists on document
    if (typeof run.populate === 'function') {
      try {
        await run.populate('testCase', 'name dsl');
        await run.populate('project', 'name');
      } catch (popErr) {
        console.warn('[TestForge] Warning populating run details:', popErr.message);
      }
    }

    const result = await RunResult.findOne({ run: run._id });

    return res.status(200).json({
      success: true,
      data: {
        run,
        result: result || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/runs/stats
 * Fetches real aggregate dashboard metrics for the authenticated user:
 * - totalProjects
 * - totalTestCases
 * - totalRuns
 * - passedRuns
 * - failedRuns
 * - passRate (0-100%)
 * Requires JWT authentication. Enforces user authorization.
 */
export const getRunStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalProjects, totalTestCases, totalRuns, passedRuns, failedRuns] = await Promise.all([
      Project.countDocuments({ user: userId }),
      TestCase.countDocuments({ user: userId }),
      Run.countDocuments({ user: userId }),
      Run.countDocuments({ user: userId, status: 'passed' }),
      Run.countDocuments({ user: userId, status: 'failed' }),
    ]);

    const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalTestCases,
        totalRuns,
        passedRuns,
        failedRuns,
        passRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
