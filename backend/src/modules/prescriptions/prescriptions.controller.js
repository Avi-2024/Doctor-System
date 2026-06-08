/**
 * Prescriptions Controller
 * Handles prescription export requests.
 */

const service = require('./prescriptions.service');
const { successResponse } = require('../../common/utils/response');

// Export printable prescription.
const exportPrescription = async (req, res) => successResponse(
  res,
  'Prescription export fetched',
  await service.exportPrescription(req.params.id, { clinicId: req.tenant.clinicId }),
);

module.exports = { exportPrescription };
