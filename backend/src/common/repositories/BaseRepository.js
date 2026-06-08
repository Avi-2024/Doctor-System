/**
 * Base Repository
 * Provides tenant-safe MySQL persistence.
 */

const { prisma, model } = require('../../database/prisma');
const { createId } = require('../utils/ids');
const { getPagination, buildMeta } = require('../utils/pagination');
const { sanitizeSearch, pickFilters } = require('../utils/sanitizeQuery');

const identifierPattern = /^[a-z_][a-z0-9_]*$/i;

// Require safe SQL identifier.
const safeIdentifier = (value) => {
  if (!identifierPattern.test(value)) throw new Error(`Unsafe SQL identifier: ${value}`);
  return `\`${value}\``;
};

// Resolve active Prisma delegate.
const delegateFor = (table, connection) => model(connection || prisma, table);

// Build searchable OR conditions.
const buildSearch = (searchable, search) => {
  const value = sanitizeSearch(search);
  return searchable.map((field) => ({ [field]: { contains: value } }));
};

// Pick persisted repository data.
const pickData = (payload, allowedColumns, blocked = []) => {
  const blockedSet = new Set(blocked);
  return Object.fromEntries(Object.entries(payload).filter(([key]) => allowedColumns.has(key) && !blockedSet.has(key)));
};

// Build tenant repository.
const createBaseRepository = ({ table, columns, searchable = [], filterable = [], sortable = ['created_at'] }) => {
  safeIdentifier(table);
  const allowedColumns = new Set(columns);

  // Create record.
  const create = async (payload, connection) => {
    const data = pickData({ ...payload, id: payload.id || createId() }, allowedColumns);
    await delegateFor(table, connection).create({ data });
    return findById(data.id, data.clinic_id, connection);
  };

  // Find record by tenant.
  const findById = async (id, clinicId, connection) => {
    return delegateFor(table, connection).findFirst({ where: { id, clinic_id: clinicId || null, is_deleted: false } });
  };

  // Find record without tenant scope.
  const findByIdAny = async (id, connection) => {
    return delegateFor(table, connection).findFirst({ where: { id, is_deleted: false } });
  };

  // Update record by tenant.
  const updateById = async (id, clinicId, payload, connection) => {
    const data = pickData(payload, allowedColumns, ['id', 'clinic_id', 'created_by', 'created_at', 'is_deleted']);
    if (!Object.keys(data).length) return findById(id, clinicId, connection);
    await delegateFor(table, connection).updateMany({ where: { id, clinic_id: clinicId || null, is_deleted: false }, data });
    return findById(id, clinicId, connection);
  };

  // Soft delete record.
  const softDelete = async (id, clinicId, userId, connection) => {
    await delegateFor(table, connection).updateMany({ where: { id, clinic_id: clinicId || null, is_deleted: false }, data: { is_deleted: true, updated_by: userId } });
    return { id, is_deleted: true };
  };

  // List tenant records.
  const list = async (clinicId, requestQuery = {}, connection) => {
    const { page, limit, offset } = getPagination(requestQuery);
    const where = { clinic_id: clinicId || null, is_deleted: false, ...pickFilters(requestQuery, filterable) };
    if (requestQuery.search && searchable.length) where.OR = buildSearch(searchable, requestQuery.search);
    const sortBy = sortable.includes(requestQuery.sortBy) ? requestQuery.sortBy : 'created_at';
    const sortOrder = String(requestQuery.sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const delegate = delegateFor(table, connection);
    const [items, total] = await Promise.all([
      delegate.findMany({ where, orderBy: { [sortBy]: sortOrder.toLowerCase() }, take: limit, skip: offset }),
      delegate.count({ where }),
    ]);
    return { items, meta: buildMeta({ page, limit, total }) };
  };

  // List records without tenant scope.
  const listAll = async (requestQuery = {}, connection) => {
    const { page, limit, offset } = getPagination(requestQuery);
    const where = { is_deleted: false, ...pickFilters(requestQuery, filterable) };
    if (requestQuery.search && searchable.length) where.OR = buildSearch(searchable, requestQuery.search);
    const sortBy = sortable.includes(requestQuery.sortBy) ? requestQuery.sortBy : 'created_at';
    const sortOrder = String(requestQuery.sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const delegate = delegateFor(table, connection);
    const [items, total] = await Promise.all([
      delegate.findMany({ where, orderBy: { [sortBy]: sortOrder.toLowerCase() }, take: limit, skip: offset }),
      delegate.count({ where }),
    ]);
    return { items, meta: buildMeta({ page, limit, total }) };
  };

  return { create, findById, findByIdAny, updateById, softDelete, list, listAll };
};

module.exports = { createBaseRepository, safeIdentifier };
