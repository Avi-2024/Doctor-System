/**
 * Pagination Utility
 * Normalizes list pagination inputs.
 */

// Build pagination values.
const getPagination = (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

// Build pagination metadata.
const buildMeta = ({ page, limit, total }) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });

module.exports = { getPagination, buildMeta };
