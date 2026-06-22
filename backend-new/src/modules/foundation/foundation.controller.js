/**
 * Foundation Controller
 * Translates service results into standard API response envelopes.
 */

const { successResponse, errorResponse } = require('../../common/utils/response');

const createFoundationController = ({ service }) => ({
  health: (req, res) => {
    return successResponse(res, 'Service healthy', service.getHealth(req.context));
  },

  readiness: async (req, res) => {
    try {
      const data = await service.getReadiness(req.context);
      return successResponse(res, 'Service ready', data);
    } catch (error) {
      return errorResponse(res, 'Service dependencies unavailable', 503, { database: 'disconnected' }, { requestId: req.requestId });
    }
  },

  meta: (req, res) => {
    return successResponse(res, 'API metadata', service.getMeta(req.context));
  },
});

module.exports = { createFoundationController };
