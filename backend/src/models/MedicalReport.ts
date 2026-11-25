import { Schema, model, Document, Types } from 'mongoose';

export interface IMedicalReport extends Document {
  patientId:          Types.ObjectId;
  name:               string;
  fileType:           string;
  fileUrl:            string;
  publicId:           string;
  healthCondition:    string;
  prescribedTablets:  string;
  uploadedAt:         Date;
  storageProvider:    'cloudinary' | 's3';
  s3Key:              string;
  originalFileName:   string;
  mimeType:           string;
  fileSize:           number;
  uploadedBy:         Types.ObjectId;
  uploadStatus:       'pending' | 'uploaded' | 'verified' | 'rejected';
  verifiedAt:         Date | null;
  sharedWithDoctorId: Types.ObjectId | null;  // only this doctor can view the report
  presignExpiresAt:   Date | null;
}

const medicalReportSchema = new Schema<IMedicalReport>({
  patientId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:              { type: String, required: true },
  fileType:          { type: String, required: true },
  fileUrl:           { type: String, default: '' },
  publicId:          { type: String, default: '' },
  healthCondition:   { type: String, default: '' },
  prescribedTablets: { type: String, default: '' },
  uploadedAt:        { type: Date, default: Date.now },

  storageProvider: {
    type:    String,
    enum:    ['cloudinary', 's3'],
    default: 'cloudinary',
    index:   true,
  },
  s3Key:            { type: String, default: '' },
  originalFileName: { type: String, default: '' },
  mimeType:         { type: String, default: '' },
  fileSize:         { type: Number, default: 0 },
  uploadedBy:       { type: Schema.Types.ObjectId, ref: 'User', default: null },
  uploadStatus: {
    type:    String,
    enum:    ['pending', 'uploaded', 'verified', 'rejected'],
    default: 'verified',
    index:   true,
  },
  verifiedAt:         { type: Date, default: null },
  sharedWithDoctorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  presignExpiresAt:   { type: Date, default: null },
});

// TTL index: auto-expire orphaned pending records after presign window
medicalReportSchema.index(
  { presignExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { uploadStatus: 'pending' } }
);

medicalReportSchema.index({ patientId: 1, uploadStatus: 1, uploadedAt: -1 });

export const MedicalReport = model<IMedicalReport>('MedicalReport', medicalReportSchema);
