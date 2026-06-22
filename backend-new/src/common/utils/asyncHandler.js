/**
 * Async Handler
 * Forwards rejected route handlers to the central error handler.
 */

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

module.exports = { asyncHandler };
