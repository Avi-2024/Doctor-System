/**
 * Request Context Middleware
 * Attaches a normalized request context after request id creation.
 */

const { buildRequestContext } = require('../context/requestContext');

const requestContext = (req, res, next) => {
  req.context = buildRequestContext(req);
  next();
};

module.exports = { requestContext };
