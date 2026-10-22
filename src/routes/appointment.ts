import { Router } from 'express';
import {
  bookAppointment,
  getPatientAppointments,
  getPatientHistory,
  getPatientNotifications,
  markNotificationRead,
  rescheduleAppointment,
  getDoctorAppointments,
  getDoctorHistory,
  updateAppointmentStatus,
  markPaymentPaid,
  saveTreatment,
  getPatientReportsForDoctor,
  getPatientReportFileForDoctor,
} from '../controllers/appointmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
router.post('/book', authenticateToken, requireRole('PATIENT'), bookAppointment);
router.get('/my', authenticateToken, requireRole('PATIENT'), getPatientAppointments);
router.get('/history', authenticateToken, requireRole('PATIENT'), getPatientHistory);
router.get('/notifications', authenticateToken, requireRole('PATIENT'), getPatientNotifications);
router.patch('/:appointmentId/notifications/:notifId/read', authenticateToken, requireRole('PATIENT'), markNotificationRead);
router.patch('/:id/reschedule', authenticateToken, requireRole('PATIENT'), rescheduleAppointment);
router.get('/doctor', authenticateToken, requireRole('DOCTOR'), getDoctorAppointments);
router.get('/doctor/history', authenticateToken, requireRole('DOCTOR'), getDoctorHistory);
router.get('/patient/:patientId/reports', authenticateToken, requireRole('DOCTOR'), getPatientReportsForDoctor);
router.get('/patient/:patientId/reports/:reportId/file', authenticateToken, requireRole('DOCTOR'), getPatientReportFileForDoctor);
router.patch('/:id/status', authenticateToken, requireRole('DOCTOR'), updateAppointmentStatus);
router.patch('/:id/payment-status', authenticateToken, requireRole('DOCTOR'), markPaymentPaid);
router.patch('/:id/treatment', authenticateToken, requireRole('DOCTOR'), saveTreatment);

export default router;
