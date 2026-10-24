import { Router } from 'express';
import { register, login, forgotPassword, verifyOTP, resetPassword, deleteAccount, doctorSlot } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.get('/doctor-slot', doctorSlot);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.delete('/account', authenticateToken, deleteAccount);

export default router;
