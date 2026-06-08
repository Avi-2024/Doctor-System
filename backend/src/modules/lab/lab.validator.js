/**
 * Lab Validator
 * Validates lab catalog, order, and report payloads.
 */

const { body } = require('express-validator');

const testCreateRules = [body('code').isString().trim().notEmpty(), body('name').isString().trim().notEmpty(), body('price').optional().isFloat({ min: 0 })];
const testUpdateRules = [body('name').optional().isString().trim().notEmpty(), body('price').optional().isFloat({ min: 0 }), body('is_active').optional().isBoolean()];
const orderCreateRules = [body('order_number').isString().trim().notEmpty(), body('patient_id').isUUID(), body('doctor_id').isUUID(), body('items').isArray({ min: 1 })];
const orderUpdateRules = [body('status').optional().isIn(['ORDERED', 'SENT_TO_LAB', 'REPORT_RECEIVED', 'CANCELLED']), body('items').optional().isArray({ min: 1 })];
const reportCreateRules = [body('lab_order_id').isUUID(), body('patient_id').isUUID(), body('attachment_id').isUUID()];
const reportUpdateRules = [body('result_data').optional().isObject(), body('reviewed_by').optional({ nullable: true }).isUUID()];
const orderItemCreateRules = [
  body('lab_order_id').isUUID(),
  body('lab_test_id').optional({ nullable: true }).isUUID(),
  body('test_name').isString().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['ORDERED', 'SENT_TO_LAB', 'REPORT_RECEIVED', 'CANCELLED']),
];
const orderItemUpdateRules = [
  body('test_name').optional().isString().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['ORDERED', 'SENT_TO_LAB', 'REPORT_RECEIVED', 'CANCELLED']),
  body('result_data').optional({ nullable: true }).isObject(),
];

module.exports = {
  testCreateRules,
  testUpdateRules,
  orderCreateRules,
  orderUpdateRules,
  reportCreateRules,
  reportUpdateRules,
  orderItemCreateRules,
  orderItemUpdateRules,
};
