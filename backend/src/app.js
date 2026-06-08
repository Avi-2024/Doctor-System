/**
 * Express Application
 * Configures secure API middleware.
 */

const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const modules = require('./modules');
const { env } = require('./config/env');
const { ping } = require('./database/prisma');
const { requestId } = require('./common/middleware/requestId');
const { requestLogger } = require('./common/middleware/requestLogger');
const { notFound, errorHandler } = require('./common/middleware/errorHandler');
const { successResponse, errorResponse } = require('./common/utils/response');
const { attachSentryErrorHandler } = require('./config/sentry');

const app = express();
const origins = env.CORS_ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean);
const authRateLimit = rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.AUTH_RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false });

// Validate request origin.
const validateOrigin = (origin, callback) => callback(null, !origin || origins.includes(origin));

app.set('trust proxy', env.TRUST_PROXY);
app.use(requestId);
app.use(requestLogger);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: validateOrigin, credentials: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false }));
app.use('/api/v1/whatsapp/webhook', express.raw({ type: '*/*' }));
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));

app.get('/health', (req, res) => successResponse(res, 'Service healthy', { service: env.APP_NAME, requestId: req.requestId }));
app.get('/health/ready', async (req, res) => {
  try {
    await ping();
    return successResponse(res, 'Service ready', { database: 'mysql' });
  } catch (error) {
    return errorResponse(res, 'Service dependencies unavailable', 503, { database: 'disconnected' });
  }
});

app.use('/api/v1/auth', authRateLimit);
app.use('/api/v1', modules);
app.use(notFound);
attachSentryErrorHandler(app);
app.use(errorHandler);

module.exports = app;
