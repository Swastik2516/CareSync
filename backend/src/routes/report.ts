import { Router } from 'express';
import { uploadReport, getMyReports, getReportFile, deleteReport } from '../controllers/reportController';
import { presignUpload, confirmUpload, downloadReport } from '../controllers/s3ReportController';
import { authenticateToken, requireRole } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

// ── Rate limiter for presign endpoint ─────────────────────────────────────────
// Prevents presigned URL farming: max 20 presign requests per IP per 15 min.
// Applied after authenticateToken so only authenticated requests reach it.
const presignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { error: 'Too many upload requests. Please wait before trying again.' },
});

const router = Router();

// ── Existing Cloudinary routes (unchanged) ────────────────────────────────────
router.post('/',        authenticateToken, requireRole('PATIENT'), uploadReport);
router.get('/',         authenticateToken, requireRole('PATIENT'), getMyReports);
router.get('/:id/file', authenticateToken, requireRole('PATIENT'), getReportFile);
router.delete('/:id',   authenticateToken, requireRole('PATIENT'), deleteReport);

// ── New S3 routes ─────────────────────────────────────────────────────────────
// presign-upload and confirm-upload must be declared BEFORE /:id routes
// to prevent Express matching 'presign-upload' as a report ID.
router.post('/presign-upload',  authenticateToken, requireRole('PATIENT'), presignLimiter, presignUpload);
router.post('/confirm-upload',  authenticateToken, requireRole('PATIENT'), confirmUpload);

// Download works for both PATIENT and DOCTOR — authorization is handled inside
// the controller based on role and appointment relationship.
router.get('/:id/download', authenticateToken, downloadReport);

export default router;
