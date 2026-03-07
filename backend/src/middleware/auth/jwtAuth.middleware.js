const jwt = require('jsonwebtoken');
const User = require('../../models/User.model');
const { JWT_ACCESS_SECRET } = require('../../config/jwt.config');

const extractBearerToken = (authorization) => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

const jwtAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'User account is inactive' });
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
      return res.status(401).json({ message: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    return next(error);
  }
};

module.exports = {
  jwtAuth,
};
