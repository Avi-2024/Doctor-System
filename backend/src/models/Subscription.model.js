const mongoose = require('mongoose');

const { Schema } = mongoose;

const subscriptionSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ['BASIC', 'PRO', 'ENTERPRISE'],
      required: true,
      default: 'BASIC',
      index: true,
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'expired', 'cancelled', 'past_due'],
      default: 'trial',
      index: true,
    },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    razorpay: {
      customerId: { type: String, trim: true, index: true },
      subscriptionId: { type: String, trim: true, index: true },
      planId: { type: String, trim: true },
      shortUrl: { type: String, trim: true },
    },
    limits: {
      maxDoctors: { type: Number, required: true },
      maxPatientsPerMonth: { type: Number, required: true },
      maxWhatsappMessagesPerMonth: { type: Number, required: true },
    },
    usage: {
      monthKey: { type: String, trim: true },
      patientsAdded: { type: Number, default: 0 },
      whatsappMessagesSent: { type: Number, default: 0 },
    },
    metadata: {
      notes: { type: String, trim: true },
      lastWebhookEvent: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ plan: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
