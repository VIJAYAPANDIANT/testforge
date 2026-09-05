import mongoose from 'mongoose';
import TestCase from '../models/TestCase.js';
import Environment from '../models/Environment.js';
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
    const executionResult = await runTestCaseExecution({ testCase, environment });

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
