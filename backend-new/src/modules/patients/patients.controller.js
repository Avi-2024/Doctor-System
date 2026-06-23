/**
 * Patients Controller
 * Handles HTTP response concerns for patient endpoints.
 */

const { readTenantOverride } = require('../../common/middleware/tenantOverride');
const { successResponse } = require('../../common/utils/response');

// Creates the patients HTTP controller.
const createPatientsController = ({ service }) => ({
  // Returns tenant patients.
  list: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.listPatients({ context: req.context, query: req.query, requestedClinicId });
    return successResponse(res, 'Patients', result);
  },

  // Searches tenant patients.
  search: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.searchPatients({ context: req.context, query: req.query, requestedClinicId });
    return successResponse(res, 'Patient search results', result);
  },

  // Registers a tenant patient.
  register: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.registerPatient({
      context: req.context,
      payload: req.body,
      idempotencyKey: req.get('idempotency-key'),
      requestedClinicId,
    });
    return successResponse(res, result.idempotent ? 'Patient registration replayed' : 'Patient registered', result, null, result.idempotent ? 200 : 201);
  },

  // Returns one patient.
  detail: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.getPatient({ context: req.context, patientId: req.params.id, requestedClinicId });
    return successResponse(res, 'Patient', result);
  },

  // Updates one patient's registry fields.
  update: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.updatePatient({ context: req.context, patientId: req.params.id, payload: req.body, requestedClinicId });
    return successResponse(res, 'Patient updated', result);
  },

  // Archives one patient.
  archive: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.archivePatient({ context: req.context, patientId: req.params.id, reason: req.body.reason, requestedClinicId });
    return successResponse(res, 'Patient archived', result);
  },

  // Restores one archived patient.
  restore: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.restorePatient({ context: req.context, patientId: req.params.id, reason: req.body.reason, requestedClinicId });
    return successResponse(res, 'Patient restored', result);
  },
});

module.exports = { createPatientsController };
