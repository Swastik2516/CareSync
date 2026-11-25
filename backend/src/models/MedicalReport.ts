import { Schema, model, Document, Types } from 'mongoose';

// ── TypeScript interface ───────────────────────────────────────────────────────
export interface IMedicalReport extends Document {
  // ── Existing fields (Cloudinary — do not remove) ──────────────────────────
  patientId:         Types.ObjectId;
  name:              string;
  fileType:          string;          // MIME type (legacy field name kept)
  fileUrl:           string;          // Cloudinary secure_url OR empty for S3 records
  publicId:          string;          // Cloudinary public_id OR empty for S3 records
  healthCondition:   string;
  prescribedTablets: string;
  uploadedAt:        Date;

  // ── New fields (S3 storage) ────────────────────────────────────────────────
  storageProvider:   'cloudinary' | 's3';
  s3Key:             string;          // S3 object key — empty for Cloudinary records
  originalFileName:  string;          // Sanitised original file name (no PII)
  mimeType:          string;          // Canonical MIME type for S3 records
  fileSize:          number;          // Bytes — 0 for legacy Cloudinary records
  uploadedBy:        Types.ObjectId;  // userId of the uploader (patient or doctor)
  uploadStatus:      'pending' | 'uploaded' | 'verified' | 'rejected';
  verifiedAt:        Date | null;

  // ── Pending upload expiry ─────────────────────────────────────────────────
  // Pending records older than PRESIGN_EXPIRES_SECONDS (300 s) are considered
  // orphaned. A background cleanup or TTL index can remove them.
  presignExpiresAt:  Date | null;
}

const medicalReportSchema = new Schema<IMedicalReport>({
  // ── Existing Cloudinary fields — unchanged ────────────────────────────────
  patientId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:              { type: String, required: true },
  fileType:          { type: String, required: true },
  fileUrl:           { type: String, default: '' },   // Cloudinary URL; empty for S3
  publicId:          { type: String, default: '' },   // Cloudinary public_id; empty for S3
  healthCondition:   { type: String, default: '' },
  prescribedTablets: { type: String, default: '' },
  uploadedAt:        { type: Date, default: Date.now },

  // ── New S3 fields ─────────────────────────────────────────────────────────
  storageProvider: {
    type:    String,
    enum:    ['cloudinary', 's3'],
    default: 'cloudinary',           // All existing records default to cloudinary
    index:   true,
  },
  s3Key:            { type: String, default: '' },
  originalFileName: { type: String, default: '' },
  mimeType:         { type: String, default: '' },
  fileSize:         { type: Number, default: 0 },
  uploadedBy: {
    type:    Schema.Types.ObjectId,
    ref:     'User',
    default: null,
  },
  uploadStatus: {
    type:    String,
    enum:    ['pending', 'uploaded', 'verified', 'rejected'],
    default: 'verified',             // All existing Cloudinary records are already verified
    index:   true,
  },
  verifiedAt:       { type: Date, default: null },
  presignExpiresAt: { type: Date, default: null },
});

// ── TTL index: auto-expire pending S3 upload records after 10 minutes ─────────
// A pending record is created when the presigned POST is issued.
// If the browser never completes the upload, this index removes the orphaned
// MongoDB document automatically. The S3 object (if partially uploaded) is
// not deleted here — IAM policy does not grant DeleteObject.
// presignExpiresAt is set to Date.now() + 600s on pending record creation.
medicalReportSchema.index(
  { presignExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { uploadStatus: 'pending' } }
);

// ── Compound index for doctor access queries ──────────────────────────────────
medicalReportSchema.index({ patientId: 1, uploadStatus: 1, uploadedAt: -1 });

export const MedicalReport = model<IMedicalReport>('MedicalReport', medicalReportSchema);
