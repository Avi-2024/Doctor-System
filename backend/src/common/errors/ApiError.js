/**
 * API Error
 * Represents safe HTTP application failures.
 */

class ApiError extends Error {
  // Create API error.
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = { ApiError };
