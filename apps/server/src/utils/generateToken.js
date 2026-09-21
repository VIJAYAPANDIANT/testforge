import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for a given user ID.
 * @param {string} userId - The MongoDB user document _id.
 * @returns {string} Signed JWT token.
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'testforge_default_jwt_secret_key_2026';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export default generateToken;
