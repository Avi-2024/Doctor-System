/**
 * Storage Validator
 * Validates attachment ownership input.
 */

const { body, param } = require('express-validator');

const uploadRules = [body('ownerType').isString().trim().notEmpty(), body('ownerId').optional({ nullable: true }).isUUID()];
const signedUrlRules = [param('id').isUUID()];

module.exports = { uploadRules, signedUrlRules };
