/**
 * Clinics Repository
 * Persists clinic onboarding records.
 */

const { prisma } = require('../../database/prisma');
const { createBaseRepository } = require('../../common/repositories/BaseRepository');

const base = createBaseRepository({
  table: 'clinics',
  columns: ['id', 'clinic_id', 'name', 'code', 'status', 'contact', 'address', 'branding', 'timezone', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['name', 'code'],
  filterable: ['status'],
  jsonFields: ['contact', 'address', 'branding'],
});

// Find clinic by code.
const findByCode = async (code, connection) => {
  return (connection || prisma).clinics.findFirst({ where: { code, is_deleted: false } });
};

// Create clinic.
const createClinic = async (clinic, connection) => {
  await (connection || prisma).clinics.create({
    data: {
      id: clinic.id,
      clinic_id: clinic.id,
      name: clinic.name,
      code: clinic.code,
      contact: JSON.parse(clinic.contact),
      address: JSON.parse(clinic.address),
      branding: JSON.parse(clinic.branding),
      timezone: clinic.timezone,
    },
  });
};

// Create clinic owner.
const createOwner = async (owner, connection) => {
  await (connection || prisma).users.create({
    data: {
      id: owner.id,
      clinic_id: owner.clinicId,
      full_name: owner.fullName,
      email: owner.email,
      phone: owner.phone,
      password_hash: owner.passwordHash,
      role: 'CLINIC_OWNER',
      permissions: JSON.parse(owner.permissions),
      created_by: owner.id,
      updated_by: owner.id,
    },
  });
};

// Create default clinic trial.
const createDefaultTrial = async ({ id, clinicId, ownerId }, connection) => {
  await (connection || prisma).clinic_subscriptions.create({
    data: {
      id,
      clinic_id: clinicId,
      plan_id: '00000000-0000-4000-8000-000000000001',
      status: 'TRIAL',
      starts_at: new Date(),
      ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      usage_data: {},
      created_by: ownerId,
      updated_by: ownerId,
    },
  });
};

module.exports = { ...base, findByCode, createClinic, createOwner, createDefaultTrial };
