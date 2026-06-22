/**
 * Response Utilities
 * Sends consistent API response envelopes.
 */

const successResponse = (res, message, data = null, meta = null, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data, meta: meta || {} });
};

const errorResponse = (res, message, statusCode, data = null, meta = null) => {
  const requestId = meta?.requestId;
  const errors = meta?.errors || undefined;
  return res.status(statusCode).json({
    success: false,
    message,
    ...(data ? { data } : {}),
    ...(errors ? { errors } : {}),
    ...(requestId ? { requestId } : {}),
  });
};

module.exports = { successResponse, errorResponse };
