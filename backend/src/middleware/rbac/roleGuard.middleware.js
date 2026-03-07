const { ROLES } = require('../../utils/constants/roles');

const validRoles = new Set(Object.values(ROLES));

const allowRoles = (...roles) => {
  const invalidRole = roles.find((role) => !validRoles.has(role));
  if (invalidRole) {
    throw new Error(`Invalid role configured in guard: ${invalidRole}`);
  }

  return (req, res, next) => {
    if (!req.auth || !req.auth.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role permission' });
    }

    return next();
  };
};

module.exports = {
  allowRoles,
};
