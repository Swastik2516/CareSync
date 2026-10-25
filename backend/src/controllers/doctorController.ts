import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DoctorProfile } from '../models/DoctorProfile';
import { Availability } from '../models/Availability';
import { Appointment } from '../models/Appointment';
import { AuthRequest } from '../middleware/auth';
import cloudinary from '../config/cloudinary';

// Returns current date string and hour number in IST using Intl API
function istNow() {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false,
    }).format(now),
    10
  );
  return { todayStr, currentHour };
}

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

    const { todayStr, currentHour } = istNow();

    const reqDate = date as string;
    if (reqDate < todayStr) {
      return res.json([]);
    }

    const slots = await Availability.find({
      doctorId: new mongoose.Types.ObjectId(doctorId as string),
      date: reqDate
    });

    const validSlots = slots.filter(slot => {
      if (slot.startTime === '13:00') return false; // lunch break
      if (reqDate === todayStr) {
        return parseInt(slot.startTime) >= currentHour;
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

export const updateDoctorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { specialization, hospital, experience, consultationFee, bio } = req.body;
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user?.userId },
      { $set: { specialization, hospital, experience, consultationFee, bio } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });
    return res.json({ message: 'Profile updated successfully', profile });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    const { fileData, fileType } = req.body;
    if (!fileData || !fileType) return res.status(400).json({ error: 'fileData and fileType are required' });
    const uploaded = await cloudinary.uploader.upload(fileData, {
      folder: 'caresync/profiles',
      resource_type: 'image',
    });
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user?.userId },
      { $set: { profileImage: uploaded.secure_url } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });
    return res.json({ profileImage: uploaded.secure_url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const setAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { date, slots } = req.body; // slots: [{ startTime, endTime }]
    const doctorId = req.user?.userId;

    const { todayStr, currentHour } = istNow();

    if (date < todayStr) {
      return res.status(400).json({ error: 'Cannot set availability for past dates.' });
    }

    const validSlots = (slots || []).filter((s: { startTime: string }) => {
      if (s.startTime === '13:00') return false; // lunch break
      if (date === todayStr) {
        return parseInt(s.startTime) >= currentHour;
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
