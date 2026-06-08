/**
 * Reports Validator
 * Validates reporting query filters.
 */

const { query } = require('express-validator');

const dateRangeRules = [
  query('from').optional().isISO8601({ strict: true, strictSeparator: true }),
  query('to').optional().isISO8601({ strict: true, strictSeparator: true }),
];

module.exports = { dateRangeRules };
