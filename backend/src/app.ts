import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes        from './routes/auth';
import doctorRoutes      from './routes/doctor';
import appointmentRoutes from './routes/appointment';
import paymentRoutes     from './routes/payment';
import webhookRoutes     from './routes/webhook';
import reportRoutes      from './routes/report';

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// ── CRITICAL: Webhook route BEFORE express.json() ────────────────────────────
app.use('/api/webhooks', webhookRoutes);

// ── Global JSON parser ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.',
}));

// ── Lazy DB connection (works on Vercel serverless) ───────────────────────────
let dbConnected = false;
app.use(async (_req, _res, next) => {
  if (!dbConnected) {
    try {
      await mongoose.connect(process.env.MONGO_URI as string);
      dbConnected = true;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/doctors',      doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments',     paymentRoutes);
app.use('/api/reports',      reportRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.status(200).send('CareSync API running'));

// ── Local dev server (not used on Vercel) ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT) || 8080;
  app.listen(PORT, () => console.log(`CareSync Backend running on port ${PORT}`));
}

export default app;
