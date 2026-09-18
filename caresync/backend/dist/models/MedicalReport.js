"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalReport = void 0;
const mongoose_1 = require("mongoose");
const medicalReportSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    fileType: { type: String, required: true },
    fileData: { type: String, required: true },
    healthCondition: { type: String, default: '' },
    prescribedTablets: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
});
exports.MedicalReport = (0, mongoose_1.model)('MedicalReport', medicalReportSchema);
