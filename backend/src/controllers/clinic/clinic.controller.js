const Clinic = require('../../models/Clinic.model');
const ClinicTiming = require('../../models/ClinicTiming.model');
const clinicOnboardingService = require('../../services/clinic/clinicOnboarding.service');

const onboardClinic = async (req, res, next) => {
  try {
    const data = await clinicOnboardingService.createClinicOnboarding(req.validatedOnboarding);

    return res.status(201).json({
      message: 'Clinic onboarding completed successfully',
      ...data,
    });
  } catch (error) {
    return next(error);
  }
};

const getClinicOnboardingStatus = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId).select('name code settings onboardingCompletedAt isActive');

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const defaultTiming = await ClinicTiming.findOne({ clinicId: clinic._id, isDefault: true }).select(
      'timezone weeklySchedule effectiveFrom'
    );

    return res.status(200).json({
      clinic: {
        id: clinic._id,
        name: clinic.name,
        code: clinic.code,
        isActive: clinic.isActive,
        dashboardActive: clinic.settings?.dashboardActive || false,
        onboardingCompletedAt: clinic.onboardingCompletedAt || null,
      },
      defaultTimings: defaultTiming,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  onboardClinic,
  getClinicOnboardingStatus,
};
