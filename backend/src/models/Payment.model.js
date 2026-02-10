const mongoose = require('mongoose');

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    billingId: {
      type: Schema.Types.ObjectId,
      ref: 'Billing',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'net_banking', 'wallet', 'cheque'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
      default: 'success',
      index: true,
    },
    transactionRef: {
      type: String,
      trim: true,
      index: true,
    },
    gateway: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ clinicId: 1, billingId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
