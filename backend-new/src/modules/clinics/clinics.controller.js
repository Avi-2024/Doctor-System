/**
 * Clinics Controller
 * Handles HTTP response concerns for clinic endpoints.
 */

const { readTenantOverride } = require('../../common/middleware/tenantOverride');
const { successResponse } = require('../../common/utils/response');

// Creates the clinics HTTP controller.
const createClinicsController = ({ service }) => ({
  // Returns platform clinic list or current tenant singleton list.
  list: async (req, res) => {
    const result = await service.listClinics({ context: req.context, query: req.query });
    return successResponse(res, 'Clinics', result);
  },

  // Creates a new clinic tenant.
  create: async (req, res) => {
    const result = await service.onboardClinic({
      context: req.context,
      payload: req.body,
      idempotencyKey: req.get('idempotency-key'),
    });
    return successResponse(res, result.idempotent ? 'Clinic onboarding replayed' : 'Clinic onboarded', result, null, result.idempotent ? 200 : 201);
  },

  // Returns the current clinic tenant.
  current: async (req, res) => {
    const result = await service.getCurrentClinic({ context: req.context });
    return successResponse(res, 'Current clinic', result);
  },

  // Returns one clinic by id.
  detail: async (req, res) => {
    const result = await service.getClinic({ context: req.context, clinicId: req.params.id });
    return successResponse(res, 'Clinic', result);
  },

  // Updates clinic metadata.
  update: async (req, res) => {
    const result = await service.updateClinic({ context: req.context, clinicId: req.params.id, payload: req.body });
    return successResponse(res, 'Clinic updated', result);
  },

  // Changes clinic lifecycle status.
  status: async (req, res) => {
    const { supportReason } = readTenantOverride(req);
    const result = await service.changeClinicStatus({
      context: req.context,
      clinicId: req.params.id,
      status: req.body.status,
      reason: req.body.reason,
      supportReason,
    });
    return successResponse(res, 'Clinic status updated', result);
  },
});

module.exports = { createClinicsController };
