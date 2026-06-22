/**
 * Foundation Repository
 * Wraps infrastructure checks so controllers and services do not call Prisma directly.
 */

const createFoundationRepository = ({ readinessPing }) => ({
  checkReadiness: async () => readinessPing(),
});

module.exports = { createFoundationRepository };
