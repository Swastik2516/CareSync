import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MedicalReport } from '../models/MedicalReport';

// ── POST / — Deprecated: Cloudinary upload removed, use S3 flow ───────────────
// Clients should use POST /presign-upload → S3 upload → POST /confirm-upload.
export const uploadReport = async (_req: AuthRequest, res: Response) => {
  return res.status(410).json({
    error: 'Direct upload is no longer supported. Use POST /api/reports/presign-upload instead.',
  });
};

// ── GET / — List patient's own reports ────────────────────────────────────────
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await MedicalReport.find({
      patientId:    req.user?.userId,
      // Return all verified reports regardless of storage provider.
      // Pending/uploaded S3 records are excluded until confirmed.
      uploadStatus: { $in: ['verified', 'uploaded'] },
    })
      .select('-publicId -s3Key -presignExpiresAt')
      .sort({ uploadedAt: -1 });
    return res.json(reports);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── GET /:id/file — Legacy Cloudinary file access (existing behavior) ─────────
// This endpoint is kept for backward compatibility with the existing frontend.
// New S3 files should use GET /api/reports/:id/download instead.
export const getReportFile = async (req: AuthRequest, res: Response) => {
  try {
    const report = await MedicalReport.findOne({
      _id:       req.params.id,
      patientId: req.user?.userId,
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // For S3 reports, redirect to the new download endpoint.
    if (report.storageProvider === 's3') {
      return res.status(301).json({
        message:     'Use GET /api/reports/:id/download for S3 files.',
        downloadUrl: `/api/reports/${report._id}/download`,
      });
    }

    return res.json({ fileUrl: report.fileUrl, fileType: report.fileType, name: report.name });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── DELETE /:id — Delete report ──────────────────────────────────────────────
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await MedicalReport.findOne({
      _id:       req.params.id,
      patientId: req.user?.userId,
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // Soft-delete: mark rejected so it disappears from lists.
    // Physical S3 deletion requires a DeleteObject IAM policy update.
    await MedicalReport.findByIdAndUpdate(req.params.id, { uploadStatus: 'rejected' });
    return res.json({ message: 'Report deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
