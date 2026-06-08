/**
 * Authentication Middleware
 * Resolves authenticated MySQL user sessions.
 */

const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const { prisma } = require('../../database/prisma');
const { ApiError } = require('../errors/ApiError');

// Read access token.
const readToken = (req) => {
  const authorization = req.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) return authorization.slice(7);
  return req.cookies?.access_token || null;
};

// Require authenticated active user.
const requireAuth = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) throw new ApiError(401, 'Authentication required');
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await prisma.users.findFirst({
      where: { id: decoded.sub, is_active: true, is_deleted: false },
      select: { id: true, clinic_id: true, full_name: true, email: true, role: true, permissions: true },
    });
    if (!user) throw new ApiError(401, 'Invalid session');
    if (user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinics.findFirst({ where: { id: user.clinic_id, status: 'ACTIVE', is_deleted: false }, select: { id: true } });
      if (!clinic) throw new ApiError(401, 'Invalid session');
    }
    req.auth = {
      userId: user.id,
      clinicId: user.clinic_id,
      role: user.role,
      permissions: user.permissions,
    };
    return next();
  } catch (error) {
    return next(error.statusCode ? error : new ApiError(401, 'Invalid access token'));
  }
};

module.exports = { requireAuth };
