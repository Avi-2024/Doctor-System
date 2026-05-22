const express = require('express');
const authController = require('../../controllers/auth/auth.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { allowRoles } = require('../../middleware/rbac/roleGuard.middleware');
const { ROLES } = require('../../utils/constants/roles');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Reads refresh_token cookie — no jwtAuth needed
router.post('/refresh', authController.refresh);

// Requires valid access_token cookie to identify user for token invalidation
router.post('/logout', jwtAuth, authController.logout);

router.get('/me', jwtAuth, authController.me);

router.get(
  '/admin-only',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER),
  (req, res) => res.status(200).json({ success: true, data: { role: req.auth.role } })
);

module.exports = router;
