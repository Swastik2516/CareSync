"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientProfile = void 0;
const mongoose_1 = require("mongoose");
const patientProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    profileImage: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400' }
});
exports.PatientProfile = (0, mongoose_1.model)('PatientProfile', patientProfileSchema);
