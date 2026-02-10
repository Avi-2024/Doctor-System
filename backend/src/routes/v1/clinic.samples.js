module.exports = {
  clinicOnboardingRequest: {
    method: 'POST',
    path: '/api/v1/clinics/onboard',
    body: {
      owner: {
        fullName: 'Drishti Mehta',
        email: 'owner@sunriseclinic.com',
        phone: '+919876543210',
        password: 'StrongPass#2026',
      },
      clinic: {
        name: 'Sunrise Multispeciality Clinic',
        code: 'SUNRISE01',
        contactPhone: '+919812341234',
        contactEmail: 'contact@sunriseclinic.com',
        whatsappNumber: '+919812341234',
        address: {
          line1: '14, Park View Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380015',
        },
        timezone: 'Asia/Kolkata',
        specialties: ['General Medicine', 'Pediatrics'],
      },
      defaultDoctor: {
        fullName: 'Dr. Arjun Shah',
        email: 'arjun.shah@sunriseclinic.com',
        phone: '+919898989898',
        registrationNumber: 'GMC-12345',
        specialization: 'General Physician',
        qualification: 'MBBS, MD',
        consultationFee: 600,
      },
      timings: {
        timezone: 'Asia/Kolkata',
        weeklySchedule: [
          { dayOfWeek: 0, isOpen: false, slots: [] },
          { dayOfWeek: 1, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
          { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
          { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
          { dayOfWeek: 4, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
          { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
          { dayOfWeek: 6, isOpen: true, slots: [{ startTime: '10:00', endTime: '14:00' }] },
        ],
      },
    },
  },

  clinicOnboardingResponse: {
    message: 'Clinic onboarding completed successfully',
    clinic: {
      id: '65f8f2bb7b0db11ed5be0101',
      clinicId: '65f8f2bb7b0db11ed5be0101',
      name: 'Sunrise Multispeciality Clinic',
      code: 'SUNRISE01',
      dashboardActive: true,
      onboardingCompletedAt: '2026-02-10T10:20:00.000Z',
    },
    owner: {
      id: '65f8f2bb7b0db11ed5be0102',
      fullName: 'Drishti Mehta',
      email: 'owner@sunriseclinic.com',
      role: 'CLINIC_OWNER',
    },
    defaultDoctor: {
      id: '65f8f2bb7b0db11ed5be0103',
      fullName: 'Dr. Arjun Shah',
      email: 'arjun.shah@sunriseclinic.com',
      role: 'DOCTOR',
    },
    timings: {
      id: '65f8f2bb7b0db11ed5be0104',
      timezone: 'Asia/Kolkata',
      weeklySchedule: [
        { dayOfWeek: 0, isOpen: false, slots: [] },
      ],
    },
  },
};
