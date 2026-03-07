const mongoose = require('mongoose');

const { Schema } = mongoose;

const medicineSchema = new Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1 },
    instructions: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const prescriptionSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    visitId: {
      type: Schema.Types.ObjectId,
      ref: 'Visit',
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
    diagnosisSummary: [{ type: String, trim: true }],
    medicines: {
      type: [medicineSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one medicine is required',
      },
    },
    advice: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    nextReviewDate: {
      type: Date,
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
