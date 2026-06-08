/**
 * Branches Validator
 * Validates clinic branch payloads.
 */

const { body } = require('express-validator');

const branchCreateRules = [body('name').isString().trim().isLength({ min: 2, max: 140 })];
const branchUpdateRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 140 }),
  body('contact').optional({ nullable: true }).isObject(),
  body('address').optional({ nullable: true }).isObject(),
  body('is_primary').optional().isBoolean(),
  body('is_active').optional().isBoolean(),
];

module.exports = { branchCreateRules, branchUpdateRules };
