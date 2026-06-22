/**
 * Query Sanitization Utilities
 * Provides safe search/filter/sort inputs for repositories.
 */

const sanitizeSearch = (value) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().replace(/\s+/g, ' ').toLowerCase();

const pickFilters = (query = {}, allowed = []) => {
  const allowedSet = new Set(allowed);
  return Object.fromEntries(Object.entries(query).filter(([key, value]) => allowedSet.has(key) && value !== undefined && value !== ''));
};

const resolveSort = (query = {}, allowed = ['created_at']) => {
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : allowed[0];
  const sortOrder = String(query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
  return { sortBy, sortOrder };
};

module.exports = { sanitizeSearch, pickFilters, resolveSort };
