import validator from 'validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a safe user object — never includes the password field.
 */
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new user account.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Name is required');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (name.trim().length > 50) {
      errors.push('Name must not exceed 50 characters');
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!validator.isEmail(email.trim())) {
      errors.push('Please enter a valid email address');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // ── Check duplicate email ────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // ── Create user (password hashed by model pre-save hook) ─────────────────
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate an existing user and return a JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    const errors = [];

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!validator.isEmail(email.trim())) {
      errors.push('Please enter a valid email address');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // ── Find user and explicitly select password ─────────────────────────────
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    // Generic message — do not reveal whether email or password was wrong
    const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

    if (!user) {
      return res.status(401).json({
        success: false,
        message: INVALID_CREDENTIALS_MSG,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: INVALID_CREDENTIALS_MSG,
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user (requires auth middleware).
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by auth middleware — already excludes password
    return res.status(200).json({
      success: true,
      data: {
        user: formatUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};
