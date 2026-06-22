/**
 * Unit Of Work Repository
 * Exposes service-owned database transaction boundaries.
 */

const prismaDatabase = require('../../database/prisma');

const runInTransaction = async (callback, options) => prismaDatabase.transaction(callback, options);

module.exports = { runInTransaction };
