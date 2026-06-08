/**
 * Queue Repository
 * Handles atomic waiting-room persistence.
 */

const { prisma } = require('../../database/prisma');
const { createBaseRepository } = require('../../common/repositories/BaseRepository');
const { createId } = require('../../common/utils/ids');

const base = createBaseRepository({
  table: 'queue_entries',
  columns: ['id', 'clinic_id', 'patient_id', 'doctor_id', 'appointment_id', 'queue_date', 'token_number', 'priority', 'status', 'called_at', 'completed_at', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['doctor_id', 'patient_id', 'queue_date', 'status'],
});

// Get next token under transaction lock.
const nextToken = async (clinicId, queueDate, connection) => {
  const client = connection || prisma;
  const date = new Date(`${queueDate}T00:00:00.000Z`);
  const counter = await client.queue_counters.upsert({
    where: { clinic_id_queue_date: { clinic_id: clinicId, queue_date: date } },
    create: { id: createId(), clinic_id: clinicId, queue_date: date, next_token: 2 },
    update: { next_token: { increment: 1 } },
  });
  return counter.next_token - 1;
};

// Atomically call next patient.
const callNext = async (clinicId, doctorId, queueDate, userId, connection) => {
  const client = connection || prisma;
  const record = await client.queue_entries.findFirst({
    where: { clinic_id: clinicId, doctor_id: doctorId, queue_date: new Date(`${queueDate}T00:00:00.000Z`), status: 'WAITING', is_deleted: false },
    orderBy: [{ priority: 'desc' }, { token_number: 'asc' }],
    select: { id: true },
  });
  if (!record) return null;
  return base.updateById(record.id, clinicId, { status: 'CALLED', called_at: new Date(), updated_by: userId }, connection);
};

module.exports = { ...base, nextToken, callNext };
