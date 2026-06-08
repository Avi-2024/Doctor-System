/**
 * Storage Controller
 * Maps attachment storage requests.
 */

const service = require('./storage.service');
const { successResponse } = require('../../common/utils/response');

// Build storage service context.
const context = (req) => ({ clinicId: req.tenant.clinicId, userId: req.auth.userId });

// Upload attachment.
const upload = async (req, res) => {
  const record = await service.upload({ file: req.file, ownerType: req.body.ownerType, ownerId: req.body.ownerId, context: context(req) });
  return successResponse(res, 'Attachment uploaded', record, undefined, 201);
};

// Create signed attachment URL.
const signedUrl = async (req, res) => {
  const result = await service.signedUrl(req.params.id, context(req));
  return successResponse(res, 'Signed URL created', result);
};

// List attachment metadata.
const list = async (req, res) => {
  const result = await service.list(req.query, context(req));
  return successResponse(res, 'Attachment list fetched', { items: result.items }, result.meta);
};

module.exports = { upload, signedUrl, list };
