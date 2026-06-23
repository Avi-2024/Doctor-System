/**
 * Users Controller
 * Handles HTTP response concerns for user endpoints.
 */

const { readTenantOverride } = require('../../common/middleware/tenantOverride');
const { successResponse } = require('../../common/utils/response');
const { setAuthCookies } = require('../auth/auth.cookies');

// Creates the users HTTP controller.
const createUsersController = ({ service }) => ({
  // Returns current user and effective access.
  me: async (req, res) => {
    const result = await service.getCurrentUser({ context: req.context });
    return successResponse(res, 'Current user', result);
  },

  // Returns tenant staff users.
  list: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.listUsers({ context: req.context, query: req.query, requestedClinicId });
    return successResponse(res, 'Users', result);
  },

  // Creates a staff user.
  create: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.createUser({ context: req.context, payload: req.body, requestedClinicId });
    return successResponse(res, 'User created', result, null, 201);
  },

  // Returns one staff user.
  detail: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.getUser({ context: req.context, userId: req.params.id, requestedClinicId });
    return successResponse(res, 'User', result);
  },

  // Updates one staff user.
  update: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.updateUser({ context: req.context, userId: req.params.id, payload: req.body, requestedClinicId });
    return successResponse(res, 'User updated', result);
  },

  // Invites a staff user.
  invite: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.inviteUser({ context: req.context, payload: req.body, requestedClinicId });
    return successResponse(res, 'Invitation created', result, null, 201);
  },

  // Lists staff invitations.
  listInvitations: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.listInvitations({ context: req.context, query: req.query, requestedClinicId });
    return successResponse(res, 'Invitations', result);
  },

  // Revokes a staff invitation.
  revokeInvitation: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.revokeInvitation({ context: req.context, invitationId: req.params.id, requestedClinicId });
    return successResponse(res, 'Invitation revoked', result);
  },

  // Resends a staff invitation.
  resendInvitation: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.resendInvitation({ context: req.context, invitationId: req.params.id, requestedClinicId });
    return successResponse(res, 'Invitation resent', result);
  },

  // Accepts a public staff invitation and starts a session.
  acceptInvitation: async (req, res) => {
    const result = await service.acceptInvitation({
      token: req.body.token,
      password: req.body.password,
      context: req.context,
    });
    if (result.accessToken && result.refreshToken) setAuthCookies(res, result);
    return successResponse(res, 'Invitation accepted', {
      user: result.user,
      session: result.session || null,
      invitation: result.invitation,
    });
  },

  // Deactivates one staff user.
  deactivate: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.changeUserStatus({
      context: req.context,
      userId: req.params.id,
      status: 'DEACTIVATED',
      reason: req.body.reason,
      requestedClinicId,
    });
    return successResponse(res, 'User deactivated', result);
  },

  // Reactivates one staff user.
  reactivate: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.changeUserStatus({
      context: req.context,
      userId: req.params.id,
      status: 'ACTIVE',
      reason: req.body.reason,
      requestedClinicId,
    });
    return successResponse(res, 'User reactivated', result);
  },

  // Lists one user's branch assignments.
  listBranchAssignments: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.listUserBranchAssignments({ context: req.context, userId: req.params.id, requestedClinicId });
    return successResponse(res, 'User branch assignments', result);
  },

  // Assigns one user to a branch.
  assignBranch: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.assignUserToBranch({
      context: req.context,
      payload: { userId: req.params.id, branchId: req.body.branchId, isPrimary: req.body.isPrimary },
      requestedClinicId,
    });
    return successResponse(res, result.alreadyAssigned ? 'Branch assignment exists' : 'Branch assigned', result, null, result.alreadyAssigned ? 200 : 201);
  },

  // Revokes one branch assignment.
  revokeBranchAssignment: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.revokeUserBranchAssignment({
      context: req.context,
      userId: req.params.id,
      assignmentId: req.params.assignmentId,
      requestedClinicId,
    });
    return successResponse(res, 'Branch assignment revoked', result);
  },

  // Sets one branch assignment as primary.
  setPrimaryBranchAssignment: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.setPrimaryUserBranchAssignment({
      context: req.context,
      userId: req.params.id,
      assignmentId: req.params.assignmentId,
      requestedClinicId,
    });
    return successResponse(res, 'Primary branch assignment updated', result);
  },
});

module.exports = { createUsersController };
