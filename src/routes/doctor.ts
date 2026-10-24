import { Router } from 'express';
import { getAllDoctors, getDoctorById, getDoctorAvailability, setAvailability, updateDoctorProfile } from '../controllers/doctorController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
router.get('/', getAllDoctors);
router.get('/availability', getDoctorAvailability);
router.post('/availability', authenticateToken, requireRole('DOCTOR'), setAvailability);
router.patch('/profile', authenticateToken, requireRole('DOCTOR'), updateDoctorProfile);
router.get('/:id', getDoctorById);

export default router;
