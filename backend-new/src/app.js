/**
 * Express Application
 * Configures Phase 01 foundation middleware and health routes.
 */

const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { env } = require('./config/env');
const { ping } = require('./database/prisma');
const { requestId } = require('./common/middleware/requestId');
const { requestContext } = require('./common/middleware/requestContext');
const { createCsrfProtection } = require('./common/middleware/csrf');
const { attachTenantPlaceholder } = require('./common/middleware/tenantContext');
const { requestLogger } = require('./common/middleware/requestLogger');
const { notFound, errorHandler } = require('./common/middleware/errorHandler');
const { createAuthRouter } = require('./modules/auth/auth.routes');
const { createAuthService } = require('./modules/auth/auth.service');
const { createFoundationRouter } = require('./modules/foundation/foundation.routes');
const { createRbacRouter } = require('./modules/rbac/rbac.routes');
const { createRbacService } = require('./modules/rbac/rbac.service');
const { createUsersRouter } = require('./modules/users/users.routes');

const parseOrigins = (value) => String(value).split(',').map((origin) => origin.trim()).filter(Boolean);
const isHealthRoute = (req) => req.path === '/health' || req.path === '/health/ready';

const createRateLimiter = ({ windowMs, max }) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
});

const createApp = ({
  readinessPing = ping,
  rateLimitOptions = {},
  authLoginRateLimitOptions = {},
  authRefreshRateLimitOptions = {},
  authService,
  rbacService,
  usersService,
  enablePostSprint1Routes = env.ENABLE_POST_SPRINT_1_ROUTES,
} = {}) => {
  const app = express();
  const origins = parseOrigins(env.CORS_ALLOWED_ORIGINS);
  const validateOrigin = (origin, callback) => callback(null, !origin || origins.includes(origin));
  const csrfProtection = createCsrfProtection();
  const resolvedRbacService = rbacService || createRbacService();
  const resolvedAuthService = authService || createAuthService({
    permissionResolver: (input) => resolvedRbacService.resolveEffectiveAccess(input),
  });

  app.set('trust proxy', env.TRUST_PROXY);
  app.use(requestId);
  app.use(requestContext);
  app.use(attachTenantPlaceholder);
  app.use(requestLogger);
  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: validateOrigin, credentials: true }));
  app.use(cookieParser());
  app.use(rateLimit({
    windowMs: rateLimitOptions.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    max: rateLimitOptions.max ?? env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isHealthRoute,
  }));
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));

  app.use(createFoundationRouter({ readinessPing }));
  app.use('/api/v1/auth/login', createRateLimiter({
    windowMs: authLoginRateLimitOptions.windowMs ?? env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
    max: authLoginRateLimitOptions.max ?? env.AUTH_LOGIN_RATE_LIMIT_MAX,
  }));
  app.use('/api/v1/auth/refresh', createRateLimiter({
    windowMs: authRefreshRateLimitOptions.windowMs ?? env.AUTH_REFRESH_RATE_LIMIT_WINDOW_MS,
    max: authRefreshRateLimitOptions.max ?? env.AUTH_REFRESH_RATE_LIMIT_MAX,
  }));
  app.use('/api/v1/auth', createAuthRouter({ service: resolvedAuthService }));
  if (enablePostSprint1Routes) {
    app.use('/api/v1/rbac', csrfProtection, createRbacRouter({ authService: resolvedAuthService, service: resolvedRbacService }));
    app.use('/api/v1/users', csrfProtection, createUsersRouter({ authService: resolvedAuthService, service: usersService }));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
module.exports.isHealthRoute = isHealthRoute;
