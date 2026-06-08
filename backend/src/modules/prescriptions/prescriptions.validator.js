/**
 * Prescriptions Validator
 * Validates prescription and template payloads.
 */

const { body, param } = require('express-validator');

const prescriptionCreateRules = [body('patient_id').isUUID(), body('doctor_id').isUUID(), body('medicines').isArray({ min: 1 })];
const prescriptionUpdateRules = [body('diagnosis').optional({ nullable: true }).isString(), body('medicines').optional().isArray({ min: 1 }), body('advice').optional({ nullable: true }).isString()];
const templateCreateRules = [body('doctor_id').isUUID(), body('name').isString().trim().notEmpty(), body('template_data').isObject()];
const templateUpdateRules = [body('name').optional().isString().trim().notEmpty(), body('template_data').optional().isObject()];
const prescriptionIdRules = [param('id').isUUID()];

module.exports = { prescriptionCreateRules, prescriptionUpdateRules, templateCreateRules, templateUpdateRules, prescriptionIdRules };
