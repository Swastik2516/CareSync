"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Availability = void 0;
const mongoose_1 = require("mongoose");
const availabilitySchema = new mongoose_1.Schema({
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, default: 10 }
});
availabilitySchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });
exports.Availability = (0, mongoose_1.model)('Availability', availabilitySchema);
