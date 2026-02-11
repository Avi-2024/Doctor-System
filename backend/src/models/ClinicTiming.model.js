const mongoose = require('mongoose');

const { Schema } = mongoose;

const dayTimingSchema = new Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    slots: [
      {
        startTime: { type: String, required: true, trim: true },
        endTime: { type: String, required: true, trim: true },
      },
    ],
  },
  { _id: false }
);

const clinicTimingSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    weeklySchedule: {
      type: [dayTimingSchema],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 7,
        message: 'weeklySchedule must contain 7 entries (Sunday to Saturday)',
      },
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    isDefault: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

clinicTimingSchema.index({ clinicId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

module.exports = mongoose.model('ClinicTiming', clinicTimingSchema);
