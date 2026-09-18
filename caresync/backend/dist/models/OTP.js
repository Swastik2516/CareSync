"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP = void 0;
const mongoose_1 = require("mongoose");
const otpSchema = new mongoose_1.Schema({
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
// Auto-delete document after 300 seconds (5 minutes)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
exports.OTP = (0, mongoose_1.model)('OTP', otpSchema);
