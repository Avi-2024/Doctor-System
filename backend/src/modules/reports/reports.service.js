/**
 * Reports Service
 * Builds tenant operational summaries.
 */

const { ApiError } = require('../../common/errors/ApiError');
const repository = require('./reports.repository');

// Resolve report date range.
const resolveRange = ({ from, to } = {}) => {
  const now = new Date();
  const end = to || now.toISOString().slice(0, 10);
  const start = from || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  if (start > end) throw new ApiError(422, 'from must not exceed to');
  return { from: start, to: end };
};

// Fetch clinic summary.
const getSummary = async (clinicId, filters) => repository.getSummary({ clinicId, ...resolveRange(filters) });

// Fetch doctor utilization.
const getDoctorUtilization = async (clinicId, filters) => repository.getDoctorUtilization({ clinicId, ...resolveRange(filters) });

module.exports = { getSummary, getDoctorUtilization, resolveRange };
