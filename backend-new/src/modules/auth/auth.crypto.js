/**
 * Auth Crypto Helpers
 * Owns password hashing and opaque token hashing for Phase 02.
 */

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const PASSWORD_COST = 12;

const hashPassword = async (password) => bcrypt.hash(password, PASSWORD_COST);

const verifyPassword = async (password, passwordHash) => bcrypt.compare(password, passwordHash);

const createOpaqueToken = () => crypto.randomBytes(48).toString('base64url');

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

module.exports = {
  PASSWORD_COST,
  createOpaqueToken,
  hashPassword,
  hashToken,
  verifyPassword,
};
