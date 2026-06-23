/**
 * Subscriptions Controller
 * Handles HTTP response concerns for subscription endpoints.
 */

const { readTenantOverride } = require('../../common/middleware/tenantOverride');
const { successResponse } = require('../../common/utils/response');

// Creates the subscriptions HTTP controller.
const createSubscriptionsController = ({ service }) => ({
  // Returns the current tenant subscription.
  current: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.getCurrentSubscription({ context: req.context, requestedClinicId });
    return successResponse(res, 'Current subscription', result);
  },
});

module.exports = { createSubscriptionsController };
