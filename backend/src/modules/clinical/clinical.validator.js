/**
 * Clinical Validator
 * Validates consultation and vital payloads.
 */

const { body } = require('express-validator');

const consultationCreateRules = [body('patient_id').isUUID(), body('doctor_id').isUUID(), body('clinical_data').isObject()];
const consultationUpdateRules = [body('status').optional().isIn(['DRAFT', 'COMPLETED']), body('clinical_data').optional().isObject()];
const vitalCreateRules = [body('patient_id').isUUID(), body('consultation_id').optional({ nullable: true }).isUUID(), body('vital_data').isObject()];
const vitalUpdateRules = [body('vital_data').optional().isObject()];

module.exports = { consultationCreateRules, consultationUpdateRules, vitalCreateRules, vitalUpdateRules };
