/**
 * Reference Service
 * Validates cross-table tenant ownership.
 */

const { ApiError } = require('../errors/ApiError');
const repository = require('../repositories/reference.repository');

// Validate tenant-scoped references.
const validateReferences = async (payload, clinicId, references = {}, connection) => {
  for (const [field, configValue] of Object.entries(references)) {
    const value = payload[field];
    if (!value) continue;
    const config = typeof configValue === 'string' ? { table: configValue } : configValue;
    const record = await repository.findAccessible({ id: value, clinicId, config }, connection);
    if (!record) throw new ApiError(422, `${field} does not reference an accessible record`);
  }
};

module.exports = { validateReferences };
