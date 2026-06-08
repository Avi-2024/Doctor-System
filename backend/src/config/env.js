/**
 * Environment Configuration
 * Normalizes and validates runtime configuration.
 */

require('dotenv').config();

// Read numeric environment value.
const numberValue = (key, fallback) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : fallback;
};

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: process.env.APP_NAME || 'doctor-system-backend',
  PORT: numberValue('PORT', 8080),
  TRUST_PROXY: numberValue('TRUST_PROXY', 0),
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173',
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '1mb',
  RATE_LIMIT_WINDOW_MS: numberValue('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX: numberValue('RATE_LIMIT_MAX', 300),
  AUTH_RATE_LIMIT_MAX: numberValue('AUTH_RATE_LIMIT_MAX', 20),
  DATABASE_URL: process.env.DATABASE_URL || '',
  NOTIFICATION_BATCH_SIZE: numberValue('NOTIFICATION_BATCH_SIZE', 50),
  NOTIFICATION_MAX_ATTEMPTS: numberValue('NOTIFICATION_MAX_ATTEMPTS', 5),
  NOTIFICATION_RETRY_BASE_SECONDS: numberValue('NOTIFICATION_RETRY_BASE_SECONDS', 30),
  NOTIFICATION_PROCESSING_TIMEOUT_SECONDS: numberValue('NOTIFICATION_PROCESSING_TIMEOUT_SECONDS', 300),
  NOTIFICATION_POLL_INTERVAL_MS: numberValue('NOTIFICATION_POLL_INTERVAL_MS', 5000),
  MYSQL_HOST: process.env.MYSQL_HOST || '127.0.0.1',
  MYSQL_PORT: numberValue('MYSQL_PORT', 3306),
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'doctor_system',
  MYSQL_USER: process.env.MYSQL_USER || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
  MYSQL_CONNECTION_LIMIT: numberValue('MYSQL_CONNECTION_LIMIT', 20),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'lax',
  PASSWORD_RESET_WEB_URL: process.env.PASSWORD_RESET_WEB_URL || 'http://localhost:5173/auth/reset-password',
  PASSWORD_RESET_WEBHOOK_URL: process.env.PASSWORD_RESET_WEBHOOK_URL || '',
  PASSWORD_RESET_WEBHOOK_SECRET: process.env.PASSWORD_RESET_WEBHOOK_SECRET || '',
  USER_INVITATION_WEB_URL: process.env.USER_INVITATION_WEB_URL || 'http://localhost:5173/auth/accept-invitation',
  USER_INVITATION_WEBHOOK_URL: process.env.USER_INVITATION_WEBHOOK_URL || '',
  USER_INVITATION_WEBHOOK_SECRET: process.env.USER_INVITATION_WEBHOOK_SECRET || '',
  USER_INVITATION_TTL_HOURS: numberValue('USER_INVITATION_TTL_HOURS', 72),
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME || '',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || '',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || '',
  AWS_REGION: process.env.AWS_REGION || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  S3_SIGNED_URL_EXPIRES_SECONDS: numberValue('S3_SIGNED_URL_EXPIRES_SECONDS', 300),
  UPLOAD_MAX_FILE_SIZE_BYTES: numberValue('UPLOAD_MAX_FILE_SIZE_BYTES', 10485760),
  UPLOAD_ALLOWED_MIME_TYPES: process.env.UPLOAD_ALLOWED_MIME_TYPES || 'application/pdf,image/jpeg,image/png,image/webp',
  SETTINGS_ENCRYPTION_KEY: process.env.SETTINGS_ENCRYPTION_KEY || '',
  WHATSAPP_API_BASE_URL: process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v21.0',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  SENTRY_TRACES_SAMPLE_RATE: numberValue('SENTRY_TRACES_SAMPLE_RATE', 0.05),
});

// Validate production environment.
const validateEnv = () => {
  if (env.NODE_ENV !== 'production') return;
  const required = [
    'MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD',
    'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
    'PASSWORD_RESET_WEB_URL', 'PASSWORD_RESET_WEBHOOK_URL', 'PASSWORD_RESET_WEBHOOK_SECRET',
    'USER_INVITATION_WEB_URL', 'USER_INVITATION_WEBHOOK_URL', 'USER_INVITATION_WEBHOOK_SECRET',
    'AWS_REGION', 'AWS_S3_BUCKET',
    'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (env.JWT_ACCESS_SECRET.length < 32 || env.JWT_REFRESH_SECRET.length < 32) throw new Error('JWT secrets require 32 characters');
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) throw new Error('JWT secrets must differ');
  if (env.SETTINGS_ENCRYPTION_KEY && Buffer.byteLength(env.SETTINGS_ENCRYPTION_KEY, 'utf8') < 32) throw new Error('SETTINGS_ENCRYPTION_KEY requires 32 characters');
  if (!env.COOKIE_SECURE) throw new Error('COOKIE_SECURE must be true in production');
  if (env.CORS_ALLOWED_ORIGINS.includes('*')) throw new Error('Wildcard CORS is not allowed in production');
};

validateEnv();

module.exports = { env };
