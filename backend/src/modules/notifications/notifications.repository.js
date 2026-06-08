/**
 * Notifications Repository
 * Persists tenant notification records.
 */

const { createBaseRepository } = require('../../common/repositories/BaseRepository');

const repository = createBaseRepository({
  table: 'notifications',
  columns: ['id', 'clinic_id', 'channel', 'recipient', 'message', 'payload', 'status', 'scheduled_for', 'provider_message_id', 'attempts', 'last_error', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['recipient', 'message'],
  filterable: ['channel', 'status'],
  jsonFields: ['payload'],
});

module.exports = repository;
