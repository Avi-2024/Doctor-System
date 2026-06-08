/**
 * Resource Controller
 * Handles reusable tenant CRUD HTTP responses.
 */

const { successResponse } = require('../utils/response');

// Build request service context.
const buildContext = (req) => ({ auth: req.auth, tenant: req.tenant, req });

// Create resource controller.
const createResourceController = (config, service) => ({
  // Create resource.
  create: async (req, res) => successResponse(res, `${config.name} created`, await service.create(req.body, buildContext(req)), undefined, 201),

  // List resources.
  list: async (req, res) => {
    const result = await service.list(req.query, buildContext(req));
    return successResponse(res, `${config.name} list fetched`, { items: result.items }, result.meta);
  },

  // Get resource.
  get: async (req, res) => successResponse(res, `${config.name} fetched`, await service.getById(req.params.id, buildContext(req))),

  // Update resource.
  update: async (req, res) => successResponse(res, `${config.name} updated`, await service.updateById(req.params.id, req.body, buildContext(req))),

  // Soft delete resource.
  remove: async (req, res) => successResponse(res, `${config.name} deleted`, await service.removeById(req.params.id, buildContext(req))),
});

module.exports = { createResourceController };
