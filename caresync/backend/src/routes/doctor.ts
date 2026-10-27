import { Router } from 'express';
import { getAllDoctors, getDoctorById, getDoctorAvailability, setAvailability, updateDoctorProfile, uploadProfileImage, cleanPastAvailability } from '../controllers/doctorController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
router.get('/', getAllDoctors);
router.get('/availability', getDoctorAvailability);
router.post('/availability', authenticateToken, requireRole('DOCTOR'), setAvailability);
router.delete('/availability/cleanup', async (_req, res) => {
  await cleanPastAvailability();
  res.json({ message: 'Past availability slots cleaned' });
});
router.patch('/profile', authenticateToken, requireRole('DOCTOR'), updateDoctorProfile);
router.post('/profile-image', authenticateToken, requireRole('DOCTOR'), uploadProfileImage);
router.get('/:id', getDoctorById);

export default router;
