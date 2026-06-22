/**
 * Users Repository
 * Owns Prisma access for Sprint 2 user read dependencies.
 */

const { prisma, model } = require('../../database/prisma');

const users = (connection) => model(connection || prisma, 'users');

const findUserById = async ({ userId, clinicId = null, isPlatform = false }, connection) => users(connection).findFirst({
  where: {
    id: userId,
    is_deleted: false,
    clinic_id: isPlatform ? null : clinicId,
  },
});

module.exports = { findUserById };
