/**
 * Users Controller
 * Handles tenant user requests.
 */

const service = require('./users.service');
const { successResponse } = require('../../common/utils/response');
const { recordAudit } = require('../audit/audit.service');

// Create user.
const create = async (req, res) => {
  const user = await service.createUser(req.body, { clinicId: req.tenant.clinicId, userId: req.auth.userId, role: req.auth.role });
  await recordAudit({ req, clinicId: user.clinic_id, action: 'CREATE', moduleName: 'User', entityType: 'User', entityId: user.id, after: user });
  return successResponse(res, 'User created', user, undefined, 201);
};

// List users.
const list = async (req, res) => {
  const result = await service.listUsers(req.query, { clinicId: req.tenant.clinicId });
  return successResponse(res, 'User list fetched', { items: result.items }, result.meta);
};

// Update user.
const update = async (req, res) => {
  const result = await service.updateUser(req.params.id, req.body, { clinicId: req.tenant.clinicId, userId: req.auth.userId, role: req.auth.role });
  await recordAudit({ req, action: 'UPDATE', moduleName: 'User', entityType: 'User', entityId: result.user.id, before: result.before, after: result.user });
  return successResponse(res, 'User updated', result.user);
};

// Soft delete user.
const remove = async (req, res) => {
  const before = await service.deleteUser(req.params.id, { clinicId: req.tenant.clinicId, userId: req.auth.userId, role: req.auth.role });
  await recordAudit({ req, action: 'SOFT_DELETE', moduleName: 'User', entityType: 'User', entityId: req.params.id, before, after: { is_deleted: true } });
  return successResponse(res, 'User deleted', { id: req.params.id, is_deleted: true });
};

// Invite tenant user.
const invite = async (req, res) => {
  const result = await service.inviteUser(req.body, { clinicId: req.tenant.clinicId, userId: req.auth.userId, role: req.auth.role });
  await recordAudit({ req, action: 'INVITE', moduleName: 'User', entityType: 'User invitation', entityId: result.invitation.id, after: result.invitation });
  return successResponse(res, 'User invitation created', result, undefined, 201);
};

// Accept user invitation.
const acceptInvitation = async (req, res) => {
  const result = await service.acceptInvitation(req.body);
  await recordAudit({ req, clinicId: result.user.clinic_id, action: 'ACCEPT_INVITATION', moduleName: 'User', entityType: 'User', entityId: result.user.id, after: result.user });
  return successResponse(res, 'Invitation accepted', { user: result.user }, undefined, 201);
};

// List tenant invitations.
const listInvitations = async (req, res) => {
  const result = await service.listInvitations(req.query, { clinicId: req.tenant.clinicId });
  return successResponse(res, 'User invitations fetched', { items: result.items }, result.meta);
};

// Revoke tenant invitation.
const revokeInvitation = async (req, res) => {
  const result = await service.revokeInvitation(req.params.id, { clinicId: req.tenant.clinicId, userId: req.auth.userId });
  await recordAudit({ req, action: 'REVOKE_INVITATION', moduleName: 'User', entityType: 'User invitation', entityId: result.id, after: result });
  return successResponse(res, 'User invitation revoked', result);
};

module.exports = { create, list, update, remove, invite, acceptInvitation, listInvitations, revokeInvitation };
