import mongoose from 'mongoose';
import TestCase from '../models/TestCase.js';
import Project from '../models/Project.js';

/**
 * Format test case output object
 */
const formatTestCase = (tc) => ({
  id: tc._id,
  name: tc.name,
  description: tc.description,
  projectId: tc.project,
  dsl: tc.dsl,
  createdAt: tc.createdAt,
  updatedAt: tc.updatedAt,
});

/**
 * Helper to check if a value is a valid non-array object
 */
const isObject = (val) => typeof val === 'object' && val !== null && !Array.isArray(val);

/**
 * POST /api/projects/:projectId/test-cases
 * Create a new test case inside a project owned by the user.
 */
export const createTestCase = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify project exists and belongs to req.user
    const project = await Project.findOne({ _id: projectId, user: req.user._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const { name, description, dsl } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Test case name is required');
    } else if (name.trim().length < 2) {
      errors.push('Test case name must be at least 2 characters');
    } else if (name.trim().length > 150) {
      errors.push('Test case name must not exceed 150 characters');
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        errors.push('Description must be a string');
      } else if (description.trim().length > 1000) {
        errors.push('Description must not exceed 1000 characters');
      }
    }

    if (!dsl || !isObject(dsl)) {
      errors.push('DSL workflow JSON object is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const testCase = await TestCase.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      project: projectId,
      user: req.user._id,
      dsl,
    });

    return res.status(201).json({
      success: true,
      message: 'Test case created successfully',
      data: {
        testCase: formatTestCase(testCase),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:projectId/test-cases
 * Get all test cases for a project owned by the user.
 */
export const getTestCases = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify project exists and belongs to user
    const project = await Project.findOne({ _id: projectId, user: req.user._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const testCases = await TestCase.find({ project: projectId, user: req.user._id }).sort({ createdAt: -1 });

    const formattedTestCases = testCases.map(formatTestCase);

    return res.status(200).json({
      success: true,
      count: formattedTestCases.length,
      data: {
        testCases: formattedTestCases,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/test-cases/:id
 * Get a single test case owned by the user.
 */
export const getTestCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found',
      });
    }

    const testCase = await TestCase.findOne({ _id: id, user: req.user._id });
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        testCase: formatTestCase(testCase),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/test-cases/:id
 * Update a test case owned by the user.
 */
export const updateTestCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found',
      });
    }

    const { name, description, dsl } = req.body;
    const updates = {};
    const errors = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Test case name cannot be empty');
      } else if (name.trim().length < 2) {
        errors.push('Test case name must be at least 2 characters');
      } else if (name.trim().length > 150) {
        errors.push('Test case name must not exceed 150 characters');
      } else {
        updates.name = name.trim();
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        errors.push('Description must be a string');
      } else if (description.trim().length > 1000) {
        errors.push('Description must not exceed 1000 characters');
      } else {
        updates.description = description.trim();
      }
    }

    if (dsl !== undefined) {
      if (!isObject(dsl)) {
        errors.push('DSL workflow must be a JSON object');
      } else {
        updates.dsl = dsl;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const testCase = await TestCase.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test case updated successfully',
      data: {
        testCase: formatTestCase(testCase),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/test-cases/:id
 * Delete a test case owned by the user.
 */
export const deleteTestCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found',
      });
    }

    const testCase = await TestCase.findOneAndDelete({ _id: id, user: req.user._id });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test case deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
