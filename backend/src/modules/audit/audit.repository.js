/**
 * Audit Repository
 * Persists immutable audit events.
 */

const { prisma } = require('../../database/prisma');

// Create audit event.
const create = async (event, connection) => (connection || prisma).audit_logs.create({
  data: {
    id: event.id,
    clinic_id: event.clinicId,
    actor_user_id: event.actorUserId,
    action: event.action,
    module_name: event.moduleName,
    entity_type: event.entityType,
    entity_id: event.entityId,
    request_id: event.requestId,
    before_data: event.beforeData,
    after_data: event.afterData,
    metadata: event.metadata,
  },
});

module.exports = { create };
