const { ROLES } = require('../../utils/constants/roles');

const requireSuperAdmin = (req, res, next) => {
  if (!req.auth || !req.auth.role) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.auth.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ message: 'Forbidden: SUPER_ADMIN access required' });
  }

  return next();
};

module.exports = {
  requireSuperAdmin,
};
