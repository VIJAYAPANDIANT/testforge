import mongoose from 'mongoose';

/**
 * Express middleware to validate MongoDB ObjectId parameters in req.params.
 * Returns 404 Not Found with a consistent error message if the ID format is invalid.
 *
 * @param {string} paramName - Name of parameter in req.params (defaults to 'id')
 * @param {string} resourceName - Name of resource for error message (defaults to 'Resource')
 */
export const validateObjectId = (paramName = 'id', resourceName = 'Resource') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: `${resourceName} not found`,
      });
    }
    next();
  };
};

export default validateObjectId;
