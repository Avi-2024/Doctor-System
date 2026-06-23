/**
 * Auth Service
 * Implements Sprint 1 login, refresh rotation, logout, and current-user behavior.
 */

const crypto = require('node:crypto');
const { ApiError } = require('../../common/errors/ApiError');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { env } = require('../../config/env');
const { recordAudit } = require('../audit/audit.service');
const { canAuthenticateUserTenant } = require('../clinics/clinics.lifecycle');
const { SESSION_STATUS, USER_STATUS, USER_TYPE } = require('./auth.constants');
const { hashToken, verifyPassword } = require('./auth.crypto');
const { signAccessToken, signRefreshToken, verifyToken } = require('./auth.tokens');
const defaultRepository = require('./auth.repository');

const AUTH_ACTION = Object.freeze({
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  LOGIN_LOCKOUT_CREATED: 'auth.login.lockout_created',
  REFRESH: 'auth.refresh',
  LOGOUT: 'auth.logout',
  TOKEN_REUSE: 'auth.refresh.reuse_detected',
});

const addSeconds = (date, seconds) => new Date(date.getTime() + (seconds * 1000));

const normalizeUser = (user) => user ? ({
  id: user.id,
  clinicId: user.clinic_id || null,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone || null,
  userType: user.user_type,
  status: user.status,
}) : null;

const isPlatformUser = (user) => user?.user_type === USER_TYPE.SUPER_ADMIN && !user?.clinic_id;
const sameClinic = (left = null, right = null) => (left || null) === (right || null);

// Checks whether a user's tenant is allowed to authenticate.
const clinicAllowsAuth = (user) => isPlatformUser(user) || canAuthenticateUserTenant(user);

