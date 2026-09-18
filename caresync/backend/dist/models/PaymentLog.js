"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentLog = void 0;
const mongoose_1 = require("mongoose");
const paymentLogSchema = new mongoose_1.Schema({
    // Reference to the appointment this payment belongs to
    appointmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    // Razorpay identifiers
    razorpayPaymentId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String, required: true },
    // Payment details
    amount: { type: Number, required: true }, // INR (already divided from paise)
    currency: { type: String, default: 'INR' },
    status: { type: String, required: true }, // e.g. 'captured', 'failed'
    method: { type: String, default: null }, // e.g. 'upi', 'card', 'netbanking'
    // Full raw webhook payload stored for audit / dispute resolution
    rawPayload: { type: mongoose_1.Schema.Types.Mixed, required: true },
}, { timestamps: true });
exports.PaymentLog = (0, mongoose_1.model)('PaymentLog', paymentLogSchema);
