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
app.use(cors({ origin: '*' }));

// ── CRITICAL: Webhook route registered BEFORE express.json() ─────────────────
// The webhook controller applies express.raw() per-route to capture raw buffer.
// If express.json() runs first globally, the raw body is lost and HMAC fails.
app.use('/api/webhooks', webhookRoutes);

// ── Global JSON parser (all other routes) ────────────────────────────────────
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.',
}));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/doctors',      doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments',     paymentRoutes);
app.use('/api/reports',      reportRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.status(200).send('CareSync API running safely'));

// ── Database + Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, () => console.log(`CareSync Backend running on port ${PORT}`));
  })
  .catch((err) => console.error('DB Connection Error:', err));
