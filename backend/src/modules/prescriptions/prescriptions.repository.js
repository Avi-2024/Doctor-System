/**
 * Prescriptions Repository
 * Reads printable prescription records.
 */

const { prisma } = require('../../database/prisma');

// Find printable prescription.
const findPrintable = async (id, clinicId, connection) => {
  const client = connection || prisma;
  const prescription = await client.prescriptions.findFirst({ where: { id, clinic_id: clinicId, is_deleted: false } });
  if (!prescription) return null;
  const [patient, doctor, clinic] = await Promise.all([
    client.patients.findFirst({ where: { id: prescription.patient_id, clinic_id: clinicId, is_deleted: false } }),
    client.users.findFirst({ where: { id: prescription.doctor_id, clinic_id: clinicId, is_deleted: false } }),
    client.clinics.findFirst({ where: { id: clinicId, is_deleted: false } }),
  ]);
  if (!patient || !doctor || !clinic) return null;
  return {
    ...prescription,
    patient_code: patient.patient_code,
    patient_name: patient.full_name,
    date_of_birth: patient.date_of_birth,
    gender: patient.gender,
    doctor_name: doctor.full_name,
    clinic_name: clinic.name,
    clinic_contact: clinic.contact,
    clinic_address: clinic.address,
    clinic_branding: clinic.branding,
  };
};

module.exports = { findPrintable };
