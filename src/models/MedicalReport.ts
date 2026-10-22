import { Schema, model } from 'mongoose';

const medicalReportSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, required: true },
  fileType:  { type: String, required: true },
  fileData:  { type: String, required: true },
  healthCondition: { type: String, default: '' },
  prescribedTablets: { type: String, default: '' },
  uploadedAt:{ type: Date, default: Date.now },
});

export const MedicalReport = model('MedicalReport', medicalReportSchema);
