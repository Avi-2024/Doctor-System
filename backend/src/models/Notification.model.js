const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    type: {
      type: String,
      enum: ['appointment_confirmation', 'appointment_reminder', 'hospital_time_booking_alert', 'follow_up', 'billing_due', 'general'],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'email', 'in_app'],
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    templateCode: {
      type: String,
      trim: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
      index: true,
    },
    providerMessageId: {
      type: String,
      trim: true,
    },
    failureReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ clinicId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
