/**
 * Response Utilities
 * Sends consistent API response envelopes.
 */

// Send success response.
const successResponse = (res, message, data = null, meta, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data, ...(meta ? { meta } : {}) });
};

// Send error response.
const errorResponse = (res, message, statusCode, data, meta) => {
  return res.status(statusCode).json({ success: false, message, ...(data ? { data } : {}), ...(meta ? { meta } : {}) });
};

module.exports = { successResponse, errorResponse };
