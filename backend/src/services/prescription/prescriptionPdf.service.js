const fs = require('fs');
const PDFDocument = require('pdfkit');
const Prescription = require('../../models/Prescription.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const Clinic = require('../../models/Clinic.model');
const Notification = require('../../models/Notification.model');
const { uploadBuffer } = require('../storage/storage.service');
const { sendPdfViaWhatsApp } = require('../whatsapp/whatsappMedia.service');

const I18N = {
  en: {
    title: 'Medical Prescription',
    patient: 'Patient',
    doctor: 'Doctor',
    diagnosis: 'Diagnosis',
    medicines: 'Medicines',
    advice: 'Advice',
    review: 'Next Review',
    rx: 'Rx',
  },
  hi: {
    title: 'चिकित्सीय पर्चा',
    patient: 'रोगी',
    doctor: 'डॉक्टर',
    diagnosis: 'निदान',
    medicines: 'दवाएं',
    advice: 'सलाह',
    review: 'अगली समीक्षा',
    rx: 'Rx',
  },
  gu: {
    title: 'મેડિકલ પ્રિસ્ક્રિપ્શન',
    patient: 'દર્દી',
    doctor: 'ડૉક્ટર',
    diagnosis: 'નિદાન',
    medicines: 'દવાઓ',
    advice: 'સલાહ',
    review: 'આગામી સમીક્ષા',
    rx: 'Rx',
  },
};

const getDict = (language) => I18N[language] || I18N.en;

const loadImageIfExists = (doc, filePathOrUrl, x, y, options = {}) => {
  if (!filePathOrUrl) return false;

  if (/^https?:\/\//.test(filePathOrUrl)) {
    return false;
  }

  if (fs.existsSync(filePathOrUrl)) {
    doc.image(filePathOrUrl, x, y, options);
    return true;
  }

  return false;
};

const createPdfBuffer = async ({ clinic, doctor, patient, prescription, language = 'en', logoPath, signaturePath }) =>
  new Promise((resolve, reject) => {
    const dict = getDict(language);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    loadImageIfExists(doc, logoPath, 40, 30, { fit: [80, 80] });

    doc
      .fontSize(20)
      .text(clinic.name || 'Clinic', 140, 40)
      .fontSize(11)
      .text(`${clinic.address?.line1 || ''} ${clinic.address?.city || ''}`, 140, 66)
      .text(`${clinic.contact?.phone || ''}`, 140, 82);

    doc.moveTo(40, 120).lineTo(555, 120).stroke('#333');

    doc
      .fontSize(16)
      .text(dict.title, 40, 135)
      .fontSize(11)
      .text(`${dict.patient}: ${patient.fullName}`, 40, 165)
      .text(`${dict.doctor}: ${doctor.fullName}`, 40, 183)
      .text(`Date: ${new Date().toLocaleDateString()}`, 380, 165)
      .text(`ID: ${patient.patientCode || patient._id}`, 380, 183);

    doc.moveTo(40, 210).lineTo(555, 210).stroke('#999');

    doc.fontSize(14).text(dict.rx, 40, 225);

    doc.fontSize(12).text(`${dict.diagnosis}:`, 40, 250).fontSize(11);
    (prescription.diagnosisSummary || []).forEach((d, idx) => {
      doc.text(`${idx + 1}. ${d}`, 55, doc.y + 2);
    });

    doc.moveDown();
    doc.fontSize(12).text(`${dict.medicines}:`, 40, doc.y + 4).fontSize(11);
    (prescription.medicines || []).forEach((m, idx) => {
      doc.text(
        `${idx + 1}) ${m.medicineName} - ${m.dosage}, ${m.frequency}, ${m.durationDays} days`,
        55,
        doc.y + 2
      );
      if (m.instructions) {
        doc.fillColor('#555').text(`   - ${m.instructions}`, 72, doc.y + 1).fillColor('#000');
      }
    });

    if (prescription.advice) {
      doc.moveDown();
      doc.fontSize(12).text(`${dict.advice}:`, 40, doc.y + 4).fontSize(11).text(prescription.advice, 55, doc.y + 2);
    }

    if (prescription.nextReviewDate) {
      doc.moveDown();
      doc.fontSize(11).text(`${dict.review}: ${new Date(prescription.nextReviewDate).toLocaleDateString()}`, 40, doc.y + 4);
    }

    const signY = 710;
    const signLoaded = loadImageIfExists(doc, signaturePath, 420, signY - 55, { fit: [120, 50] });
    if (!signLoaded) {
      doc.moveTo(420, signY).lineTo(540, signY).stroke('#000');
    }
    doc.fontSize(10).text(doctor.fullName, 420, signY + 8, { width: 130, align: 'center' });

    doc.end();
  });

const buildStorageKey = ({ clinicId, prescriptionId }) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `prescriptions/${clinicId}/${y}/${m}/${prescriptionId}.pdf`;
};

const generatePrescriptionPdf = async ({ clinicId, prescriptionId, language = 'en', logoPath, signaturePath }) => {
  const prescription = await Prescription.findOne({ _id: prescriptionId, clinicId });
  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 404;
    throw error;
  }

  const [clinic, doctor, patient] = await Promise.all([
    Clinic.findById(clinicId),
    User.findById(prescription.doctorId),
    Patient.findById(prescription.patientId),
  ]);

  if (!clinic || !doctor || !patient) {
    const error = new Error('Clinic/Doctor/Patient details missing for PDF generation');
    error.statusCode = 400;
    throw error;
  }

  const pdfBuffer = await createPdfBuffer({
    clinic,
    doctor,
    patient,
    prescription,
    language,
    logoPath,
    signaturePath,
  });

  const storageKey = buildStorageKey({ clinicId, prescriptionId });
  const storage = await uploadBuffer({
    buffer: pdfBuffer,
    key: storageKey,
    contentType: 'application/pdf',
  });

  return {
    prescriptionId,
    storage,
    pdfBuffer,
    filename: `${prescriptionId}.pdf`,
  };
};

const sendPrescriptionPdfOnWhatsApp = async ({
  clinicId,
  prescriptionId,
  to,
  language = 'en',
  logoPath,
  signaturePath,
}) => {
  const generated = await generatePrescriptionPdf({
    clinicId,
    prescriptionId,
    language,
    logoPath,
    signaturePath,
  });

  const sendResult = await sendPdfViaWhatsApp({
    to,
    pdfBuffer: generated.pdfBuffer,
    filename: generated.filename,
    caption: 'Your prescription is attached.',
  });

  await Notification.create({
    clinicId,
    type: 'general',
    channel: 'whatsapp',
    recipient: to,
    payload: {
      prescriptionId,
      file: generated.storage.url || generated.storage.path,
      mediaId: sendResult.media?.id,
      messageId: sendResult.message?.messages?.[0]?.id,
    },
    status: 'sent',
    sentAt: new Date(),
  });

  return {
    generated: {
      prescriptionId,
      file: generated.storage.url || generated.storage.path,
      storage: generated.storage,
    },
    whatsapp: sendResult,
  };
};

module.exports = {
  generatePrescriptionPdf,
  sendPrescriptionPdfOnWhatsApp,
};
