/**
 * Auth Token Helpers
 * Signs and verifies JWT access and refresh tokens without embedding permissions or PHI.
 */

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { TOKEN_TTL_SECONDS } = require('./auth.constants');

const requiredSecret = (secret, name) => {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error(`${name} must be at least 32 characters`);
  return secret;
};

const baseJwtOptions = (expiresIn) => ({
  algorithm: 'HS256',
  expiresIn,
});

const signAccessToken = ({
  userId,
  clinicId = null,
  sessionId,
  tokenVersion,
}, secret, options = {}) => jwt.sign({
  sub: userId,
  userId,
  clinicId,
  sessionId,
  tokenVersion,
}, requiredSecret(secret, 'access token secret'), baseJwtOptions(options.expiresIn || TOKEN_TTL_SECONDS.ACCESS));

const signRefreshToken = ({
  userId,
  sessionId,
  tokenId = crypto.randomUUID(),
}, secret, options = {}) => jwt.sign({
  sub: userId,
  sessionId,
  tokenId,
}, requiredSecret(secret, 'refresh token secret'), baseJwtOptions(options.expiresIn || TOKEN_TTL_SECONDS.REFRESH));

const verifyToken = (token, secret, secretName = 'token secret') => jwt.verify(token, requiredSecret(secret, secretName), {
  algorithms: ['HS256'],
});

module.exports = {
  requiredSecret,
  signAccessToken,
  signRefreshToken,
  verifyToken,
};
