const mongoose = require('mongoose');
const { ROLES } = require('../../utils/constants/roles');

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
const isValidTimeHHMM = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const validateClinicOnboarding = (req, res, next) => {
  const {
    owner,
    clinic,
    defaultDoctor,
    timings,
  } = req.body;

  if (!owner || typeof owner !== 'object') {
    return res.status(400).json({ message: 'owner object is required' });
  }

  if (!clinic || typeof clinic !== 'object') {
    return res.status(400).json({ message: 'clinic object is required' });
  }

  if (!defaultDoctor || typeof defaultDoctor !== 'object') {
    return res.status(400).json({ message: 'defaultDoctor object is required' });
  }

  if (!timings || typeof timings !== 'object') {
    return res.status(400).json({ message: 'timings object is required' });
  }

  if (!owner.fullName || owner.fullName.trim().length < 2) {
    return res.status(400).json({ message: 'owner.fullName must be at least 2 characters' });
  }

  if (!owner.email || !isValidEmail(owner.email)) {
    return res.status(400).json({ message: 'owner.email must be a valid email' });
  }

  if (!owner.phone || owner.phone.trim().length < 8) {
    return res.status(400).json({ message: 'owner.phone must be valid' });
  }

  if (!owner.password || owner.password.length < 8) {
    return res.status(400).json({ message: 'owner.password must be at least 8 characters' });
  }

  if (!clinic.name || clinic.name.trim().length < 2) {
    return res.status(400).json({ message: 'clinic.name is required' });
  }

  if (!clinic.code || clinic.code.trim().length < 3) {
    return res.status(400).json({ message: 'clinic.code is required' });
  }

  if (!clinic.contactPhone || clinic.contactPhone.trim().length < 8) {
    return res.status(400).json({ message: 'clinic.contactPhone is required' });
  }

  if (!clinic.address || typeof clinic.address !== 'object') {
    return res.status(400).json({ message: 'clinic.address object is required' });
  }

  if (!defaultDoctor.fullName || defaultDoctor.fullName.trim().length < 2) {
    return res.status(400).json({ message: 'defaultDoctor.fullName must be at least 2 characters' });
  }

  if (!defaultDoctor.email || !isValidEmail(defaultDoctor.email)) {
    return res.status(400).json({ message: 'defaultDoctor.email must be valid' });
  }

  if (!defaultDoctor.phone || defaultDoctor.phone.trim().length < 8) {
    return res.status(400).json({ message: 'defaultDoctor.phone must be valid' });
  }

  if (!timings.timezone || typeof timings.timezone !== 'string') {
    return res.status(400).json({ message: 'timings.timezone is required' });
  }

  if (!Array.isArray(timings.weeklySchedule) || timings.weeklySchedule.length !== 7) {
    return res.status(400).json({ message: 'timings.weeklySchedule must have 7 day schedules' });
  }

  for (const daySchedule of timings.weeklySchedule) {
    if (typeof daySchedule.dayOfWeek !== 'number' || daySchedule.dayOfWeek < 0 || daySchedule.dayOfWeek > 6) {
      return res.status(400).json({ message: 'Each daySchedule.dayOfWeek must be between 0 and 6' });
    }

    if (!Array.isArray(daySchedule.slots)) {
      return res.status(400).json({ message: 'Each daySchedule.slots must be an array' });
    }

    for (const slot of daySchedule.slots) {
      if (!slot.startTime || !slot.endTime || !isValidTimeHHMM(slot.startTime) || !isValidTimeHHMM(slot.endTime)) {
        return res.status(400).json({ message: 'slot times must follow HH:MM format' });
      }

      if (slot.startTime >= slot.endTime) {
        return res.status(400).json({ message: 'slot.startTime must be less than slot.endTime' });
      }
    }
  }

  req.validatedOnboarding = {
    owner: {
      fullName: owner.fullName.trim(),
      email: owner.email.trim().toLowerCase(),
      phone: owner.phone.trim(),
      password: owner.password,
      role: ROLES.CLINIC_OWNER,
    },
    clinic: {
      name: clinic.name.trim(),
      code: clinic.code.trim().toUpperCase(),
      contactPhone: clinic.contactPhone.trim(),
      contactEmail: clinic.contactEmail ? clinic.contactEmail.trim().toLowerCase() : undefined,
      whatsappNumber: clinic.whatsappNumber ? clinic.whatsappNumber.trim() : undefined,
      address: clinic.address,
      timezone: clinic.timezone || timings.timezone,
      specialties: Array.isArray(clinic.specialties) ? clinic.specialties : [],
    },
    defaultDoctor: {
      fullName: defaultDoctor.fullName.trim(),
      email: defaultDoctor.email.trim().toLowerCase(),
      phone: defaultDoctor.phone.trim(),
      registrationNumber: defaultDoctor.registrationNumber,
      specialization: defaultDoctor.specialization,
      qualification: defaultDoctor.qualification,
      consultationFee: defaultDoctor.consultationFee,
    },
    timings: {
      timezone: timings.timezone,
      weeklySchedule: timings.weeklySchedule,
    },
  };

  return next();
};

const validateClinicIdParam = (req, res, next) => {
  const { clinicId } = req.params;
  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return res.status(400).json({ message: 'Valid clinicId is required in route param' });
  }
  return next();
};

module.exports = {
  validateClinicOnboarding,
  validateClinicIdParam,
};
