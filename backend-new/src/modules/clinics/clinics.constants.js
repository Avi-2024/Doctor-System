/**
 * Clinics Constants
 * Defines tenant lifecycle states and onboarding defaults.
 */

const CLINIC_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
});

const CLINIC_ACTION = Object.freeze({
  ONBOARDED: 'clinic.onboarded',
  UPDATED: 'clinic.updated',
  STATUS_CHANGED: 'clinic.status_changed',
  OVERRIDE_ALLOWED: 'tenant.override.allowed',
  OVERRIDE_DENIED: 'tenant.override.denied',
  WRITE_DENIED: 'tenant.write_denied',
});

const CLINIC_OUTBOX_EVENT = Object.freeze({
  CREATED: 'clinic.created.v1',
  STATUS_CHANGED: 'clinic.status_changed.v1',
  OWNER_ACTIVATED: 'user.activated.v1',
  BRANCH_CREATED: 'branch.created.v1',
  SETTING_UPDATED: 'settings.updated.v1',
  SUBSCRIPTION_TRIAL_STARTED: 'subscription.trial_started.v1',
});

const DEFAULT_TRIAL_PLAN = Object.freeze({
  code: 'trial_default',
  name: 'Default Trial',
  trialDays: 14,
});

// Checks whether a clinic can accept tenant-owned writes.
const clinicCanWrite = (clinic) => clinic && clinic.status === CLINIC_STATUS.ACTIVE && !clinic.is_deleted;

// Checks whether a clinic is read-visible to normal tenant users.
const clinicCanRead = (clinic) => clinic && !clinic.is_deleted;

module.exports = {
  CLINIC_ACTION,
  CLINIC_OUTBOX_EVENT,
  CLINIC_STATUS,
  DEFAULT_TRIAL_PLAN,
  clinicCanRead,
  clinicCanWrite,
};
