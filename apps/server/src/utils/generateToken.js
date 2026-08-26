import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for a given user ID.
 * @param {string} userId - The MongoDB user document _id.
 * @returns {string} Signed JWT token.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export default generateToken;
