/**
 * Resource Module Factory
 * Composes reusable tenant CRUD layers.
 */

const { createResourceRepository } = require('./resource.repository');
const { createResourceService } = require('./resource.service');
const { createResourceController } = require('./resource.controller');
const { createResourceRouter } = require('./resource.router');

// Create resource module.
const createResourceModule = (config) => {
  const repository = createResourceRepository(config);
  const service = createResourceService(config, repository);
  const controller = createResourceController(config, service);
  const router = createResourceRouter(config, controller);
  return { router, controller, service, repository };
};

module.exports = { createResourceModule };
