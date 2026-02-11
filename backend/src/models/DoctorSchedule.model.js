const mongoose = require('mongoose');

const { Schema } = mongoose;

const scheduleSlotSchema = new Schema(
  {
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const dailyScheduleSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isAvailable: { type: Boolean, default: true },
    slots: { type: [scheduleSlotSchema], default: [] },
  },
  { _id: false }
);

const doctorScheduleSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scheduleType: {
      type: String,
      enum: ['clinic', 'hospital'],
      required: true,
      index: true,
    },
    locationName: { type: String, required: true, trim: true },
    timezone: { type: String, default: 'Asia/Kolkata', trim: true },
    weeklySchedule: {
      type: [dailyScheduleSchema],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 7,
        message: 'weeklySchedule must contain 7 day entries',
      },
    },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

doctorScheduleSchema.index({ clinicId: 1, doctorId: 1, scheduleType: 1, isActive: 1 });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
