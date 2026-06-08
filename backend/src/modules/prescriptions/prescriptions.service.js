/**
 * Prescriptions Service
 * Builds printable prescription exports.
 */

const repository = require('./prescriptions.repository');
const { ApiError } = require('../../common/errors/ApiError');

// Parse optional JSON value.
const parseJson = (value) => (typeof value === 'string' ? JSON.parse(value) : value);

// Export printable prescription.
const exportPrescription = async (id, context) => {
  const record = await repository.findPrintable(id, context.clinicId);
  if (!record) throw new ApiError(404, 'Prescription not found');
  return {
    id: record.id,
    issuedAt: record.created_at,
    clinic: { name: record.clinic_name, contact: parseJson(record.clinic_contact), address: parseJson(record.clinic_address), branding: parseJson(record.clinic_branding) },
    patient: { id: record.patient_id, code: record.patient_code, name: record.patient_name, dateOfBirth: record.date_of_birth, gender: record.gender },
    doctor: { id: record.doctor_id, name: record.doctor_name },
    diagnosis: record.diagnosis,
    medicines: parseJson(record.medicines) || [],
    advice: record.advice,
  };
};

module.exports = { exportPrescription };
