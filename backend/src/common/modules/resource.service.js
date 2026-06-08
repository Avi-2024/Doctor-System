/**
 * Resource Service
 * Handles reusable tenant CRUD business rules.
 */

const { ApiError } = require('../errors/ApiError');
const { validateReferences } = require('../services/reference.service');
const { recordAudit } = require('../../modules/audit/audit.service');
const { runInTransaction } = require('../repositories/unitOfWork.repository');
const { assertUsageAvailable } = require('../../modules/subscriptions/subscriptions.service');

const immutableFields = new Set(['id', 'clinic_id', 'created_by', 'created_at', 'updated_at', 'is_deleted']);

// Pick allowlisted fields.
const pick = (payload, fields) => Object.fromEntries(
  Object.entries(payload).filter(([key]) => fields.includes(key) && !immutableFields.has(key)),
);

// Create resource service.
const createResourceService = (config, repository) => {
  // Prepare write payload.
  const prepareWrite = async (payload, context, connection, current) => (config.prepareWrite ? config.prepareWrite(payload, context, connection, current) : payload);

  // Prepare read payload.
  const prepareRead = async (record, context) => (config.prepareRead && record ? config.prepareRead(record, context) : record);

  // Resolve tenant identifier.
  const resolveClinicId = (context) => {
    const clinicId = context.tenant.clinicId;
    if (!clinicId && !config.platformOnly && !(config.platformListAll && context.tenant.isPlatform)) throw new ApiError(400, 'clinicId is required');
    return config.platformOnly ? null : clinicId;
  };

  // Create resource.
  const create = async (payload, context) => {
    const clinicId = resolveClinicId(context);
    return runInTransaction(async (connection) => {
      if (config.usageMetric) await assertUsageAvailable({ clinicId, metric: config.usageMetric, connection });
      await validateReferences(payload, clinicId, config.references, connection);
      const prepared = await prepareWrite(payload, context, connection);
      const record = await repository.create({
        ...pick(prepared, config.columns),
        clinic_id: clinicId,
        created_by: context.auth.userId,
        updated_by: context.auth.userId,
      }, connection);
      await recordAudit({ req: context.req, clinicId, action: 'CREATE', moduleName: config.name, entityType: config.name, entityId: record.id, after: record }, connection);
      return prepareRead(record, context);
    });
  };

  // List resources.
  const list = async (filters, context) => {
    const clinicId = resolveClinicId(context);
    const result = config.platformListAll && context.tenant.isPlatform && !clinicId ? await repository.listAll(filters) : await repository.list(clinicId, filters);
    return { ...result, items: await Promise.all(result.items.map((item) => prepareRead(item, context))) };
  };

  // Get resource.
  const getById = async (id, context) => {
    const clinicId = resolveClinicId(context);
    const record = config.platformListAll && context.tenant.isPlatform && !clinicId
      ? await repository.findByIdAny(id)
      : await repository.findById(id, clinicId);
    if (!record) throw new ApiError(404, `${config.name} not found`);
    return prepareRead(record, context);
  };

  // Update resource.
  const updateById = async (id, payload, context) => runInTransaction(async (connection) => {
    const clinicId = resolveClinicId(context);
    const before = await repository.findById(id, clinicId, connection);
    if (!before) throw new ApiError(404, `${config.name} not found`);
    const prepared = await prepareWrite(payload, context, connection, before);
    await validateReferences(prepared, clinicId, config.references, connection);
    const record = await repository.updateById(id, clinicId, {
      ...pick(prepared, config.columns),
      updated_by: context.auth.userId,
    }, connection);
    await recordAudit({ req: context.req, clinicId, action: 'UPDATE', moduleName: config.name, entityType: config.name, entityId: record.id, before, after: record }, connection);
    return prepareRead(record, context);
  });

  // Soft delete resource.
  const removeById = async (id, context) => runInTransaction(async (connection) => {
    const clinicId = resolveClinicId(context);
    const before = await repository.findById(id, clinicId, connection);
    if (!before) throw new ApiError(404, `${config.name} not found`);
    const record = await repository.softDelete(id, clinicId, context.auth.userId, connection);
    await recordAudit({ req: context.req, clinicId, action: 'SOFT_DELETE', moduleName: config.name, entityType: config.name, entityId: id, before, after: record }, connection);
    return record;
  });

  return { create, list, getById, updateById, removeById };
};

module.exports = { createResourceService };
