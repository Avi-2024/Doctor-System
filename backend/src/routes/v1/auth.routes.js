const express = require('express');
const authController = require('../../controllers/auth/auth.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { allowRoles } = require('../../middleware/rbac/roleGuard.middleware');
const { ROLES } = require('../../utils/constants/roles');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.get('/me', jwtAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

router.get('/admin-only', jwtAuth, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER), (req, res) =>
  res.status(200).json({ message: 'Access granted', role: req.auth.role })
);

module.exports = router;
