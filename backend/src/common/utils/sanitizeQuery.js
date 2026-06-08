/**
 * Query Sanitization Utility
 * Normalizes untrusted list query values.
 */

// Sanitize search query.
const sanitizeSearch = (value, maximumLength = 200) => String(value || '')
  .replace(/[\u0000-\u001f\u007f]/g, '')
  .trim()
  .slice(0, maximumLength)
  .toLowerCase();

// Pick allowlisted filters.
const pickFilters = (query, fields) => Object.fromEntries(
  fields.filter((field) => query[field] !== undefined && query[field] !== '').map((field) => [field, query[field]]),
);

module.exports = { sanitizeSearch, pickFilters };
