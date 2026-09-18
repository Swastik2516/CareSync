import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment';
import { PaymentLog } from '../models/PaymentLog';

// ─── POST /api/webhooks/razorpay ──────────────────────────────────────────────
// Receives Razorpay webhook events, verifies HMAC signature,
// and atomically updates Appointment + creates PaymentLog.
export const razorpayWebhook = async (req: Request, res: Response) => {
  // Always acknowledge immediately — Razorpay retries if it doesn't get 200
  // We do all processing before sending 200 but never let errors block the ack.

  try {
    // ── 1. Signature Verification ───────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET as string;
    const receivedSig   = req.headers['x-razorpay-signature'] as string;

    if (!receivedSig) {
      console.error('[Webhook] Missing x-razorpay-signature header');
      return res.status(200).json({ status: 'ignored' });
    }

    // req.body is a raw Buffer (express.raw middleware applied on this route)
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body as Buffer)
      .digest('hex');

    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSig, 'hex'),
      Buffer.from(receivedSig, 'hex')
    );

    if (!signaturesMatch) {
      console.error('[Webhook] Signature mismatch — possible spoofed request');
      return res.status(200).json({ status: 'ignored' });
    }

    // ── 2. Parse payload ────────────────────────────────────────────────────
    const payload = JSON.parse((req.body as Buffer).toString('utf8'));
    const event   = payload?.event as string;
    const payment = payload?.payload?.payment?.entity;

    console.log(`[Webhook] Event received: ${event}`);

    // ── 3. Handle payment.captured ─────────────────────────────────────────
    if (event === 'payment.captured') {
      const appointmentId    = payment?.notes?.appointmentId;
      const razorpayPaymentId = payment?.id;
      const razorpayOrderId   = payment?.order_id;
      const capturedAmount    = payment?.amount;   // paise
      const method            = payment?.method;

      if (!appointmentId) {
        console.error('[Webhook] payment.captured missing appointmentId in notes');
        return res.status(200).json({ status: 'ignored' });
      }

      // Fetch appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        console.error(`[Webhook] Appointment ${appointmentId} not found`);
        return res.status(200).json({ status: 'ignored' });
      }

      // ── Idempotency check — skip if already marked PAID ──────────────────
      if (appointment.paymentStatus === 'PAID') {
        console.log(`[Webhook] Appointment ${appointmentId} already PAID — skipping`);
        return res.status(200).json({ status: 'already_processed' });
      }

      // ── Amount validation ─────────────────────────────────────────────────
      const expectedPaise = Math.round(appointment.amount * 100);
      if (capturedAmount !== expectedPaise) {
        console.error(`[Webhook] Amount mismatch: expected ${expectedPaise}, got ${capturedAmount}`);
        return res.status(200).json({ status: 'amount_mismatch' });
      }

      // ── Atomic transaction: update Appointment + create PaymentLog ────────
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await Appointment.findByIdAndUpdate(
          appointmentId,
          {
            paymentStatus:     'PAID',
            razorpayPaymentId,
            razorpayOrderId,
            paidAt:            new Date(),
          },
          { session }
        );

        await PaymentLog.create([{
          appointmentId,
          razorpayPaymentId,
          razorpayOrderId,
          amount:     capturedAmount / 100,   // store in INR
          currency:   payment?.currency ?? 'INR',
          status:     'captured',
          method,
          rawPayload: payload,
        }], { session });

        await session.commitTransaction();
        console.log(`[Webhook] Payment captured — Appointment ${appointmentId} marked PAID`);
      } catch (txErr: any) {
        await session.abortTransaction();
        console.error('[Webhook] Transaction failed:', txErr.message);
      } finally {
        session.endSession();
      }
    }

    // ── 4. Handle payment.failed ───────────────────────────────────────────
    else if (event === 'payment.failed') {
      const appointmentId = payment?.notes?.appointmentId;
      if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, { paymentStatus: 'FAILED' });
        console.log(`[Webhook] Payment failed — Appointment ${appointmentId} marked FAILED`);
      }
    }

    // ── 5. Acknowledge all other events ────────────────────────────────────
    return res.status(200).json({ status: 'ok' });

  } catch (error: any) {
    // Never return non-200 — Razorpay would keep retrying
    console.error('[Webhook] Unhandled error:', error.message);
    return res.status(200).json({ status: 'error' });
  }
};
