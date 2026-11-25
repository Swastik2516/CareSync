import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { MedicalReport } from '../models/MedicalReport';
import { Appointment } from '../models/Appointment';
import {
  generateS3Key,
  createS3PresignedPost,
  getPresignedDownloadUrl,
  getObjectMetadata,
  validateFileMagicBytes,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../services/s3Service';
import { isS3Configured } from '../config/s3';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// ── Constants ─────────────────────────────────────────────────────────────────
// Pending upload TTL: 10 minutes from presign issuance.
// The MongoDB TTL index removes orphaned pending records after this window.
const PENDING_TTL_MS = 10 * 60 * 1000;

// ── Zod validation schemas ────────────────────────────────────────────────────
const presignUploadSchema = z.object({
  fileName:           z.string().min(1).max(200),
  mimeType:           z.string().refine(
    (v) => ALLOWED_MIME_TYPES.has(v),
    { message: `Allowed types: ${[...ALLOWED_MIME_TYPES].join(', ')}` }
  ),
  fileSize:           z.number().int().min(1).max(MAX_FILE_SIZE_BYTES, {
    message: `File size must not exceed ${MAX_FILE_SIZE_BYTES} bytes (10 MB)`,
  }),
  name:               z.string().min(1).max(200),
  sharedWithDoctorId: z.string().min(1, { message: 'You must select a doctor to share this record with.' }),
  healthCondition:    z.string().max(500).optional().default(''),
  prescribedTablets:  z.string().max(500).optional().default(''),
});

const confirmUploadSchema = z.object({
  pendingReportId: z.string().min(1),
});

// ── Audit logger ──────────────────────────────────────────────────────────────
// Logs security-relevant events without logging medical content, file URLs,
// presigned URLs, credentials or PII beyond userId and reportId.
function auditLog(event: string, meta: Record<string, unknown>) {
  console.log(JSON.stringify({
    audit:     true,
    timestamp: new Date().toISOString(),
    event,
    ...meta,
  }));
}

// ── Helper: download first N bytes from a presigned URL ───────────────────────
// Used for magic byte validation — downloads only the first 16 bytes of the
// uploaded file to check its binary signature without fetching the full file.
function fetchFirstBytes(presignedUrl: string, maxBytes = 16): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(presignedUrl);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        method:   'GET',
        hostname: parsed.hostname,
        path:     parsed.pathname + parsed.search,
        headers:  { Range: `bytes=0-${maxBytes - 1}` },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end',  () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/presign-upload
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Issues a short-lived presigned POST for direct browser-to-S3 upload.
 *
 * Authorization:
 *  - PATIENT: can only upload for themselves (patientId = req.user.userId).
 *  - DOCTOR: not permitted to use this endpoint (reports are patient-owned).
 *
 * Flow:
 *  1. Validate JWT + PATIENT role.
 *  2. Validate request body with Zod.
 *  3. Generate opaque S3 key (no PII).
 *  4. Create pending MedicalReport in MongoDB with uploadStatus='pending'.
 *  5. Generate presigned POST with content-length-range policy.
 *  6. Return { pendingReportId, uploadUrl, fields } — never log the URL.
 */
export const presignUpload = async (req: AuthRequest, res: Response) => {
  if (!isS3Configured()) {
    return res.status(503).json({ error: 'S3 storage is not configured on this server.' });
  }

  const parsed = presignUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { fileName, mimeType, fileSize, name, sharedWithDoctorId, healthCondition, prescribedTablets } = parsed.data;
  const patientId = req.user!.userId;

  // Validate sharedWithDoctorId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(sharedWithDoctorId)) {
    return res.status(400).json({ error: 'Invalid doctor ID.' });
  }

  try {
    // Generate opaque key — no patient name, email or diagnosis in the path.
    const s3Key = generateS3Key(patientId, mimeType);

    // Create pending record BEFORE issuing the presigned URL.
    // If presign generation fails, the pending record is cleaned up by TTL.
    const pendingReport = await MedicalReport.create({
      patientId,
      name,
      fileType:           mimeType,
      fileUrl:            '',
      publicId:           '',
      healthCondition,
      prescribedTablets,
      storageProvider:    's3',
      s3Key,
      originalFileName:   sanitiseFileName(fileName),
      mimeType,
      fileSize,
      uploadedBy:         new mongoose.Types.ObjectId(patientId),
      uploadStatus:       'pending',
      sharedWithDoctorId: new mongoose.Types.ObjectId(sharedWithDoctorId),
      presignExpiresAt:   new Date(Date.now() + PENDING_TTL_MS),
    });

    const presignedPost = await createS3PresignedPost(s3Key, mimeType, fileSize);

    auditLog('presign_upload_issued', {
      userId:        patientId,
      reportId:      pendingReport._id,
      mimeType,
      fileSize,
      s3KeyPrefix:   s3Key.split('/').slice(0, 2).join('/'), // log prefix only, not full key
    });

    // Return only what the browser needs — never log presignedPost.url
    return res.status(201).json({
      pendingReportId: pendingReport._id,
      uploadUrl:       presignedPost.url,
      fields:          presignedPost.fields,
    });
  } catch (err: any) {
    auditLog('presign_upload_error', { userId: patientId, error: err.message });
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/confirm-upload
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Confirms a completed browser-to-S3 upload and marks the report as verified.
 *
 * Authorization:
 *  - Only the patient who created the pending record can confirm it.
 *  - The S3 key is read from the server-side pending record — never from the
 *    client request body (prevents IDOR / key substitution attacks).
 *
 * Verification steps:
 *  1. Load pending record by ID, verify ownership.
 *  2. Check presign has not expired.
 *  3. HeadObject: confirm object exists, ContentType matches, size within limit.
 *  4. Download first 16 bytes via presigned GET, validate magic bytes.
 *  5. Mark uploadStatus='verified', set verifiedAt, clear presignExpiresAt.
 *  6. Idempotent: already-verified records return 200 without re-processing.
 *
 * Security note on file scanning:
 *  Magic byte validation catches renamed files (e.g. .exe → .pdf) but is NOT
 *  a substitute for antivirus/malware scanning. Files remain in 'uploaded'
 *  status (not 'verified') until magic bytes pass. A future phase should
 *  integrate AWS GuardDuty Malware Protection or a Lambda-based ClamAV scan
 *  triggered by S3 event notifications before setting status='verified'.
 *  Until then, only 'verified' files are served to other users.
 */
export const confirmUpload = async (req: AuthRequest, res: Response) => {
  if (!isS3Configured()) {
    return res.status(503).json({ error: 'S3 storage is not configured on this server.' });
  }

  const parsed = confirmUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { pendingReportId } = parsed.data;
  const userId = req.user!.userId;

  // Validate MongoDB ObjectId format before querying.
  if (!mongoose.Types.ObjectId.isValid(pendingReportId)) {
    return res.status(400).json({ error: 'Invalid report ID.' });
  }

  try {
    const report = await MedicalReport.findById(pendingReportId);

    if (!report) {
      return res.status(404).json({ error: 'Pending upload record not found.' });
    }

    // Ownership check — server-side, never trust client-supplied patientId.
    if (report.patientId.toString() !== userId) {
      auditLog('confirm_upload_unauthorized', { userId, reportId: pendingReportId });
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Idempotency: already verified — return success without re-processing.
    if (report.uploadStatus === 'verified') {
      return res.status(200).json({
        message:  'Upload already confirmed.',
        reportId: report._id,
      });
    }

    // Reject non-pending records (rejected, or wrong state).
    if (report.uploadStatus !== 'pending') {
      return res.status(409).json({
        error: `Upload is in '${report.uploadStatus}' state and cannot be confirmed.`,
      });
    }

    // Expiry check — presignExpiresAt is set at pending record creation.
    if (report.presignExpiresAt && report.presignExpiresAt < new Date()) {
      await MedicalReport.findByIdAndUpdate(pendingReportId, { uploadStatus: 'rejected' });
      auditLog('confirm_upload_expired', { userId, reportId: pendingReportId });
      return res.status(410).json({ error: 'Upload window has expired. Please start a new upload.' });
    }

    // S3 key is read from the server-side record — never from req.body.
    const s3Key = report.s3Key;

    // HeadObject: verify the object actually exists in S3.
    const meta = await getObjectMetadata(s3Key);
    if (!meta) {
      auditLog('confirm_upload_not_in_s3', { userId, reportId: pendingReportId });
      return res.status(422).json({ error: 'File not found in storage. Please re-upload.' });
    }

    // Verify ContentType matches what was declared at presign time.
    if (meta.ContentType !== report.mimeType) {
      await MedicalReport.findByIdAndUpdate(pendingReportId, { uploadStatus: 'rejected' });
      auditLog('confirm_upload_mime_mismatch', {
        userId,
        reportId:     pendingReportId,
        declared:     report.mimeType,
        actual:       meta.ContentType,
      });
      return res.status(422).json({ error: 'File content type does not match declared type.' });
    }

    // Verify actual size is within the 10 MB limit.
    if ((meta.ContentLength ?? 0) > MAX_FILE_SIZE_BYTES) {
      await MedicalReport.findByIdAndUpdate(pendingReportId, { uploadStatus: 'rejected' });
      auditLog('confirm_upload_size_exceeded', { userId, reportId: pendingReportId, size: meta.ContentLength });
      return res.status(422).json({ error: 'Uploaded file exceeds the 10 MB size limit.' });
    }

    // Magic byte validation — download first 16 bytes via presigned GET.
    // Mark as 'uploaded' first (object exists) then validate signature.
    let magicBytesValid = false;
    try {
      const downloadUrl = await getPresignedDownloadUrl(s3Key);
      const header = await fetchFirstBytes(downloadUrl, 16);
      magicBytesValid = validateFileMagicBytes(header, report.mimeType);
    } catch (magicErr: any) {
      // If magic byte check fails due to a network error, log and continue
      // with 'uploaded' status — do not block the user on a transient error.
      auditLog('confirm_upload_magic_check_error', { userId, reportId: pendingReportId, error: magicErr.message });
    }

    const finalStatus = magicBytesValid ? 'verified' : 'uploaded';

    if (!magicBytesValid) {
      auditLog('confirm_upload_magic_failed', {
        userId,
        reportId: pendingReportId,
        mimeType: report.mimeType,
        note:     'File set to uploaded status — magic bytes did not match. Manual review required.',
      });
    }

    await MedicalReport.findByIdAndUpdate(pendingReportId, {
      uploadStatus:     finalStatus,
      fileSize:         meta.ContentLength ?? report.fileSize,
      verifiedAt:       finalStatus === 'verified' ? new Date() : null,
      presignExpiresAt: null,   // clear TTL field so the record is not auto-deleted
    });

    auditLog('confirm_upload_success', {
      userId,
      reportId:     pendingReportId,
      uploadStatus: finalStatus,
      fileSize:     meta.ContentLength,
    });

    return res.status(200).json({
      message:      finalStatus === 'verified' ? 'Upload confirmed and verified.' : 'Upload confirmed. Pending content review.',
      reportId:     pendingReportId,
      uploadStatus: finalStatus,
    });
  } catch (err: any) {
    auditLog('confirm_upload_error', { userId, reportId: pendingReportId, error: err.message });
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/:id/download
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns a short-lived presigned GET URL for an authorized, verified S3 file.
 * Also handles legacy Cloudinary reports (returns fileUrl directly).
 *
 * Authorization:
 *  - PATIENT: can only download their own reports.
 *  - DOCTOR: can only download reports of patients with whom they have an
 *    existing appointment relationship. Role alone is not sufficient.
 *
 * Security:
 *  - Prevents IDOR: report ID is validated against the authenticated user.
 *  - Only 'verified' S3 files are served. 'pending' and 'uploaded' files
 *    are not accessible until verification passes.
 *  - Presigned URL is not logged.
 *  - Response includes Cache-Control: no-store to prevent browser caching
 *    of the time-limited URL.
 */
export const downloadReport = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const role   = req.user!.role;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid report ID.' });
  }

  try {
    const report = await MedicalReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    // ── Authorization ─────────────────────────────────────────────────────
    if (role === 'PATIENT') {
      // Patients can only access their own reports.
      if (report.patientId.toString() !== userId) {
        auditLog('download_unauthorized_patient', { userId, reportId: id });
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (role === 'DOCTOR') {
      // Doctor can only download if this report was explicitly shared with them.
      if (!report.sharedWithDoctorId || report.sharedWithDoctorId.toString() !== userId) {
        auditLog('download_unauthorized_doctor', { userId, reportId: id, patientId: report.patientId });
        return res.status(403).json({ error: 'This report has not been shared with you.' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // ── Cloudinary legacy path ────────────────────────────────────────────
    if (report.storageProvider === 'cloudinary') {
      res.set('Cache-Control', 'no-store, private');
      return res.json({
        fileUrl:  report.fileUrl,
        fileType: report.fileType,
        name:     report.name,
        source:   'cloudinary',
      });
    }

    // ── S3 path ───────────────────────────────────────────────────────────
    // Only serve verified files. Pending/uploaded files are quarantined.
    if (report.uploadStatus !== 'verified') {
      return res.status(403).json({
        error: `File is not yet available for download (status: ${report.uploadStatus}).`,
      });
    }

    const presignedUrl = await getPresignedDownloadUrl(report.s3Key);

    auditLog('download_issued', {
      userId,
      role,
      reportId: id,
      source:   's3',
    });

    res.set('Cache-Control', 'no-store, private');
    return res.json({
      fileUrl:  presignedUrl,
      fileType: report.mimeType || report.fileType,
      name:     report.name,
      source:   's3',
      expiresIn: 300,
    });
  } catch (err: any) {
    auditLog('download_error', { userId, reportId: id, error: err.message });
    return res.status(500).json({ error: err.message });
  }
};

// ── Utility ───────────────────────────────────────────────────────────────────
function sanitiseFileName(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9.\-_ ]/g, '')
    .trim()
    .slice(0, 200);
}
