/**
 * Error Handler Middleware
 * Produces safe centralized errors.
 */

const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { captureException } = require('../../config/sentry');

// Handle missing routes.
const notFound = (req, res) => errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404);

// Handle application errors.
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const statusCode = error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
  if (statusCode >= 500) {
    logger.error('Request failed', { requestId: req.requestId, error: error.message });
    captureException(error, { requestId: req.requestId, method: req.method, path: req.path });
  }
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
  return errorResponse(res, message, statusCode, null, { requestId: req.requestId, ...(error.details ? { details: error.details } : {}) });
};

module.exports = { notFound, errorHandler };
