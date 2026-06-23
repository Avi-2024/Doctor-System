/**
 * Branches Validators
 * Validates branch CRUD API input.
 */

const { body, param, query } = require('express-validator');
const { validate } = require('../../common/middleware/validate');
const { BRANCH_STATUS } = require('./branches.constants');

const branchCodePattern = /^[a-z][a-z0-9_-]{1,79}$/;

const listBranchesValidators = [
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional({ nullable: true }).isString().trim().isLength({ max: 190 }),
  query('status').optional({ nullable: true }).isIn(Object.values(BRANCH_STATUS)),
  validate,
];

const createBranchValidators = [
  body('branchCode').isString().trim().matches(branchCodePattern),
  body('name').isString().trim().isLength({ min: 2, max: 190 }),
  body('timezone').optional({ nullable: true }).isString().trim().isLength({ min: 1, max: 80 }),
  body('contact').optional({ nullable: true }).isObject(),
  body('address').optional({ nullable: true }).isObject(),
  body('isPrimary').optional({ nullable: true }).isBoolean().toBoolean(),
  validate,
];

const branchIdParamValidators = [
  param('id').isUUID(4),
  validate,
];

const updateBranchValidators = [
  param('id').isUUID(4),
  body('name').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 190 }),
  body('timezone').optional({ nullable: true }).isString().trim().isLength({ min: 1, max: 80 }),
  body('contact').optional({ nullable: true }).isObject(),
  body('address').optional({ nullable: true }).isObject(),
  body('isPrimary').optional({ nullable: true }).isBoolean().toBoolean(),
  validate,
];

const changeBranchStatusValidators = [
  param('id').isUUID(4),
  body('status').isIn(Object.values(BRANCH_STATUS)),
  body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  validate,
];

module.exports = {
  branchIdParamValidators,
  changeBranchStatusValidators,
  createBranchValidators,
  listBranchesValidators,
  updateBranchValidators,
};
