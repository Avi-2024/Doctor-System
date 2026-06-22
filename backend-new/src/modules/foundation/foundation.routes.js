/**
 * Foundation Routes
 * Phase 01 public operational endpoints.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createFoundationController } = require('./foundation.controller');
const { createFoundationRepository } = require('./foundation.repository');
const { createFoundationService } = require('./foundation.service');
const {
  healthValidators,
  metaValidators,
  readinessValidators,
} = require('./foundation.validator');

const createFoundationRouter = ({ readinessPing }) => {
  const router = Router();
  const repository = createFoundationRepository({ readinessPing });
  const service = createFoundationService({ repository });
  const controller = createFoundationController({ service });

  router.get('/health', healthValidators, controller.health);
  router.get('/health/ready', readinessValidators, asyncHandler(controller.readiness));
  router.get('/api/v1/meta', metaValidators, controller.meta);

  return router;
};

module.exports = { createFoundationRouter };
