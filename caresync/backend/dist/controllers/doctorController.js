"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAvailability = exports.getDoctorAvailability = exports.getDoctorById = exports.getAllDoctors = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const DoctorProfile_1 = require("../models/DoctorProfile");
const Availability_1 = require("../models/Availability");
const Appointment_1 = require("../models/Appointment");
const getAllDoctors = async (_req, res) => {
    try {
        const doctors = await DoctorProfile_1.DoctorProfile.find().populate('userId', 'name email');
        return res.json(doctors);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getAllDoctors = getAllDoctors;
const getDoctorById = async (req, res) => {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        const doctor = await DoctorProfile_1.DoctorProfile.findOne({ userId: req.params.id }).populate('userId', 'name email phone');
        if (!doctor)
            return res.status(404).json({ error: 'Doctor not found' });
        return res.json(doctor);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getDoctorById = getDoctorById;
const getDoctorAvailability = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date || !mongoose_1.default.Types.ObjectId.isValid(doctorId)) {
            return res.json([]);
        }
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const reqDate = date;
        if (reqDate < todayStr) {
            return res.json([]);
        }
        const slots = await Availability_1.Availability.find({
            doctorId: new mongoose_1.default.Types.ObjectId(doctorId),
            date: reqDate
        });
        const validSlots = slots.filter(slot => {
            if (reqDate === todayStr) {
                return slot.startTime > currentHHMM;
            }
            return true;
        });
        const slotsWithCount = await Promise.all(validSlots.map(async (slot) => {
            const bookedCount = await Appointment_1.Appointment.countDocuments({
                doctorId: new mongoose_1.default.Types.ObjectId(doctorId),
                date: reqDate,
                timeSlot: slot.startTime,
                status: { $in: ['PENDING', 'CONFIRMED'] }
            });
            return { time: slot.startTime, bookedCount };
        }));
        return res.json(slotsWithCount);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getDoctorAvailability = getDoctorAvailability;
const setAvailability = async (req, res) => {
    try {
        const { date, slots } = req.body; // slots: [{ startTime, endTime }]
        const doctorId = req.user?.userId;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (date < todayStr) {
            return res.status(400).json({ error: 'Cannot set availability for past dates.' });
        }
        const validSlots = (slots || []).filter((s) => {
            if (date === todayStr) {
                return s.startTime > currentHHMM;
            }
            return true;
        });
        if (validSlots.length === 0) {
            return res.status(400).json({ error: 'Selected time slots have already passed for today. Please select future hours.' });
        }
        const ops = validSlots.map((s) => ({
            updateOne: {
                filter: { doctorId, date, startTime: s.startTime },
                update: { $set: { doctorId, date, startTime: s.startTime, endTime: s.endTime } },
                upsert: true
            }
        }));
        await Availability_1.Availability.bulkWrite(ops);
        return res.json({ message: 'Availability updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.setAvailability = setAvailability;
