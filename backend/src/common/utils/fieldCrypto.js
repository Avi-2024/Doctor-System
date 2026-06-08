/**
 * Field Crypto Utility
 * Encrypts and decrypts JSON settings.
 */

const crypto = require('crypto');
const { env } = require('../../config/env');
const { ApiError } = require('../errors/ApiError');

// Read encryption key.
const getKey = () => {
  if (!env.SETTINGS_ENCRYPTION_KEY || Buffer.byteLength(env.SETTINGS_ENCRYPTION_KEY, 'utf8') < 32) throw new ApiError(500, 'Settings encryption key is not configured');
  return crypto.createHash('sha256').update(env.SETTINGS_ENCRYPTION_KEY).digest();
};

// Encrypt JSON-compatible value.
const encryptJson = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { encrypted: true, algorithm: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
};

// Decrypt JSON-compatible value.
const decryptJson = (value) => {
  if (!value?.encrypted) return value;
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(value.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(value.ciphertext, 'base64')), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
};

module.exports = { encryptJson, decryptJson };
