/**
 * Resource Repository
 * Creates reusable tenant persistence adapters.
 */

const { createBaseRepository } = require('../repositories/BaseRepository');

// Create resource repository.
const createResourceRepository = (config) => createBaseRepository(config);

module.exports = { createResourceRepository };
