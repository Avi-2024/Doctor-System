const mongoose = require('mongoose');

const { Schema } = mongoose;

const vitalsSchema = new Schema(
  {
    temperatureC: { type: Number, min: 30, max: 45 },
    pulseBpm: { type: Number, min: 20, max: 250 },
    systolicBp: { type: Number, min: 50, max: 300 },
    diastolicBp: { type: Number, min: 30, max: 200 },
    spo2: { type: Number, min: 50, max: 100 },
    weightKg: { type: Number, min: 0 },
    heightCm: { type: Number, min: 0 },
  },
  { _id: false }
);

const visitSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chiefComplaint: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    historyOfPresentIllness: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    examinationNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    diagnosis: [{ type: String, trim: true }],
    vitals: vitalsSchema,
    followUpDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

visitSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });

module.exports = mongoose.model('Visit', visitSchema);
