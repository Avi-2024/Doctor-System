/**
 * Request ID Middleware
 * Attaches trace identifier to requests.
 */

const { createId } = require('../utils/ids');

// Attach request identifier.
const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || createId();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

module.exports = { requestId };
