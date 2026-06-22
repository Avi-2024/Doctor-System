/**
 * Request ID Middleware
 * Attaches a trace identifier to every request.
 */

const crypto = require('node:crypto');

const requestIdPattern = /^[a-zA-Z0-9._:-]{8,128}$/;

const createRequestId = () => crypto.randomUUID();

const requestId = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  req.requestId = typeof incoming === 'string' && requestIdPattern.test(incoming) ? incoming : createRequestId();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

module.exports = { requestId, createRequestId };
