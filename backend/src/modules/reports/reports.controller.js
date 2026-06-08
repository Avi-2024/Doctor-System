/**
 * Reports Controller
 * Maps tenant reporting requests.
 */

const service = require('./reports.service');
const { successResponse } = require('../../common/utils/response');

// Fetch clinic summary.
const getSummary = async (req, res) => {
  const summary = await service.getSummary(req.tenant.clinicId, req.query);
  return successResponse(res, 'Clinic summary fetched', summary);
};

// Fetch doctor utilization.
const getDoctorUtilization = async (req, res) => {
  const items = await service.getDoctorUtilization(req.tenant.clinicId, req.query);
  return successResponse(res, 'Doctor utilization fetched', { items });
};

module.exports = { getSummary, getDoctorUtilization };
