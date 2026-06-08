/**
 * Validation Middleware
 * Converts express-validator failures.
 */

const { validationResult } = require('express-validator');
const { ApiError } = require('../errors/ApiError');

// Validate request.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return next(new ApiError(422, 'Validation failed', errors.array()));
};

module.exports = { validate };