const createAuthService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
  permissionResolver = null,
} = {}) => {
  const audit = async (input, connection) => auditRecorder(input, connection);

  const loginKey = ({ email, clinicId = null, context = {} }) => ({
    email,
    clinicId: clinicId || null,
    ipAddress: context?.ipAddress || 'unknown',
  });

  const buildAccessToken = (user, sessionId) => signAccessToken({
    userId: user.id,
    clinicId: user.clinic_id || null,
    sessionId,
    tokenVersion: user.token_version,
  }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL_SECONDS });

  const buildRefreshToken = ({ user, sessionId, tokenId }) => signRefreshToken({
    userId: user.id,
    sessionId,
    tokenId,
  }, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL_SECONDS });

  const createTokenPair = async ({ user, sessionId = crypto.randomUUID(), connection, context }) => {
    const now = new Date();
    const refreshTokenId = crypto.randomUUID();
    const accessToken = buildAccessToken(user, sessionId);
    const refreshToken = buildRefreshToken({ user, sessionId, tokenId: refreshTokenId });
    const refreshTokenRecord = await repository.createRefreshToken({
      id: refreshTokenId,
      clinic_id: user.clinic_id || null,
      user_id: user.id,
      session_id: sessionId,
      token_hash: hashToken(refreshToken),
      ip_address: context?.ipAddress || null,
      user_agent: context?.userAgent || null,
      status: SESSION_STATUS.ACTIVE,
      expires_at: addSeconds(now, env.REFRESH_TOKEN_TTL_SECONDS),
      last_used_at: now,
    }, connection);

    return { accessToken, refreshToken, refreshTokenRecord, sessionId };
  };

  const recordAttempt = async ({ email, clinicId, user, success, failureReason, context }, connection) => repository.recordLoginAttempt({
    id: crypto.randomUUID(),
    clinic_id: clinicId || user?.clinic_id || null,
    email: repository.sanitizeEmail(email),
    user_id: user?.id || null,
    ip_address: context?.ipAddress || 'unknown',
    user_agent: context?.userAgent || null,
    success,
    failure_reason: failureReason || null,
  }, connection);

  const createLockoutIfThresholdExceeded = async ({ email, clinicId, user, context }, connection) => {
    const now = new Date();
    const key = loginKey({ email, clinicId, context });
    const since = new Date(now.getTime() - env.AUTH_LOCKOUT_WINDOW_MS);
    const failedCount = await repository.countRecentFailedLoginAttempts({ ...key, since }, connection);
    if (failedCount < env.AUTH_LOCKOUT_MAX_FAILURES) return null;

    const existing = await repository.findActiveAccountLockout({ ...key, now }, connection);
    if (existing) return existing;

    const lockout = await repository.createAccountLockout({
      id: crypto.randomUUID(),
      clinic_id: key.clinicId,
      user_id: user?.id || null,
      email: repository.sanitizeEmail(email),
      ip_address: key.ipAddress,
      reason: 'TOO_MANY_FAILED_LOGINS',
      locked_until: new Date(now.getTime() + env.AUTH_LOCKOUT_DURATION_MS),
    }, connection);

    await audit({
      context: user ? { ...context, userId: user.id, clinicId: user.clinic_id || null } : context,
      action: AUTH_ACTION.LOGIN_LOCKOUT_CREATED,
      moduleName: 'auth',
      resourceType: 'account_lockout',
      resourceId: lockout.id,
      metadata: {
        clinicId: key.clinicId,
        email: repository.sanitizeEmail(email),
        failureCount: failedCount,
        lockedUntil: lockout.locked_until,
      },
    }, connection);

    return lockout;
  };

  const failLogin = async ({
    clinicId,
    countForLockout = false,
    context,
    email,
    failureReason,
    message = 'Invalid credentials',
    metadata = {},
    statusCode = 401,
    user = null,
  }) => {
    await transaction(async (tx) => {
      await recordAttempt({ email, clinicId, user, success: false, failureReason, context }, tx);
      if (countForLockout) await createLockoutIfThresholdExceeded({ email, clinicId, user, context }, tx);
      await audit({
        context: user ? { ...context, userId: user.id, clinicId: user.clinic_id || null } : context,
        action: AUTH_ACTION.LOGIN_FAILURE,
        moduleName: 'auth',
        resourceType: 'user',
        resourceId: user?.id || null,
        metadata,
      }, tx);
    });
    throw new ApiError(statusCode, message);
  };

  const resolveEffectiveAccess = async ({ user, sessionId }) => {
    if (!permissionResolver) return { roles: [], permissions: [], scopedPermissions: {} };
    const resolved = await permissionResolver({
      userId: user.id,
      clinicId: user.clinic_id || null,
      isPlatform: isPlatformUser(user),
      sessionId,
    });
    return {
      roles: Array.isArray(resolved?.roles) ? resolved.roles : [],
      permissions: Array.isArray(resolved?.permissions) ? resolved.permissions : [],
      scopedPermissions: resolved?.scopedPermissions && typeof resolved.scopedPermissions === 'object' ? resolved.scopedPermissions : {},
    };
  };

  const login = async ({ clinicId = null, email, password, context = {} }) => {
    const requestedClinicId = clinicId || null;
    const activeLockout = await repository.findActiveAccountLockout(loginKey({ email, clinicId: requestedClinicId, context }));
    if (activeLockout) {
      return failLogin({
        clinicId: requestedClinicId,
        context,
        email,
        failureReason: 'ACCOUNT_LOCKED',
        message: 'Invalid credentials',
        metadata: { outcome: 'account_locked' },
      });
    }

    const user = await repository.findUserForLogin({ email, clinicId: requestedClinicId });
    if (!user) {
      return failLogin({
        countForLockout: true,
        clinicId: requestedClinicId,
        context,
        email,
        failureReason: 'INVALID_CREDENTIALS',
        metadata: { email, clinicId: requestedClinicId, outcome: 'invalid_credentials' },
      });
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      return failLogin({
        countForLockout: true,
        clinicId: requestedClinicId,
        context,
        email,
        failureReason: 'INVALID_CREDENTIALS',
        metadata: { outcome: 'invalid_credentials' },
        user,
      });
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return failLogin({
        clinicId: requestedClinicId,
        context,
        email,
        failureReason: `USER_${user.status}`,
        message: 'Account unavailable',
        metadata: { outcome: 'account_unavailable', status: user.status },
        statusCode: 403,
        user,
      });
    }

    if (!clinicAllowsAuth(user)) {
      return failLogin({
        clinicId: requestedClinicId,
        context,
        email,
        failureReason: 'CLINIC_UNAVAILABLE',
        message: 'Account unavailable',
        metadata: { outcome: 'clinic_unavailable', clinicStatus: user.clinic?.status || null },
        statusCode: 403,
        user,
      });
    }

    if (!isPlatformUser(user) && !clinicId) {
      return failLogin({
        clinicId: requestedClinicId,
        context,
        email,
        failureReason: 'CLINIC_CONTEXT_REQUIRED',
        metadata: { outcome: 'clinic_context_required' },
        user,
      });
    }

    return transaction(async (tx) => {
      const tokens = await createTokenPair({ user, connection: tx, context });
      await repository.updateLastLogin(user.id, tx);
      await recordAttempt({ email, clinicId: requestedClinicId, user, success: true, context }, tx);
      await audit({
        context: { ...context, userId: user.id, clinicId: user.clinic_id || null },
        action: AUTH_ACTION.LOGIN_SUCCESS,
        moduleName: 'auth',
        resourceType: 'user',
        resourceId: user.id,
        metadata: { sessionId: tokens.sessionId },
      }, tx);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: normalizeUser(user),
        session: {
          sessionId: tokens.sessionId,
          refreshTokenId: tokens.refreshTokenRecord.id,
          expiresAt: tokens.refreshTokenRecord.expires_at,
        },
      };
    });
  };

  const refresh = async ({ refreshToken, context = {} }) => {
    if (!refreshToken) throw new ApiError(401, 'Authentication required');
    let payload;
    try {
      payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET, 'refresh token secret');
    } catch (error) {
      throw new ApiError(401, 'Authentication required');
    }

    return transaction(async (tx) => {
      const tokenHash = hashToken(refreshToken);
      const storedToken = await repository.findRefreshTokenByHash(tokenHash, tx);
      const tokenIsUsable = storedToken
        && storedToken.status === SESSION_STATUS.ACTIVE
        && !storedToken.revoked_at
        && storedToken.expires_at > new Date()
        && storedToken.user_id === payload.sub
        && storedToken.session_id === payload.sessionId
        && storedToken.id === payload.tokenId;

      if (!tokenIsUsable) {
        await repository.revokeActiveRefreshTokensByUser(payload.sub, tx);
        await audit({
          context: { ...context, userId: payload.sub },
          action: AUTH_ACTION.TOKEN_REUSE,
          moduleName: 'auth',
          resourceType: 'session',
          metadata: { sessionId: payload.sessionId, tokenId: payload.tokenId },
        }, tx);
        throw new ApiError(401, 'Authentication required');
      }

      const user = storedToken.user;
      if (!user || user.status !== USER_STATUS.ACTIVE || user.is_deleted || !clinicAllowsAuth(user)) {
        await repository.revokeActiveRefreshTokensByUser(payload.sub, tx);
        throw new ApiError(401, 'Authentication required');
      }

      const claimedAt = new Date();
      const claim = await repository.claimActiveRefreshTokenForRotation({
        id: storedToken.id,
        tokenHash,
        now: claimedAt,
      }, tx);

      if (claim.count !== 1) {
        await repository.revokeActiveRefreshTokensByUser(payload.sub, tx);
        await audit({
          context: { ...context, userId: payload.sub },
          action: AUTH_ACTION.TOKEN_REUSE,
          moduleName: 'auth',
          resourceType: 'session',
          metadata: { sessionId: payload.sessionId, tokenId: payload.tokenId },
        }, tx);
        throw new ApiError(401, 'Authentication required');
      }

      const tokens = await createTokenPair({ user, sessionId: storedToken.session_id, connection: tx, context });
      await repository.markRefreshTokenReplacement({
        id: storedToken.id,
        replacedByTokenId: tokens.refreshTokenRecord.id,
      }, tx);
      await audit({
        context: { ...context, userId: user.id, clinicId: user.clinic_id || null },
        action: AUTH_ACTION.REFRESH,
        moduleName: 'auth',
        resourceType: 'session',
        resourceId: storedToken.session_id,
        metadata: { oldTokenId: storedToken.id, newTokenId: tokens.refreshTokenRecord.id },
      }, tx);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: normalizeUser(user),
        session: {
          sessionId: storedToken.session_id,
          refreshTokenId: tokens.refreshTokenRecord.id,
          expiresAt: tokens.refreshTokenRecord.expires_at,
        },
      };
    });
  };

  const logout = async ({ refreshToken, context = {} }) => {
    if (!refreshToken) return { loggedOut: true };
    let payload = null;
    try {
      payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET, 'refresh token secret');
    } catch (error) {
      return { loggedOut: true };
    }

    return transaction(async (tx) => {
      await repository.revokeRefreshTokenByHash(hashToken(refreshToken), tx);
      await audit({
        context: { ...context, userId: payload.sub },
        action: AUTH_ACTION.LOGOUT,
        moduleName: 'auth',
        resourceType: 'session',
        resourceId: payload.sessionId,
        metadata: { tokenId: payload.tokenId },
      }, tx);
      return { loggedOut: true };
    });
  };

  const resolveAccessToken = async (accessToken) => {
    if (!accessToken) throw new ApiError(401, 'Authentication required');
    let payload;
    try {
      payload = verifyToken(accessToken, env.JWT_ACCESS_SECRET, 'access token secret');
    } catch (error) {
      throw new ApiError(401, 'Authentication required');
    }

    const isPlatformToken = payload.clinicId === null || payload.clinicId === undefined;
    const user = await repository.findUserById({
      userId: payload.userId,
      clinicId: payload.clinicId || null,
      isPlatform: isPlatformToken,
    });
    if (!user || user.status !== USER_STATUS.ACTIVE || user.is_deleted || !clinicAllowsAuth(user)) throw new ApiError(401, 'Authentication required');
    if (user.token_version !== payload.tokenVersion) throw new ApiError(401, 'Authentication required');
    if (!sameClinic(user.clinic_id, payload.clinicId)) throw new ApiError(401, 'Authentication required');

    const session = await repository.findActiveRefreshTokenBySession({
      sessionId: payload.sessionId,
      userId: user.id,
      clinicId: user.clinic_id || null,
      isPlatform: isPlatformUser(user),
    });
    if (!session) throw new ApiError(401, 'Authentication required');
    const access = await resolveEffectiveAccess({ user, sessionId: payload.sessionId });

    return {
      contextIdentity: {
        userId: user.id,
        clinicId: user.clinic_id || null,
        sessionId: payload.sessionId,
        roles: access.roles,
        permissions: access.permissions,
        scopedPermissions: access.scopedPermissions,
        isAuthenticated: true,
        isPlatform: isPlatformUser(user),
      },
      session: {
        sessionId: payload.sessionId,
        refreshTokenId: session.id,
        expiresAt: session.expires_at,
      },
      user: normalizeUser(user),
    };
  };

  const issueSessionForUser = async ({ user = null, userId = null, clinicId = null, context = {} }) => transaction(async (tx) => {
    const resolvedUser = user || await repository.findUserById({
      userId,
      clinicId,
      isPlatform: false,
    }, tx);
    if (!resolvedUser || resolvedUser.status !== USER_STATUS.ACTIVE || resolvedUser.is_deleted || !clinicAllowsAuth(resolvedUser)) {
      throw new ApiError(401, 'Authentication required');
    }
    const tokens = await createTokenPair({ user: resolvedUser, connection: tx, context });
    await audit({
      context: { ...context, userId: resolvedUser.id, clinicId: resolvedUser.clinic_id || null },
      action: AUTH_ACTION.LOGIN_SUCCESS,
      moduleName: 'auth',
      resourceType: 'user',
      resourceId: resolvedUser.id,
      metadata: { sessionId: tokens.sessionId, source: 'invitation_acceptance' },
    }, tx);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: normalizeUser(resolvedUser),
      session: {
        sessionId: tokens.sessionId,
        refreshTokenId: tokens.refreshTokenRecord.id,
        expiresAt: tokens.refreshTokenRecord.expires_at,
      },
    };
  });

  return {
    issueSessionForUser,
    login,
    logout,
    normalizeUser,
    refresh,
    resolveAccessToken,
  };
};

module.exports = { AUTH_ACTION, createAuthService, normalizeUser };
