import { Router } from 'express';
import { getAllDoctors, getDoctorById, getDoctorAvailability, setAvailability } from '../controllers/doctorController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
router.get('/', getAllDoctors);
router.get('/availability', getDoctorAvailability);
router.post('/availability', authenticateToken, requireRole('DOCTOR'), setAvailability);
router.get('/:id', getDoctorById);

export default router;
