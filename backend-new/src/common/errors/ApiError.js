/**
 * API Error
 * Carries safe HTTP status and optional validation details.
 */

class ApiError extends Error {
  constructor(statusCode, message, details = null, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.expose = options.expose ?? statusCode < 500;
  }
}

module.exports = { ApiError };
