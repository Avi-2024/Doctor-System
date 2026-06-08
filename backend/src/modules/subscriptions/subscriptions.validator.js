/**
 * Subscriptions Validator
 * Validates plan and clinic subscription payloads.
 */

const { body } = require('express-validator');
const { SUBSCRIPTION_STATUS } = require('../../common/constants/subscriptionStatus');

const planCreateRules = [
  body('code').isString().trim().notEmpty(),
  body('name').isString().trim().notEmpty(),
  body('monthly_price').optional().isFloat({ min: 0 }),
  body('yearly_price').optional().isFloat({ min: 0 }),
  body('limits').isObject(),
  body('features').isArray(),
];
const planUpdateRules = [
  body('name').optional().isString().trim().notEmpty(),
  body('monthly_price').optional().isFloat({ min: 0 }),
  body('yearly_price').optional().isFloat({ min: 0 }),
  body('limits').optional().isObject(),
  body('features').optional().isArray(),
];
const subscriptionCreateRules = [
  body('plan_id').isUUID(),
  body('status').optional().isIn(Object.values(SUBSCRIPTION_STATUS)),
  body('starts_at').isISO8601(),
  body('ends_at').optional({ nullable: true }).isISO8601(),
  body('usage_data').optional().isObject(),
];
const subscriptionUpdateRules = [
  body('status').optional().isIn(Object.values(SUBSCRIPTION_STATUS)),
  body('ends_at').optional({ nullable: true }).isISO8601(),
  body('usage_data').optional().isObject(),
];

module.exports = { planCreateRules, planUpdateRules, subscriptionCreateRules, subscriptionUpdateRules };
