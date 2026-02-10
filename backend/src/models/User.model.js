const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'doctor', 'receptionist'],
      index: true,
    },
    doctorProfile: {
      registrationNumber: { type: String, trim: true },
      specialization: { type: String, trim: true },
      qualification: { type: String, trim: true },
      consultationFee: { type: Number, min: 0 },
    },
    permissions: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ clinicId: 1, email: 1 }, { unique: true });
userSchema.index({ clinicId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
