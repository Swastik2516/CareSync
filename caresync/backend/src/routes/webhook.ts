import { Router } from 'express';
import express from 'express';
import { razorpayWebhook } from '../controllers/webhookController';

const router = Router();

// CRITICAL: express.raw must be applied here — NOT express.json()
// Razorpay signature verification requires the exact raw request body bytes
router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  razorpayWebhook
);

export default router;
