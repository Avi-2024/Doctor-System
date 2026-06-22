/**
 * Error Handler Middleware
 * Produces safe centralized errors.
 */

const { env } = require('../../config/env');
const { ApiError } = require('../errors/ApiError');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const notFound = (req, res) => errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404, null, { requestId: req.requestId });

const isProduction = () => env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';

const resolveStatusCode = (error) => {
  const statusCode = Number(error.statusCode);
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) return 500;
  return statusCode;
};

const resolveMessage = (error, statusCode) => {
  if (error instanceof ApiError && error.expose) return error.message;
  if (statusCode >= 500) return 'Internal server error';
  return 'Request failed';
};

const resolveErrors = (error, statusCode) => {
  if (statusCode >= 500) return undefined;
  if (error instanceof ApiError && error.expose && error.details) return error.details;
  return undefined;
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const statusCode = resolveStatusCode(error);
  const safeMessage = resolveMessage(error, statusCode);
  const errors = resolveErrors(error, statusCode);

  if (statusCode >= 500) {
    logger.error('Request failed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      error: error.message,
    });
  }

  return errorResponse(res, safeMessage, statusCode, null, {
    requestId: req.requestId,
    ...(errors ? { errors } : {}),
  });
};

module.exports = { errorHandler, notFound, resolveErrors, resolveMessage, resolveStatusCode, isProduction };
