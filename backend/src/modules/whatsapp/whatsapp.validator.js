/**
 * WhatsApp Validator
 * Validates outbound message requests.
 */

const { body, param } = require('express-validator');

const queueMessageRules = [
  body('recipient').isString().trim().notEmpty(),
  body('message').optional().isString().trim().notEmpty(),
  body('templateName').optional().isString().trim().notEmpty(),
  body('languageCode').optional().isString().trim().notEmpty(),
  body('components').optional().isArray(),
  body('patientId').optional({ nullable: true }).isUUID(),
  body('payload').optional().isObject(),
  body('scheduledFor').optional().isISO8601(),
  body().custom((value) => {
    if (!value.message && !value.templateName) throw new Error('message or templateName is required');
    return true;
  }),
];
const sendMessageRules = [param('id').isUUID()];
const accountCreateRules = [
  body('phone_number_id').isString().trim().notEmpty(),
  body('business_account_id').isString().trim().notEmpty(),
  body('display_phone_number').isString().trim().notEmpty(),
];
const accountUpdateRules = [body('display_phone_number').optional().isString().trim().notEmpty(), body('is_active').optional().isBoolean()];
const templateCreateRules = [
  body('name').isString().trim().notEmpty(),
  body('provider_template_name').isString().trim().notEmpty(),
  body('language_code').optional().isString().trim().notEmpty(),
  body('category').optional().isIn(['AUTHENTICATION', 'MARKETING', 'UTILITY']),
  body('status').optional().isIn(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED']),
  body('components').isArray(),
];
const templateUpdateRules = [
  body('name').optional().isString().trim().notEmpty(),
  body('language_code').optional().isString().trim().notEmpty(),
  body('category').optional().isIn(['AUTHENTICATION', 'MARKETING', 'UTILITY']),
  body('status').optional().isIn(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED']),
  body('components').optional().isArray(),
];

module.exports = { queueMessageRules, sendMessageRules, accountCreateRules, accountUpdateRules, templateCreateRules, templateUpdateRules };
