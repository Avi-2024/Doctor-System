/**
 * Async Handler Utility
 * Forwards asynchronous route failures.
 */

// Wrap asynchronous controller.
const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = { asyncHandler };
