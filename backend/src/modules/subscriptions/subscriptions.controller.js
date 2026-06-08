/**
 * Subscriptions Controller
 * Handles tenant subscription usage requests.
 */

const service = require('./subscriptions.service');
const { successResponse } = require('../../common/utils/response');

// Get tenant subscription usage.
const getUsage = async (req, res) => successResponse(
  res,
  'Subscription usage fetched',
  await service.getUsageSummary(req.tenant.clinicId),
);

module.exports = { getUsage };
