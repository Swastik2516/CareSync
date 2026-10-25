import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Appointment } from '../models/Appointment';
import { getRazorpay } from '../config/razorpay';

// ─── POST /api/payments/create-order ─────────────────────────────────────────
// Creates a Razorpay order for a given appointment.
// Returns orderId, amount, currency and keyId to the frontend.
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId, amount } = req.body;

    // 1. Validate inputs
    if (!appointmentId || !amount) {
      return res.status(400).json({ error: 'appointmentId and amount are required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number (INR)' });
    }

    // 2. Fetch appointment and verify it belongs to the requesting patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.patientId.toString() !== req.user?.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 3. Prevent duplicate orders for already-paid appointments
    if (appointment.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'This appointment is already paid' });
    }

    // 4. Create Razorpay order (amount must be in paise: INR × 100)
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),   // paise
      currency: 'INR',
      receipt: `rcpt_${appointmentId.toString().slice(-8)}`,
      notes: {
        appointmentId: appointmentId.toString(),
        patientId:     req.user?.userId ?? '',
        doctorId:      appointment.doctorId.toString(),
      },
    });

    // 5. Persist the order ID and amount on the appointment
    appointment.razorpayOrderId = order.id;
    appointment.amount          = amount;
    await appointment.save();

    return res.status(201).json({
      success:  true,
      orderId:  order.id,
      amount:   order.amount,       // paise (Razorpay standard)
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
