import { Schema, model } from 'mongoose';

const paymentLogSchema = new Schema({
  // Reference to the appointment this payment belongs to
  appointmentId:      { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },

  // Razorpay identifiers
  razorpayPaymentId:  { type: String, required: true, unique: true },
  razorpayOrderId:    { type: String, required: true },

  // Payment details
  amount:             { type: Number, required: true },   // INR (already divided from paise)
  currency:           { type: String, default: 'INR' },
  status:             { type: String, required: true },   // e.g. 'captured', 'failed'
  method:             { type: String, default: null },    // e.g. 'upi', 'card', 'netbanking'

  // Full raw webhook payload stored for audit / dispute resolution
  rawPayload:         { type: Schema.Types.Mixed, required: true },

}, { timestamps: true });

export const PaymentLog = model('PaymentLog', paymentLogSchema);
