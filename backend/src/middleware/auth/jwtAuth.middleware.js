const jwt = require('jsonwebtoken');
const User = require('../../models/User.model');
const { JWT_ACCESS_SECRET } = require('../../config/jwt.config');

/**
 * Extract token from:
 * 1. HttpOnly cookie `access_token` (primary — browser clients)
 * 2. Authorization: Bearer header (fallback — API clients / mobile)
 */
const extractToken = (req) => {
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  const { authorization } = req.headers;
  if (authorization) {
    const [scheme, token] = authorization.split(' ');
    if (scheme === 'Bearer' && token) return token;
  }

  return null;
};

const jwtAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is inactive' });
    }

    req.auth = {
      userId: user._id,
      clinicId: user.clinicId,
      role: user.role,
      email: user.email,
    };

    req.user = user;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    return next(error);
  }
};

module.exports = { jwtAuth };
