/**
 * Request Logger Middleware
 * Records structured request completion events.
 */

const logger = require('../utils/logger');

// Log completed request.
const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  // Record request completion.
  const logCompletion = () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info('HTTP request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.auth?.userId || null,
    });
  };

  res.once('finish', logCompletion);
  next();
};

module.exports = { requestLogger };
