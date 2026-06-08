/**
 * Reference Repository
 * Reads tenant-scoped referenced records.
 */

const { prisma, model } = require('../../database/prisma');
const { safeIdentifier } = require('./BaseRepository');

// Find accessible referenced record.
const findAccessible = async ({ id, clinicId, config }, connection) => {
  safeIdentifier(config.table);
  const where = { id, is_deleted: false, ...(config.global ? { clinic_id: null } : { clinic_id: clinicId }) };
  if (config.where?.includes("role = 'DOCTOR'")) where.role = 'DOCTOR';
  if (config.where?.includes('is_active = TRUE')) where.is_active = true;
  return model(connection || prisma, config.table).findFirst({ where, select: { id: true } });
};

module.exports = { findAccessible };
