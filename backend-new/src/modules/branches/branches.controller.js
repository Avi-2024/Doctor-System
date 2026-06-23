/**
 * Branches Controller
 * Handles HTTP response concerns for branch endpoints.
 */

const { readTenantOverride } = require('../../common/middleware/tenantOverride');
const { successResponse } = require('../../common/utils/response');

// Creates the branches HTTP controller.
const createBranchesController = ({ service }) => ({
  // Returns tenant branches.
  list: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.listBranches({ context: req.context, query: req.query, requestedClinicId });
    return successResponse(res, 'Branches', result);
  },

  // Creates a branch.
  create: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.createBranch({ context: req.context, payload: req.body, requestedClinicId });
    return successResponse(res, 'Branch created', result, null, 201);
  },

  // Returns one branch.
  detail: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.getBranch({ context: req.context, branchId: req.params.id, requestedClinicId });
    return successResponse(res, 'Branch', result);
  },

  // Updates a branch.
  update: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.updateBranch({ context: req.context, branchId: req.params.id, payload: req.body, requestedClinicId });
    return successResponse(res, 'Branch updated', result);
  },

  // Changes branch status.
  status: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.changeBranchStatus({
      context: req.context,
      branchId: req.params.id,
      status: req.body.status,
      reason: req.body.reason || null,
      requestedClinicId,
    });
    return successResponse(res, 'Branch status updated', result);
  },
});

module.exports = { createBranchesController };
