/**
 * Foundation Service
 * Builds Phase 01 health, readiness, and metadata payloads.
 */

const { env } = require('../../config/env');

const createFoundationService = ({ repository }) => ({
  getHealth: (context = {}) => ({
    service: env.APP_NAME,
    requestId: context.requestId,
  }),

  getMeta: (context = {}) => ({
    name: env.APP_NAME,
    version: 'v1',
    phase: 'foundation',
    requestId: context.requestId,
  }),

  getReadiness: async () => {
    await repository.checkReadiness();
    return { database: 'mysql' };
  },
});

module.exports = { createFoundationService };
