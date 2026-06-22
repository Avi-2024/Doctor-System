/**
 * Validation Middleware
 * Converts express-validator failures into the standard error lifecycle.
 */

const { validationResult } = require('express-validator');
const { ApiError } = require('../errors/ApiError');

const sanitizeValidationErrors = (errors) => errors.array().map((error) => ({
  field: error.path || error.param || 'unknown',
  message: error.msg,
  location: error.location,
}));

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return next(new ApiError(400, 'Validation failed', sanitizeValidationErrors(errors)));
};

module.exports = { sanitizeValidationErrors, validate };
