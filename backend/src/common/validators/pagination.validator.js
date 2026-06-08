/**
 * Pagination Validator
 * Validates common list query parameters.
 */

const { query } = require('express-validator');

const paginationRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim().isLength({ max: 200 }),
  query('sortBy').optional().matches(/^[a-z_][a-z0-9_]*$/i),
  query('sortOrder').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
];

module.exports = { paginationRules };
