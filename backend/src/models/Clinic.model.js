const mongoose = require('mongoose');

const { Schema } = mongoose;

const clinicSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
      default: function defaultClinicId() {
        return this._id;
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
      unique: true,
    },
    contact: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      whatsappNumber: { type: String, trim: true },
    },
    address: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true, default: 'India' },
      pincode: { type: String, required: true, trim: true },
    },
    timezone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
      trim: true,
    },
    specialties: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    settings: {
      appointmentSlotMinutes: { type: Number, default: 15, min: 5, max: 120 },
      allowOverbooking: { type: Boolean, default: false },
      reminderLeadMinutes: { type: Number, default: 120, min: 0 },
      currency: { type: String, default: 'INR', trim: true },
    },
  },
  {
    timestamps: true,
  }
);

clinicSchema.index({ clinicId: 1, isActive: 1 });

module.exports = mongoose.model('Clinic', clinicSchema);
