/**
 * Auth Middleware
 * Resolves access-token identity without making authorization decisions.
 */

const { withIdentity } = require('../../common/context/requestContext');
const { TENANT_SCOPE } = require('../../common/constants/tenant');
const { AUTH_COOKIE } = require('./auth.constants');
const { createAuthService } = require('./auth.service');

const createAuthMiddleware = ({ service = createAuthService() } = {}) => async (req, res, next) => {
  try {
    const resolved = await service.resolveAccessToken(req.cookies?.[AUTH_COOKIE.ACCESS_TOKEN]);
    req.context = withIdentity(req.context, resolved.contextIdentity);
    req.auth = {
      user: resolved.user,
      session: resolved.session,
    };
    req.tenant = {
      clinicId: req.context.clinicId,
      branchId: req.context.branchId,
      scope: req.context.isPlatform ? TENANT_SCOPE.PLATFORM : TENANT_SCOPE.CLINIC,
      isPlatform: req.context.isPlatform,
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { createAuthMiddleware };
