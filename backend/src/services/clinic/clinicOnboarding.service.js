const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Clinic = require('../../models/Clinic.model');
const User = require('../../models/User.model');
const ClinicTiming = require('../../models/ClinicTiming.model');
const { ROLES } = require('../../utils/constants/roles');

const SALT_ROUNDS = 12;

const generateSystemPassword = () => `Temp#${Math.random().toString(36).slice(-10)}A1`;

const createClinicOnboarding = async ({ owner, clinic, defaultDoctor, timings }) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const clinicCodeExists = await Clinic.findOne({ code: clinic.code }).session(session);
      if (clinicCodeExists) {
        const error = new Error('Clinic code already exists');
        error.statusCode = 409;
        throw error;
      }

      const createdClinic = await Clinic.create(
        [
          {
            name: clinic.name,
            code: clinic.code,
            contact: {
              phone: clinic.contactPhone,
              email: clinic.contactEmail,
              whatsappNumber: clinic.whatsappNumber,
            },
            address: clinic.address,
            timezone: clinic.timezone,
            specialties: clinic.specialties,
            settings: {
              appointmentSlotMinutes: 15,
              allowOverbooking: false,
              reminderLeadMinutes: 120,
              currency: 'INR',
              dashboardActive: false,
            },
            isActive: true,
          },
        ],
        { session }
      );

      const clinicDoc = createdClinic[0];

      clinicDoc.clinicId = clinicDoc._id;
      await clinicDoc.save({ session });

      const ownerExists = await User.findOne({ clinicId: clinicDoc._id, email: owner.email }).session(session);
      if (ownerExists) {
        const error = new Error('Clinic owner email already registered for this clinic');
        error.statusCode = 409;
        throw error;
      }

      const doctorExists = await User.findOne({ clinicId: clinicDoc._id, email: defaultDoctor.email }).session(session);
      if (doctorExists) {
        const error = new Error('Default doctor email already registered for this clinic');
        error.statusCode = 409;
        throw error;
      }

      const ownerPasswordHash = await bcrypt.hash(owner.password, SALT_ROUNDS);
      const defaultDoctorPasswordHash = await bcrypt.hash(generateSystemPassword(), SALT_ROUNDS);

      const createdUsers = await User.create(
        [
          {
            clinicId: clinicDoc._id,
            fullName: owner.fullName,
            email: owner.email,
            phone: owner.phone,
            passwordHash: ownerPasswordHash,
            role: ROLES.CLINIC_OWNER,
            permissions: ['CLINIC_MANAGE', 'USER_MANAGE', 'APPOINTMENT_MANAGE', 'BILLING_MANAGE'],
            isActive: true,
          },
          {
            clinicId: clinicDoc._id,
            fullName: defaultDoctor.fullName,
            email: defaultDoctor.email,
            phone: defaultDoctor.phone,
            passwordHash: defaultDoctorPasswordHash,
            role: ROLES.DOCTOR,
            doctorProfile: {
              registrationNumber: defaultDoctor.registrationNumber,
              specialization: defaultDoctor.specialization,
              qualification: defaultDoctor.qualification,
              consultationFee: defaultDoctor.consultationFee,
            },
            permissions: ['APPOINTMENT_READ', 'PATIENT_READ', 'PRESCRIPTION_MANAGE', 'VISIT_MANAGE'],
            isActive: true,
          },
        ],
        { session }
      );

      const ownerUser = createdUsers.find((u) => u.role === ROLES.CLINIC_OWNER);

      const createdTiming = await ClinicTiming.create(
        [
          {
            clinicId: clinicDoc._id,
            timezone: timings.timezone,
            weeklySchedule: timings.weeklySchedule,
            isDefault: true,
            createdBy: ownerUser._id,
          },
        ],
        { session }
      );

      clinicDoc.settings.dashboardActive = true;
      clinicDoc.onboardingCompletedAt = new Date();
      await clinicDoc.save({ session });

      const defaultDoctorUser = createdUsers.find((u) => u.role === ROLES.DOCTOR);

      result = {
        clinic: {
          id: clinicDoc._id,
          clinicId: clinicDoc.clinicId,
          name: clinicDoc.name,
          code: clinicDoc.code,
          dashboardActive: clinicDoc.settings.dashboardActive,
          onboardingCompletedAt: clinicDoc.onboardingCompletedAt,
        },
        owner: {
          id: ownerUser._id,
          fullName: ownerUser.fullName,
          email: ownerUser.email,
          role: ownerUser.role,
        },
        defaultDoctor: {
          id: defaultDoctorUser._id,
          fullName: defaultDoctorUser.fullName,
          email: defaultDoctorUser.email,
          role: defaultDoctorUser.role,
        },
        timings: {
          id: createdTiming[0]._id,
          timezone: createdTiming[0].timezone,
          weeklySchedule: createdTiming[0].weeklySchedule,
        },
      };
    });

    return result;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createClinicOnboarding,
};
