/**
 * Settings Controller
 * Handles HTTP response concerns for settings endpoints.
 */

const { readTenantOverride } = require('../../common/middleware/tenantOverride');
const { successResponse } = require('../../common/utils/response');

// Creates the settings HTTP controller.
const createSettingsController = ({ service }) => ({
  // Returns settings visible to the actor.
  list: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.listSettings({ context: req.context, query: req.query, requestedClinicId });
    return successResponse(res, 'Settings', result);
  },

  // Returns one setting.
  detail: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.getSetting({ context: req.context, key: req.params.key, query: req.query, requestedClinicId });
    return successResponse(res, 'Setting', result);
  },

  // Creates or updates one setting.
  upsert: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.upsertSetting({ context: req.context, key: req.params.key, payload: req.body, requestedClinicId });
    return successResponse(res, 'Setting updated', result);
  },

  // Archives one setting.
  archive: async (req, res) => {
    const { requestedClinicId } = readTenantOverride(req);
    const result = await service.archiveSetting({ context: req.context, key: req.params.key, payload: req.body, requestedClinicId });
    return successResponse(res, 'Setting archived', result);
  },
});

module.exports = { createSettingsController };
