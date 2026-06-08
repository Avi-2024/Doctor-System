/**
 * Clinics Controller
 * Handles clinic onboarding.
 */

const service = require('./clinics.service');
const { successResponse } = require('../../common/utils/response');
const { recordAudit } = require('../audit/audit.service');

// Onboard clinic.
const onboard = async (req, res) => {
  const result = await service.onboard(req.body);
  await recordAudit({ req, clinicId: result.clinic.id, action: 'ONBOARD', moduleName: 'Clinic', entityType: 'Clinic', entityId: result.clinic.id, after: result.clinic });
  return successResponse(res, 'Clinic onboarded', result, undefined, 201);
};

// Update clinic profile.
const updateProfile = async (req, res) => {
  const result = await service.updateProfile(req.body, { clinicId: req.tenant.clinicId, userId: req.auth.userId });
  await recordAudit({ req, action: 'UPDATE', moduleName: 'Clinic', entityType: 'Clinic', entityId: result.clinic.id, before: result.before, after: result.clinic });
  return successResponse(res, 'Clinic profile updated', result.clinic);
};

// Update clinic status.
const updateStatus = async (req, res) => {
  const result = await service.updateStatus(req.params.id, req.body.status, { userId: req.auth.userId });
  await recordAudit({ req, clinicId: result.clinic.id, action: 'STATUS_UPDATE', moduleName: 'Clinic', entityType: 'Clinic', entityId: result.clinic.id, before: result.before, after: result.clinic });
  return successResponse(res, 'Clinic status updated', result.clinic);
};

// Soft delete clinic.
const remove = async (req, res) => {
  const before = await service.deleteClinic(req.params.id, { userId: req.auth.userId });
  await recordAudit({ req, clinicId: req.params.id, action: 'SOFT_DELETE', moduleName: 'Clinic', entityType: 'Clinic', entityId: req.params.id, before, after: { is_deleted: true } });
  return successResponse(res, 'Clinic deleted', { id: req.params.id, is_deleted: true });
};

module.exports = { onboard, updateProfile, updateStatus, remove };
