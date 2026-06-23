/**
 * Subscriptions Constants
 * Defines minimal Sprint 3 subscription states and audit actions.
 */

const SUBSCRIPTION_STATUS = Object.freeze({
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELED: 'CANCELED',
});

const SUBSCRIPTION_ACTION = Object.freeze({
  TRIAL_STARTED: 'subscription.trial_started',
});

const SUBSCRIPTION_OUTBOX_EVENT = Object.freeze({
  TRIAL_STARTED: 'subscription.trial_started.v1',
});

module.exports = {
  SUBSCRIPTION_ACTION,
  SUBSCRIPTION_OUTBOX_EVENT,
  SUBSCRIPTION_STATUS,
};
