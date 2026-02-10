const mongoose = require('mongoose');
const authService = require('../../services/auth/auth.service');
const { ROLES } = require('../../utils/constants/roles');

const allowedRoles = new Set(Object.values(ROLES));

const validateSignupPayload = (body) => {
  const { clinicId, fullName, email, phone, password, role } = body;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return 'Valid clinicId is required';
  }
  if (!fullName || fullName.trim().length < 2) {
    return 'fullName is required and must be at least 2 characters';
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Valid email is required';
  }
  if (!phone || phone.trim().length < 8) {
    return 'Valid phone is required';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!role || !allowedRoles.has(role)) {
    return `role must be one of: ${Array.from(allowedRoles).join(', ')}`;
  }

  return null;
};

const validateLoginPayload = (body) => {
  const { clinicId, email, password } = body;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return 'Valid clinicId is required';
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Valid email is required';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  return null;
};

const signup = async (req, res, next) => {
  try {
    const validationError = validateSignupPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { clinicId, fullName, email, phone, password, role, doctorProfile, permissions } = req.body;
    const data = await authService.signup({
      clinicId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role,
      doctorProfile,
      permissions,
    });

    return res.status(201).json({
      message: 'Signup successful',
      ...data,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validationError = validateLoginPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { clinicId, email, password } = req.body;
    const data = await authService.login({
      clinicId,
      email: email.trim().toLowerCase(),
      password,
    });

    return res.status(200).json({
      message: 'Login successful',
      ...data,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  signup,
  login,
};
