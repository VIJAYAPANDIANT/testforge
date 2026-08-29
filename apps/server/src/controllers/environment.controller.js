import mongoose from 'mongoose';
import validator from 'validator';
import Environment from '../models/Environment.js';
import Project from '../models/Project.js';

/**
 * Format environment output object
 */
const formatEnvironment = (env) => ({
  id: env._id,
  name: env.name,
  baseUrl: env.baseUrl,
  project: env.project,
  createdAt: env.createdAt,
  updatedAt: env.updatedAt,
});

/**
 * Helper to check valid HTTP/HTTPS URL
 */
const isValidUrl = (url) =>
  typeof url === 'string' &&
  validator.isURL(url.trim(), {
    require_protocol: true,
    protocols: ['http', 'https'],
    require_valid_protocol: true,
  });

/**
 * POST /api/projects/:projectId/environments
 * Create a new environment inside a project owned by the user.
 */
export const createEnvironment = async (req, res, next) => {
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

    const { name, baseUrl } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Environment name is required');
    } else if (name.trim().length < 2) {
      errors.push('Environment name must be at least 2 characters');
    } else if (name.trim().length > 50) {
      errors.push('Environment name must not exceed 50 characters');
    }

    if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
      errors.push('Base URL is required');
    } else if (!isValidUrl(baseUrl)) {
      errors.push('Base URL must be a valid HTTP or HTTPS URL (e.g. https://example.com)');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Check duplicate environment name within the same project
    const existingEnv = await Environment.findOne({
      project: projectId,
      name: name.trim(),
    });

    if (existingEnv) {
      return res.status(409).json({
        success: false,
        message: 'An environment with this name already exists in this project',
      });
    }

    const environment = await Environment.create({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      project: projectId,
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Environment created successfully',
      data: {
        environment: formatEnvironment(environment),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An environment with this name already exists in this project',
      });
    }
    next(error);
  }
};

/**
 * GET /api/projects/:projectId/environments
 * Get all environments for a project owned by the user.
 */
export const getEnvironments = async (req, res, next) => {
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

    const environments = await Environment.find({ project: projectId, user: req.user._id }).sort({ createdAt: -1 });

    const formattedEnvironments = environments.map(formatEnvironment);

    return res.status(200).json({
      success: true,
      count: formattedEnvironments.length,
      data: {
        environments: formattedEnvironments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/environments/:id
 * Get a single environment owned by the user.
 */
export const getEnvironmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    const environment = await Environment.findOne({ _id: id, user: req.user._id });
    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        environment: formatEnvironment(environment),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/environments/:id
 * Update an environment owned by the user.
 */
export const updateEnvironment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    // Explicitly reject updating disallowed fields (e.g. user, project, _id, createdAt, updatedAt)
    const allowedFields = ['name', 'baseUrl'];
    const bodyKeys = Object.keys(req.body || {});
    const disallowedKeys = bodyKeys.filter((key) => !allowedFields.includes(key));

    if (disallowedKeys.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Updating field(s) '${disallowedKeys.join(', ')}' is not allowed`,
      });
    }

    const { name, baseUrl } = req.body;
    const updates = {};
    const errors = [];

    // Find existing environment first to ensure ownership and get project ID for duplicate check
    const existingEnv = await Environment.findOne({ _id: id, user: req.user._id });
    if (!existingEnv) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Environment name cannot be empty');
      } else if (name.trim().length < 2) {
        errors.push('Environment name must be at least 2 characters');
      } else if (name.trim().length > 50) {
        errors.push('Environment name must not exceed 50 characters');
      } else {
        updates.name = name.trim();
      }
    }

    if (baseUrl !== undefined) {
      if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
        errors.push('Base URL cannot be empty');
      } else if (!isValidUrl(baseUrl)) {
        errors.push('Base URL must be a valid HTTP or HTTPS URL (e.g. https://example.com)');
      } else {
        updates.baseUrl = baseUrl.trim();
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Check duplicate name within same project if name is being changed
    if (updates.name && updates.name !== existingEnv.name) {
      const duplicate = await Environment.findOne({
        project: existingEnv.project,
        name: updates.name,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'An environment with this name already exists in this project',
        });
      }
    }

    const environment = await Environment.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Environment updated successfully',
      data: {
        environment: formatEnvironment(environment),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An environment with this name already exists in this project',
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/environments/:id
 * Delete an environment owned by the user.
 */
export const deleteEnvironment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    const environment = await Environment.findOneAndDelete({ _id: id, user: req.user._id });

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: 'Environment not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Environment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
