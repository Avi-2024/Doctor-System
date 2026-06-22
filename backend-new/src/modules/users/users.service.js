/**
 * Users Service
 * Provides Sprint 2 current-user profile behavior.
 */

const { ApiError } = require('../../common/errors/ApiError');
const defaultRepository = require('./users.repository');

const sanitizeUser = (user) => user ? ({
  id: user.id,
  clinicId: user.clinic_id || null,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone || null,
  userType: user.user_type,
  status: user.status,
  lastLoginAt: user.last_login_at || null,
}) : null;

const createUsersService = ({ repository = defaultRepository } = {}) => {
  const getCurrentUser = async ({ context }) => {
    const user = await repository.findUserById({
      userId: context.userId,
      clinicId: context.clinicId || null,
      isPlatform: Boolean(context.isPlatform),
    });
    if (!user) throw new ApiError(404, 'User not found');
    if (!context.isPlatform && user.clinic_id !== context.clinicId) throw new ApiError(403, 'Tenant ownership mismatch');
    return {
      user: sanitizeUser(user),
      access: {
        roles: context.roles || [],
        permissions: context.permissions || [],
        scopedPermissions: context.scopedPermissions || {},
        isPlatform: Boolean(context.isPlatform),
      },
    };
  };

  return { getCurrentUser };
};

module.exports = { createUsersService, sanitizeUser };
