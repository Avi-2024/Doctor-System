/**
 * PHI Encryption
 * Encrypts protected health information JSON values before persistence.
 */

const crypto = require('node:crypto');
const { ApiError } = require('../errors/ApiError');

const ALGORITHM = 'aes-256-gcm';
const ENVELOPE_VERSION = 1;
const IV_BYTES = 12;

// Checks whether a value is an encrypted PHI envelope.
const isPhiEncryptedEnvelope = (value) => Boolean(
  value
  && typeof value === 'object'
  && value.encrypted === true
  && value.purpose === 'phi'
  && value.algorithm === ALGORITHM
  && value.version === ENVELOPE_VERSION,
);

// Resolves and validates the configured PHI encryption key.
const getPhiEncryptionKey = () => {
  const encoded = process.env.PHI_ENCRYPTION_KEY || '';
  if (!encoded) throw new ApiError(500, 'PHI encryption key is not configured', null, { expose: false });
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new ApiError(500, 'PHI encryption key is invalid', null, { expose: false });
  return key;
};

// Encrypts a JSON-compatible PHI value.
const encryptPhiValue = (value) => {
  if (value === null || value === undefined) return null;
  if (isPhiEncryptedEnvelope(value)) return value;
  const key = getPhiEncryptionKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    encrypted: true,
    purpose: 'phi',
    algorithm: ALGORITHM,
    version: ENVELOPE_VERSION,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
};

// Decrypts an encrypted PHI envelope.
const decryptPhiValue = (value) => {
  if (!isPhiEncryptedEnvelope(value)) return value;
  const key = getPhiEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(value.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext);
};

// Reduces encrypted PHI to a safe audit placeholder.
const phiValueSummary = (value) => (isPhiEncryptedEnvelope(value)
  ? { encrypted: true, purpose: value.purpose, algorithm: value.algorithm, version: value.version }
  : value);

module.exports = {
  decryptPhiValue,
  encryptPhiValue,
  getPhiEncryptionKey,
  isPhiEncryptedEnvelope,
  phiValueSummary,
};
