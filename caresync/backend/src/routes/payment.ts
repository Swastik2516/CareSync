import { Router } from 'express';
import { createOrder } from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Only authenticated patients can initiate payments
router.post('/create-order', authenticateToken, requireRole('PATIENT'), createOrder);

export default router;
