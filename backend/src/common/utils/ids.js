/**
 * ID Utility
 * Generates sortable UUID identifiers.
 */

const crypto = require('crypto');

// Generate database identifier.
const createId = () => crypto.randomUUID();

// Validate UUID identifier.
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));

module.exports = { createId, isUuid };
