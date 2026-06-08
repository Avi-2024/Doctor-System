/**
 * Token Utility
 * Hashes opaque authentication tokens.
 */

const crypto = require('crypto');

// Hash opaque token.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { hashToken };
