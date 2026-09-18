"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorProfile = void 0;
const mongoose_1 = require("mongoose");
const doctorProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, index: true },
    hospital: { type: String, required: true },
    experience: { type: Number, required: true },
    consultationFee: { type: Number, required: true },
    bio: { type: String, required: true },
    rating: { type: Number, default: 5.0 },
    profileImage: { type: String, default: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400' }
});
exports.DoctorProfile = (0, mongoose_1.model)('DoctorProfile', doctorProfileSchema);
