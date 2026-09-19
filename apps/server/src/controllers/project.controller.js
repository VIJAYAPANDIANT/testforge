import mongoose from 'mongoose';
import crypto from 'node:crypto';
import Project from '../models/Project.js';
import TestCase from '../models/TestCase.js';

/**
 * Format project output object
 */
const formatProject = (project) => ({
  id: project._id,
  name: project.name,
  description: project.description,
  autoTest: project.autoTest
    ? {
        enabled: Boolean(project.autoTest.enabled),
        branch: project.autoTest.branch || 'main',
        trigger: project.autoTest.trigger || 'webhook',
        provider: project.autoTest.provider || 'generic',
        github: {
          repository: project.autoTest.github?.repository || '',
        },
        webhookSecret: project.autoTest.webhookSecret || '',
        testCaseIds: (project.autoTest.testCaseIds || []).map((id) =>
          id._id ? id._id.toString() : id.toString()
        ),
      }
    : {
        enabled: false,
        branch: 'main',
        trigger: 'webhook',
        provider: 'generic',
        github: { repository: '' },
        webhookSecret: '',
        testCaseIds: [],
      },
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

/**
 * POST /api/projects
 * Create a new project owned by the authenticated user.
 */
export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Project name is required');
    } else if (name.trim().length < 2) {
      errors.push('Project name must be at least 2 characters');
    } else if (name.trim().length > 100) {
      errors.push('Project name must not exceed 100 characters');
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        errors.push('Description must be a string');
      } else if (description.trim().length > 500) {
        errors.push('Description must not exceed 500 characters');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const initialSecret = crypto.randomBytes(16).toString('hex');

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      user: req.user._id,
      autoTest: {
        enabled: false,
        branch: 'main',
        trigger: 'webhook',
        webhookSecret: initialSecret,
        testCaseIds: [],
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: formatProject(project),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects
 * Retrieve all projects owned by the authenticated user.
 */
export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });

    const formattedProjects = projects.map(formatProject);

    return res.status(200).json({
      success: true,
      count: formattedProjects.length,
      data: {
        projects: formattedProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Get a specific project owned by the authenticated user.
 */
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = await Project.findOne({ _id: id, user: req.user._id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        project: formatProject(project),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/projects/:id
 * Update an existing project owned by the authenticated user.
 */
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Find existing project first to verify ownership & current settings
    const existingProject = await Project.findOne({ _id: id, user: req.user._id });
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Explicitly reject updating disallowed fields
    const allowedFields = ['name', 'description', 'autoTest'];
    const bodyKeys = Object.keys(req.body || {});
    const disallowedKeys = bodyKeys.filter((key) => !allowedFields.includes(key));

    if (disallowedKeys.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Updating field(s) '${disallowedKeys.join(', ')}' is not allowed`,
      });
    }

    const { name, description, autoTest } = req.body;
    const updates = {};
    const errors = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Project name cannot be empty');
      } else if (name.trim().length < 2) {
        errors.push('Project name must be at least 2 characters');
      } else if (name.trim().length > 100) {
        errors.push('Project name must not exceed 100 characters');
      } else {
        updates.name = name.trim();
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        errors.push('Description must be a string');
      } else if (description.trim().length > 500) {
        errors.push('Description must not exceed 500 characters');
      } else {
        updates.description = description.trim();
      }
    }

    if (autoTest !== undefined && autoTest !== null) {
      if (typeof autoTest !== 'object') {
        errors.push('autoTest must be an object');
      } else {
        const currentAuto = existingProject.autoTest || {};
        let webhookSecret = currentAuto.webhookSecret;
        if (!webhookSecret || autoTest.regenerateSecret) {
          webhookSecret = crypto.randomBytes(16).toString('hex');
        }

        let validTestIds = currentAuto.testCaseIds || [];
        if (Array.isArray(autoTest.testCaseIds)) {
          // Validate testCaseIds belong to this project
          const candidateIds = autoTest.testCaseIds.filter((tid) => mongoose.Types.ObjectId.isValid(tid));
          const projectTestCases = await TestCase.find({
            _id: { $in: candidateIds },
            project: existingProject._id,
          }).select('_id');
          validTestIds = projectTestCases.map((tc) => tc._id);
        }

        const provider =
          autoTest.provider === 'github' || autoTest.provider === 'generic'
            ? autoTest.provider
            : currentAuto.provider || 'generic';

        const githubRepo =
          autoTest.github && typeof autoTest.github.repository === 'string'
            ? autoTest.github.repository.trim()
            : currentAuto.github?.repository || '';

        updates.autoTest = {
          enabled: autoTest.enabled !== undefined ? Boolean(autoTest.enabled) : Boolean(currentAuto.enabled),
          branch: typeof autoTest.branch === 'string' && autoTest.branch.trim() ? autoTest.branch.trim() : (currentAuto.branch || 'main'),
          trigger: 'webhook',
          provider,
          github: {
            repository: githubRepo,
          },
          webhookSecret,
          testCaseIds: validTestIds,
        };
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: formatProject(updatedProject),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project owned by the authenticated user.
 */
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = await Project.findOneAndDelete({ _id: id, user: req.user._id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
