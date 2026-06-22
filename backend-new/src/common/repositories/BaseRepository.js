/**
 * Base Repository
 * Provides explicit tenant-scope guards for future business repositories.
 */

const { prisma, model } = require('../../database/prisma');
const { ApiError } = require('../errors/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { pickFilters, resolveSort, sanitizeSearch } = require('../utils/sanitizeQuery');

const identifierPattern = /^[a-z_][a-z0-9_]*$/i;

const safeIdentifier = (value) => {
  if (!identifierPattern.test(value)) throw new Error(`Unsafe model identifier: ${value}`);
  return value;
};

const requireClinicContext = (context) => {
  if (!context?.clinicId || typeof context.clinicId !== 'string') {
    throw new ApiError(403, 'Clinic context required for tenant-owned repository operations');
  }
  return context.clinicId;
};

const requirePlatformContext = (context) => {
  if (!context?.isPlatform) throw new ApiError(403, 'Platform context required for global repository operations');
  return context;
};

const omitUndefined = (payload) => Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const createBaseRepository = ({
  modelName,
  tenantOwned = true,
  softDelete = false,
  searchable = [],
  filterable = [],
  sortable = ['created_at'],
}) => {
  safeIdentifier(modelName);

  const delegateFor = (connection) => model(connection || prisma, modelName);

  const repositoryScope = (context) => {
    if (tenantOwned) return { clinic_id: requireClinicContext(context) };
    requirePlatformContext(context);
    return {};
  };

  const scopedWhere = (context, where = {}) => ({
    ...where,
    ...repositoryScope(context),
    ...(softDelete ? { is_deleted: false } : {}),
  });

  const findById = async (id, context, connection) => {
    return delegateFor(connection).findFirst({ where: scopedWhere(context, { id }) });
  };

  const create = async (payload, context, connection) => {
    const data = omitUndefined({
      ...payload,
      ...repositoryScope(context),
    });
    return delegateFor(connection).create({ data });
  };

  const updateById = async (id, context, payload, connection) => {
    const where = scopedWhere(context, { id });
    const data = omitUndefined({
      ...payload,
      id: undefined,
      clinic_id: undefined,
      created_at: undefined,
      created_by: undefined,
      is_deleted: undefined,
      deleted_at: undefined,
      deleted_by: undefined,
    });
    await delegateFor(connection).updateMany({ where, data });
    return findById(id, context, connection);
  };

  const softDeleteById = async (id, context, userId, connection) => {
    if (!softDelete) throw new ApiError(400, 'Soft delete is not enabled for this repository');
    await delegateFor(connection).updateMany({
      where: scopedWhere(context, { id }),
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: userId || null },
    });
    return { id, is_deleted: true };
  };

  const list = async (context, query = {}, connection) => {
    const { page, limit, offset } = getPagination(query);
    const { sortBy, sortOrder } = resolveSort(query, sortable);
    const where = scopedWhere(context, pickFilters(query, filterable));
    if (query.search && searchable.length) {
      const search = sanitizeSearch(query.search);
      where.OR = searchable.map((field) => ({ [field]: { contains: search } }));
    }
    const delegate = delegateFor(connection);
    const [items, total] = await Promise.all([
      delegate.findMany({ where, orderBy: { [sortBy]: sortOrder }, take: limit, skip: offset }),
      delegate.count({ where }),
    ]);
    return { items, meta: buildMeta({ page, limit, total }) };
  };

  return { create, findById, updateById, softDelete: softDeleteById, list };
};

module.exports = { createBaseRepository, requireClinicContext, requirePlatformContext, safeIdentifier };
