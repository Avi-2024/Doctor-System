/**
 * Settings Constants
 * Defines supported setting scopes and sensitive key behavior.
 */

const SETTING_SCOPE = Object.freeze({
  PLATFORM: 'PLATFORM',
  CLINIC: 'CLINIC',
  BRANCH: 'BRANCH',
  USER: 'USER',
});

const SETTING_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
});

const SETTING_ACTION = Object.freeze({
  UPDATED: 'settings.updated',
  ARCHIVED: 'settings.archived',
  SENSITIVE_READ: 'settings.sensitive_read',
  DENIED: 'settings.denied',
});

const SETTING_OUTBOX_EVENT = Object.freeze({
  UPDATED: 'settings.updated.v1',
});

const ALLOWED_SETTING_KEYS = Object.freeze([
  'clinic.timezone',
  'clinic.locale',
  'clinic.branding',
  'notifications.whatsapp',
  'security.session',
  'billing.defaults',
]);

const SENSITIVE_SETTING_KEYS = Object.freeze([
  'notifications.whatsapp',
  'security.session',
]);

// Checks if a setting key is sensitive enough to require elevated permissions.
const isSensitiveSettingKey = (key) => SENSITIVE_SETTING_KEYS.includes(key);

module.exports = {
  ALLOWED_SETTING_KEYS,
  SENSITIVE_SETTING_KEYS,
  SETTING_ACTION,
  SETTING_OUTBOX_EVENT,
  SETTING_SCOPE,
  SETTING_STATUS,
  isSensitiveSettingKey,
};
