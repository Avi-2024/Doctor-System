/**
 * Patient Records Controller
 * Handles HTTP response concerns for append-only patient record endpoints.
 */

const { readTenantOverride } = require('../../common/middleware/tenantOverride');
const { successResponse } = require('../../common/utils/response');

// Creates the patient records HTTP controller.
const createPatientRecordsController = ({ service }) => ({
  // Returns patient records.
  list: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.listRecords({ context: req.context, query: req.query, requestedClinicId });
    return successResponse(res, 'Patient records', result);
  },

  // Creates one append-only patient record.
  create: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.createRecord({ context: req.context, payload: req.body, requestedClinicId });
    return successResponse(res, 'Patient record created', result, null, 201);
  },

  // Returns one patient record.
  detail: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.getRecord({ context: req.context, recordId: req.params.id, requestedClinicId });
    return successResponse(res, 'Patient record', result);
  },

  // Archives one patient record.
  archive: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.archiveRecord({ context: req.context, recordId: req.params.id, reason: req.body.reason, requestedClinicId });
    return successResponse(res, 'Patient record archived', result);
  },
});

module.exports = { createPatientRecordsController };
