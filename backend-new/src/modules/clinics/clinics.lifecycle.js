/**
 * Clinics Lifecycle
 * Centralizes tenant lifecycle policy for auth, reads, writes, and recovery.
 */

const { ApiError } = require('../../common/errors/ApiError');
const { CLINIC_STATUS } = require('./clinics.constants');

// Checks whether a clinic record is visible for reads.
const canReadClinic = (clinic) => Boolean(clinic && !clinic.is_deleted);

// Checks whether a clinic record can accept tenant-owned writes.
const canWriteClinic = (clinic) => Boolean(canReadClinic(clinic) && clinic.status === CLINIC_STATUS.ACTIVE);

// Checks whether a user record has verified active tenant lifecycle data.
const canAuthenticateUserTenant = (user) => {
  if (!user) return false;
  if (!user.clinic_id) return true;
  return canWriteClinic(user.clinic);
};

// Throws when a clinic record is not read-visible.
const assertClinicReadable = (clinic, message = 'Clinic not found') => {
  if (!canReadClinic(clinic)) throw new ApiError(404, message);
  return clinic;
};

// Throws when a clinic record cannot accept tenant writes.
const assertClinicWritable = (clinic, message = 'Clinic is not writable') => {
  if (!canWriteClinic(clinic)) throw new ApiError(403, message);
  return clinic;
};

// Throws when a user cannot authenticate because of tenant lifecycle state.
const assertUserTenantCanAuthenticate = (user) => {
  if (!canAuthenticateUserTenant(user)) throw new ApiError(401, 'Authentication required');
  return user;
};

// Checks whether an archived clinic can be restored.
const requiresRecoveryPermission = ({ currentStatus, nextStatus }) => currentStatus === CLINIC_STATUS.ARCHIVED
  && nextStatus === CLINIC_STATUS.ACTIVE;

module.exports = {
  assertClinicReadable,
  assertClinicWritable,
  assertUserTenantCanAuthenticate,
  canAuthenticateUserTenant,
  canReadClinic,
  canWriteClinic,
  requiresRecoveryPermission,
};
