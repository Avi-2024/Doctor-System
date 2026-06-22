/**
 * RBAC Controller
 * Handles HTTP response concerns for RBAC endpoints.
 */

const { successResponse } = require('../../common/utils/response');

const createRbacController = ({ service }) => ({
  listPermissions: async (req, res) => {
    const permissions = await service.listPermissions({ context: req.context });
    return successResponse(res, 'Permissions', { permissions });
  },

  listRoles: async (req, res) => {
    const roles = await service.listRoles({ context: req.context });
    return successResponse(res, 'Roles', { roles });
  },

  createRole: async (req, res) => {
    const role = await service.createRole({ context: req.context, payload: req.body });
    return successResponse(res, 'Role created', { role }, null, 201);
  },

  assignUserRole: async (req, res) => {
    const assignment = await service.assignUserRole({ context: req.context, payload: req.body });
    return successResponse(res, 'Role assigned', { assignment }, null, assignment.alreadyAssigned ? 200 : 201);
  },

  revokeUserRole: async (req, res) => {
    const assignment = await service.revokeUserRole({
      context: req.context,
      assignmentId: req.params.id,
      clinicId: req.query.clinicId || null,
    });
    return successResponse(res, 'Role revoked', { assignment });
  },
});

module.exports = { createRbacController };
