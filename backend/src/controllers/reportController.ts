import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MedicalReport } from '../models/MedicalReport';
import { deleteS3Object } from '../services/s3Service';
import { isS3Configured } from '../config/s3';

// ── POST / — Deprecated: use S3 flow ─────────────────────────────────────────
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
      uploadStatus: { $in: ['verified', 'uploaded'] },
    })
      .select('-publicId -s3Key -presignExpiresAt')
      .sort({ uploadedAt: -1 });
    return res.json(reports);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── GET /:id/file — Legacy file access ────────────────────────────────────────
export const getReportFile = async (req: AuthRequest, res: Response) => {
  try {
    const report = await MedicalReport.findOne({
      _id:       req.params.id,
      patientId: req.user?.userId,
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });

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

// ── DELETE /:id — Hard delete from S3 + MongoDB ───────────────────────────────
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await MedicalReport.findOne({
      _id:       req.params.id,
      patientId: req.user?.userId,
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // Hard delete S3 object if configured and key exists
    if (report.storageProvider === 's3' && report.s3Key && isS3Configured()) {
      try {
        await deleteS3Object(report.s3Key);
      } catch (s3Err: any) {
        // Log but don't block — still remove MongoDB record
        console.error('[deleteReport] S3 delete failed:', s3Err.message);
      }
    }

    await report.deleteOne();
    return res.json({ message: 'Report permanently deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
