import { Schema, model } from 'mongoose';

const appointmentSchema = new Schema({
  appointmentId:  { type: String, unique: true, required: true },
  doctorId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patientId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:           { type: String, required: true },
  timeSlot:       { type: String, required: true },
  reason:         { type: String, required: true },

  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'MISSED'],
    default: 'CONFIRMED',
  },

  // ── Treatment (filled by doctor after visit) ──────────────────────────────
  treatment:  { type: String, default: '' },
  medicines:  [{ name: String, dosage: String, duration: String }],
  notes:      { type: String, default: '' },
  precautions: { type: String, default: '' },

  // ── Patient notifications (in-app) ────────────────────────────────────────
  notifications: [{
    message:   { type: String },
    read:      { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],

  // ── Payment fields ────────────────────────────────────────────────────────
  amount:            { type: Number, default: 0 },
  paymentStatus:     { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'], default: 'PENDING' },
  razorpayOrderId:   { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  paidAt:            { type: Date, default: null },

}, { timestamps: true });

appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1, status: 1 });

export const Appointment = model('Appointment', appointmentSchema);
