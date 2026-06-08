/**
 * Unit Of Work Repository
 * Exposes database transaction boundaries.
 */

const { transaction } = require('../../database/prisma');

// Execute work inside transaction.
const runInTransaction = async (callback) => transaction(callback);

module.exports = { runInTransaction };
