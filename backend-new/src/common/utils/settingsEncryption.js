/**
 * Settings Encryption
 * Encrypts sensitive settings values before persistence.
 */

const crypto = require('node:crypto');
const { ApiError } = require('../errors/ApiError');

const ALGORITHM = 'aes-256-gcm';
const ENVELOPE_VERSION = 1;
const IV_BYTES = 12;

// Checks whether a value is an encrypted settings envelope.
const isEncryptedEnvelope = (value) => Boolean(
  value
  && typeof value === 'object'
  && value.encrypted === true
  && value.algorithm === ALGORITHM
  && value.version === ENVELOPE_VERSION,
);

// Resolves and validates the configured settings encryption key.
const getSettingsEncryptionKey = () => {
  const encoded = process.env.SETTINGS_ENCRYPTION_KEY || '';
  if (!encoded) throw new ApiError(500, 'Settings encryption key is not configured', null, { expose: false });
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new ApiError(500, 'Settings encryption key is invalid', null, { expose: false });
  return key;
};

// Encrypts a JSON-compatible setting value.
const encryptSettingValue = (value) => {
  const key = getSettingsEncryptionKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    encrypted: true,
    algorithm: ALGORITHM,
    version: ENVELOPE_VERSION,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
};

// Decrypts an encrypted settings envelope.
const decryptSettingValue = (value) => {
  if (!isEncryptedEnvelope(value)) return value;
  const key = getSettingsEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(value.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext);
};

// Reduces an encrypted value to a safe audit/history placeholder.
const encryptedValueSummary = (value) => (isEncryptedEnvelope(value)
  ? { encrypted: true, algorithm: value.algorithm, version: value.version }
  : value);

module.exports = {
  decryptSettingValue,
  encryptedValueSummary,
  encryptSettingValue,
  isEncryptedEnvelope,
};
