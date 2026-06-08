/**
 * Subscription Status Constants
 * Defines clinic subscription states.
 */

const SUBSCRIPTION_STATUS = Object.freeze({
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
});

module.exports = { SUBSCRIPTION_STATUS };
