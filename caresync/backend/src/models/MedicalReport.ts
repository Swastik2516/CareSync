import { Schema, model } from 'mongoose';

const medicalReportSchema = new Schema({
  patientId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:              { type: String, required: true },
  fileType:          { type: String, required: true },
  fileUrl:           { type: String, required: true },   // Cloudinary URL
  publicId:          { type: String, required: true },   // Cloudinary public_id for deletion
  healthCondition:   { type: String, default: '' },
  prescribedTablets: { type: String, default: '' },
  uploadedAt:        { type: Date, default: Date.now },
});

export const MedicalReport = model('MedicalReport', medicalReportSchema);
