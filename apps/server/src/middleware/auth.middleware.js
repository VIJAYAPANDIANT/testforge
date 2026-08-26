import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication middleware.
 *
 * Reads the Bearer token from the Authorization header,
 * verifies it, finds the user, and attaches them to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check for Authorization header and Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }
      // JsonWebTokenError, NotBeforeError, or any other invalid token
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }

    // 3. Find the user (password excluded by select: false)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4. Attach user to request and continue
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default protect;
