/**
 * Sentry Configuration
 * Configures optional production error tracing.
 */

const Sentry = require('@sentry/node');
const { env } = require('./env');

// Initialize Sentry tracing.
const initSentry = () => {
  if (!env.SENTRY_DSN) return false;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
  return true;
};

// Attach Sentry Express error handler.
const attachSentryErrorHandler = (app) => {
  if (env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
};

// Capture unhandled application error.
const captureException = (error, context = {}) => {
  if (env.SENTRY_DSN) Sentry.captureException(error, { extra: context });
};

module.exports = { initSentry, attachSentryErrorHandler, captureException };
