import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DoctorProfile } from '../models/DoctorProfile';
import { Availability } from '../models/Availability';
import { Appointment } from '../models/Appointment';
import { AuthRequest } from '../middleware/auth';

export const getAllDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await DoctorProfile.find().populate('userId', 'name email');
    return res.json(doctors);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    const doctor = await DoctorProfile.findOne({ userId: req.params.id }).populate('userId', 'name email phone');
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    return res.json(doctor);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date || !mongoose.Types.ObjectId.isValid(doctorId as string)) {
      return res.json([]);
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const reqDate = date as string;
    if (reqDate < todayStr) {
      return res.json([]);
    }

    const slots = await Availability.find({
      doctorId: new mongoose.Types.ObjectId(doctorId as string),
      date: reqDate
    });

    const validSlots = slots.filter(slot => {
      if (reqDate === todayStr) {
        return slot.startTime > currentHHMM;
      }
      return true;
    });

    const slotsWithCount = await Promise.all(
      validSlots.map(async (slot) => {
        const bookedCount = await Appointment.countDocuments({
          doctorId: new mongoose.Types.ObjectId(doctorId as string),
          date: reqDate,
          timeSlot: slot.startTime,
          status: { $in: ['PENDING', 'CONFIRMED'] }
        });
        return { time: slot.startTime, bookedCount };
      })
    );

    return res.json(slotsWithCount);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const setAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { date, slots } = req.body; // slots: [{ startTime, endTime }]
    const doctorId = req.user?.userId;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (date < todayStr) {
      return res.status(400).json({ error: 'Cannot set availability for past dates.' });
    }

    const validSlots = (slots || []).filter((s: { startTime: string }) => {
      if (date === todayStr) {
        return s.startTime > currentHHMM;
      }
      return true;
    });

    if (validSlots.length === 0) {
      return res.status(400).json({ error: 'Selected time slots have already passed for today. Please select future hours.' });
    }

    const ops = validSlots.map((s: { startTime: string; endTime: string }) => ({
      updateOne: {
        filter: { doctorId, date, startTime: s.startTime },
        update: { $set: { doctorId, date, startTime: s.startTime, endTime: s.endTime } },
        upsert: true
      }
    }));

    await Availability.bulkWrite(ops);
    return res.json({ message: 'Availability updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
