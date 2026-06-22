/**
 * RBAC Constants
 * Defines permission catalog, system roles, and scope precedence.
 */

const RBAC_SCOPE = Object.freeze({
  OWN: 'OWN',
  ASSIGNED: 'ASSIGNED',
  BRANCH: 'BRANCH',
  CLINIC: 'CLINIC',
  ALL: 'ALL',
});

const SCOPE_RANK = Object.freeze({
  [RBAC_SCOPE.OWN]: 1,
  [RBAC_SCOPE.ASSIGNED]: 2,
  [RBAC_SCOPE.BRANCH]: 3,
  [RBAC_SCOPE.CLINIC]: 4,
  [RBAC_SCOPE.ALL]: 5,
});

const ROLE_SCOPE_KEY = Object.freeze({
  PLATFORM: 'PLATFORM',
  SYSTEM: 'SYSTEM',
});

const PERMISSION_CATALOG = Object.freeze([
  {
    key: 'rbac.permissions.read',
    moduleName: 'rbac',
    action: 'permissions.read',
    description: 'Read permission catalog',
  },
  {
    key: 'rbac.roles.read',
    moduleName: 'rbac',
    action: 'roles.read',
    description: 'Read roles available to the current scope',
  },
  {
    key: 'rbac.roles.create',
    moduleName: 'rbac',
    action: 'roles.create',
    description: 'Create custom roles',
  },
  {
    key: 'rbac.user_roles.assign',
    moduleName: 'rbac',
    action: 'user_roles.assign',
    description: 'Assign roles to users',
  },
  {
    key: 'rbac.user_roles.revoke',
    moduleName: 'rbac',
    action: 'user_roles.revoke',
    description: 'Revoke role assignments from users',
  },
  {
    key: 'users.me.read',
    moduleName: 'users',
    action: 'me.read',
    description: 'Read current user profile and effective access',
  },
]);

const SYSTEM_ROLES = Object.freeze([
  {
    code: 'super_admin',
    name: 'Super Admin',
    description: 'Platform administrator role template',
    isPlatform: true,
    permissions: PERMISSION_CATALOG.map((permission) => ({ key: permission.key, scope: RBAC_SCOPE.ALL })),
  },
  {
    code: 'clinic_admin',
    name: 'Clinic Admin',
    description: 'Clinic administrator role template',
    isPlatform: false,
    permissions: PERMISSION_CATALOG.map((permission) => ({ key: permission.key, scope: RBAC_SCOPE.CLINIC })),
  },
  {
    code: 'doctor',
    name: 'Doctor',
    description: 'Doctor role template for authenticated workspace access',
    isPlatform: false,
    permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }],
  },
  {
    code: 'receptionist',
    name: 'Receptionist',
    description: 'Reception role template for authenticated workspace access',
    isPlatform: false,
    permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }],
  },
]);

module.exports = {
  PERMISSION_CATALOG,
  RBAC_SCOPE,
  ROLE_SCOPE_KEY,
  SCOPE_RANK,
  SYSTEM_ROLES,
};
