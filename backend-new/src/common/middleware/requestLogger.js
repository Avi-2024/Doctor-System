/**
 * Request Logger Middleware
 * Records structured completion events.
 */

const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info('HTTP request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
};

module.exports = { requestLogger };
