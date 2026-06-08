/**
 * Clinics Service
 * Handles transactional clinic onboarding.
 */

const bcrypt = require('bcryptjs');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { ApiError } = require('../../common/errors/ApiError');
const { createId } = require('../../common/utils/ids');
const repository = require('./clinics.repository');

// Onboard clinic and owner.
const onboard = async ({ clinic, owner }) => runInTransaction(async (connection) => {
  const code = clinic.code.toUpperCase();
  if (await repository.findByCode(code, connection)) throw new ApiError(409, 'Clinic code already exists');
  const clinicId = createId();
  const ownerId = createId();
  await repository.createClinic({
    id: clinicId,
    name: clinic.name,
    code,
    contact: JSON.stringify(clinic.contact || {}),
    address: JSON.stringify(clinic.address || {}),
    branding: JSON.stringify(clinic.branding || {}),
    timezone: clinic.timezone || 'Asia/Kolkata',
  }, connection);
  await repository.createOwner({
    id: ownerId,
    clinicId,
    fullName: owner.fullName,
    email: owner.email.toLowerCase(),
    phone: owner.phone || null,
    passwordHash: await bcrypt.hash(owner.password, 12),
    permissions: JSON.stringify(['*']),
  }, connection);
  await repository.createDefaultTrial({ id: createId(), clinicId, ownerId }, connection);
  return { clinic: { id: clinicId, name: clinic.name, code }, owner: { id: ownerId, clinicId, fullName: owner.fullName, email: owner.email, role: 'CLINIC_OWNER' } };
});

// Update clinic profile.
const updateProfile = async (payload, context) => {
  if (!context.clinicId) throw new ApiError(400, 'clinicId is required');
  const before = await repository.findById(context.clinicId, context.clinicId);
  if (!before) throw new ApiError(404, 'Clinic not found');
  const clinic = await repository.updateById(context.clinicId, context.clinicId, {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.contact !== undefined ? { contact: payload.contact } : {}),
    ...(payload.address !== undefined ? { address: payload.address } : {}),
    ...(payload.branding !== undefined ? { branding: payload.branding } : {}),
    ...(payload.timezone !== undefined ? { timezone: payload.timezone } : {}),
    updated_by: context.userId,
  });
  return { before, clinic };
};

// Update clinic status.
const updateStatus = async (id, status, context) => {
  const before = await repository.findById(id, id);
  if (!before) throw new ApiError(404, 'Clinic not found');
  const clinic = await repository.updateById(id, id, { status, updated_by: context.userId });
  return { before, clinic };
};

// Soft delete clinic.
const deleteClinic = async (id, context) => {
  const before = await repository.findById(id, id);
  if (!before) throw new ApiError(404, 'Clinic not found');
  await repository.softDelete(id, id, context.userId);
  return before;
};

module.exports = { onboard, updateProfile, updateStatus, deleteClinic };
