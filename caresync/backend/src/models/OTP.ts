import { Schema, model } from 'mongoose';

const otpSchema = new Schema({
  email: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Auto-delete document after 300 seconds (5 minutes)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

export const OTP = model('OTP', otpSchema);
