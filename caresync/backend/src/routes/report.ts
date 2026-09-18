import { Router } from 'express';
import { uploadReport, getMyReports, getReportFile, deleteReport } from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
router.post('/',        authenticateToken, requireRole('PATIENT'), uploadReport);
router.get('/',         authenticateToken, requireRole('PATIENT'), getMyReports);
router.get('/:id/file', authenticateToken, requireRole('PATIENT'), getReportFile);
router.delete('/:id',   authenticateToken, requireRole('PATIENT'), deleteReport);

export default router;
