/**
 * Auth Routes
 * Registers authentication endpoints.
 */

const express = require('express');
const controller = require('./auth.controller');
const { loginRules, refreshRules, requestResetRules, confirmResetRules } = require('./auth.validator');
const { validate } = require('../../common/middleware/validate');
const { requireAuth } = require('../../common/middleware/auth');
const { asyncHandler } = require('../../common/utils/asyncHandler');

const router = express.Router();

router.post('/login', loginRules, validate, asyncHandler(controller.login));
router.post('/refresh', refreshRules, validate, asyncHandler(controller.refresh));
router.post('/logout', requireAuth, asyncHandler(controller.logout));
router.get('/me', requireAuth, asyncHandler(controller.me));
router.post('/password-reset', requestResetRules, validate, asyncHandler(controller.requestPasswordReset));
router.post('/password-reset/confirm', confirmResetRules, validate, asyncHandler(controller.confirmPasswordReset));

module.exports = router;
