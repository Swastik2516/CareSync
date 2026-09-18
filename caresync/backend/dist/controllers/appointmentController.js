"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientReportFileForDoctor = exports.getPatientReportsForDoctor = exports.saveTreatment = exports.markPaymentPaid = exports.updateAppointmentStatus = exports.getDoctorHistory = exports.getDoctorAppointments = exports.markNotificationRead = exports.getPatientNotifications = exports.getPatientHistory = exports.getPatientAppointments = exports.rescheduleAppointment = exports.bookAppointment = exports.autoExpireAppointments = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Appointment_1 = require("../models/Appointment");
const Availability_1 = require("../models/Availability");
const MedicalReport_1 = require("../models/MedicalReport");
const ACTIVE = ['PENDING', 'CONFIRMED'];
const TERMINAL = ['COMPLETED', 'CANCELLED', 'MISSED', 'RESCHEDULED'];
// ── Auto Expire Missed Appointments ─────────────────────────────────────────
const autoExpireAppointments = async () => {
    try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const activeAppts = await Appointment_1.Appointment.find({
            status: { $in: ACTIVE }
        }).populate('doctorId', 'name');
        for (const appt of activeAppts) {
            let isExpired = false;
            if (appt.date < todayStr) {
                isExpired = true;
            }
            else if (appt.date === todayStr) {
                const [hhStr, mmStr] = appt.timeSlot.split(':');
                const endHour = parseInt(hhStr, 10) + 1;
                const endTimeStr = `${String(endHour).padStart(2, '0')}:${mmStr || '00'}`;
                if (currentHHMM >= endTimeStr) {
                    isExpired = true;
                }
            }
            if (isExpired) {
                appt.status = 'MISSED';
                const docName = appt.doctorId?.name || 'Doctor';
                appt.notifications.push({
                    message: `Your appointment with Dr. ${docName} on ${appt.date} at ${appt.timeSlot} was missed as the scheduled time limit passed. Please reschedule your appointment.`,
                    read: false,
                    createdAt: new Date()
                });
                await appt.save();
            }
        }
    }
    catch (err) {
        console.error('Error auto-expiring appointments:', err);
    }
};
exports.autoExpireAppointments = autoExpireAppointments;
// ── Book appointment ──────────────────────────────────────────────────────────
const bookAppointment = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { doctorId, date, timeSlot, reason } = req.body;
        const patientId = req.user?.userId;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (date < todayStr) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Cannot book appointments for past dates.' });
        }
        if (date === todayStr && timeSlot <= currentHHMM) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'This time slot has already passed. Please select a future time slot.' });
        }
        const availability = await Availability_1.Availability.findOne({ doctorId, date, startTime: timeSlot }).session(session);
        if (!availability) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Doctor is not available at this hour.' });
        }
        const activeCount = await Appointment_1.Appointment.countDocuments({
            doctorId, date, timeSlot, status: { $in: ACTIVE }
        }).session(session);
        if (activeCount >= 10) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Slot fully booked', message: 'Maximum capacity of 10 patients reached.' });
        }
        const appointmentId = `CS-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const appointment = new Appointment_1.Appointment({ appointmentId, doctorId, patientId, date, timeSlot, reason, status: 'CONFIRMED' });
        await appointment.save({ session });
        await session.commitTransaction();
        return res.status(201).json({ message: 'Appointment booked successfully', appointment, slotsRemaining: 10 - (activeCount + 1) });
    }
    catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ error: 'Booking failed', details: error.message });
    }
    finally {
        session.endSession();
    }
};
exports.bookAppointment = bookAppointment;
// ── Patient: reschedule appointment ─────────────────────────────────────────
const rescheduleAppointment = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const appointmentId = req.params.id;
        const { newDate, newTimeSlot } = req.body;
        const patientId = req.user?.userId;
        const appointment = await Appointment_1.Appointment.findOne({ _id: appointmentId, patientId }).session(session);
        if (!appointment) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'Appointment not found.' });
        }
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (newDate < todayStr) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Cannot reschedule to a past date.' });
        }
        if (newDate === todayStr && newTimeSlot <= currentHHMM) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'This time slot has already passed. Please select a future time slot.' });
        }
        const availability = await Availability_1.Availability.findOne({ doctorId: appointment.doctorId, date: newDate, startTime: newTimeSlot }).session(session);
        if (!availability) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Doctor is not available at this hour on the selected date.' });
        }
        const activeCount = await Appointment_1.Appointment.countDocuments({
            doctorId: appointment.doctorId,
            date: newDate,
            timeSlot: newTimeSlot,
            status: { $in: ACTIVE },
            _id: { $ne: appointment._id }
        }).session(session);
        if (activeCount >= 10) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Slot fully booked', message: 'Maximum capacity of 10 patients reached for this slot.' });
        }
        appointment.date = newDate;
        appointment.timeSlot = newTimeSlot;
        appointment.status = 'CONFIRMED';
        appointment.notifications.push({
            message: `Your appointment has been successfully rescheduled for ${newDate} at ${newTimeSlot}.`,
            read: false,
            createdAt: new Date()
        });
        await appointment.save({ session });
        await session.commitTransaction();
        return res.json({ message: 'Appointment rescheduled successfully', appointment });
    }
    catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ error: 'Reschedule failed', details: error.message });
    }
    finally {
        session.endSession();
    }
};
exports.rescheduleAppointment = rescheduleAppointment;
// ── Patient: active upcoming ──────────────────────────────────────────────────
const getPatientAppointments = async (req, res) => {
    try {
        await (0, exports.autoExpireAppointments)();
        const today = new Date().toISOString().split('T')[0];
        const appointments = await Appointment_1.Appointment.find({
            patientId: req.user?.userId,
            status: { $in: ACTIVE },
            date: { $gte: today },
        }).populate('doctorId', 'name').sort({ date: 1, timeSlot: 1 });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientAppointments = getPatientAppointments;
// ── Patient: history (completed / cancelled / missed) ─────────────────────────
const getPatientHistory = async (req, res) => {
    try {
        await (0, exports.autoExpireAppointments)();
        const appointments = await Appointment_1.Appointment.find({
            patientId: req.user?.userId,
            status: { $in: TERMINAL },
        }).populate('doctorId', 'name').sort({ date: -1 });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientHistory = getPatientHistory;
// ── Patient: unread notifications ─────────────────────────────────────────────
const getPatientNotifications = async (req, res) => {
    try {
        await (0, exports.autoExpireAppointments)();
        const appointments = await Appointment_1.Appointment.find({
            patientId: req.user?.userId,
            'notifications.read': false,
        }).populate('doctorId', 'name').select('notifications appointmentId date timeSlot doctorId');
        const notifications = [];
        appointments.forEach(a => {
            a.notifications
                .filter((n) => !n.read)
                .forEach((n) => {
                notifications.push({
                    appointmentId: a._id,
                    appointmentRef: a.appointmentId,
                    doctorId: a.doctorId?._id || a.doctorId,
                    doctorName: a.doctorId?.name || 'Doctor',
                    date: a.date,
                    timeSlot: a.timeSlot,
                    message: n.message,
                    notifId: n._id,
                    createdAt: n.createdAt,
                });
            });
        });
        return res.json(notifications);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientNotifications = getPatientNotifications;
// ── Patient: mark notification read ──────────────────────────────────────────
const markNotificationRead = async (req, res) => {
    try {
        await Appointment_1.Appointment.updateOne({ _id: req.params.appointmentId, patientId: req.user?.userId, 'notifications._id': req.params.notifId }, { $set: { 'notifications.$.read': true } });
        return res.json({ message: 'Marked as read' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.markNotificationRead = markNotificationRead;
// ── Doctor: active appointments (today and future only) ───────────────────────
const getDoctorAppointments = async (req, res) => {
    try {
        await (0, exports.autoExpireAppointments)();
        const today = new Date().toISOString().split('T')[0];
        const appointments = await Appointment_1.Appointment.find({
            doctorId: req.user?.userId,
            status: { $in: ACTIVE },
            date: { $gte: today },
        }).populate('patientId', 'name email').sort({ date: 1, timeSlot: 1 });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getDoctorAppointments = getDoctorAppointments;
// ── Doctor: history (optional date filter) ────────────────────────────────────
const getDoctorHistory = async (req, res) => {
    try {
        const { date } = req.query;
        const filter = { doctorId: req.user?.userId, status: { $in: TERMINAL } };
        if (date)
            filter.date = date;
        const appointments = await Appointment_1.Appointment.find(filter)
            .populate('patientId', 'name email')
            .sort({ date: -1, timeSlot: 1 });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getDoctorHistory = getDoctorHistory;
// ── Doctor: update status (allows early completion WITH a reason) ────────────
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status, earlyReason } = req.body;
        const appointment = await Appointment_1.Appointment.findOne({ _id: req.params.id, doctorId: req.user?.userId });
        if (!appointment)
            return res.status(404).json({ error: 'Appointment not found' });
        if (status === 'COMPLETED') {
            const today = new Date().toISOString().split('T')[0];
            if (appointment.date > today) {
                if (!earlyReason || !earlyReason.trim()) {
                    return res.status(400).json({
                        error: `This appointment is scheduled for ${appointment.date}. To mark it completed early (e.g. patient visited early), please provide a reason.`
                    });
                }
                appointment.notes = appointment.notes
                    ? `${appointment.notes}\n[Early Completion Reason]: ${earlyReason.trim()}`
                    : `[Early Completion Reason]: ${earlyReason.trim()}`;
            }
        }
        appointment.status = status;
        await appointment.save();
        return res.json(appointment);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
// ── Doctor: mark payment paid (cash/clinic payment) ─────────────────────────
const markPaymentPaid = async (req, res) => {
    try {
        const appointment = await Appointment_1.Appointment.findOneAndUpdate({ _id: req.params.id, doctorId: req.user?.userId }, { $set: { paymentStatus: 'PAID', paidAt: new Date() } }, { new: true });
        if (!appointment)
            return res.status(404).json({ error: 'Appointment not found' });
        return res.json(appointment);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.markPaymentPaid = markPaymentPaid;
// ── Doctor: save treatment + medicines ───────────────────────────────────────
const saveTreatment = async (req, res) => {
    try {
        const { treatment, medicines, notes, precautions } = req.body;
        // medicines: [{ name, dosage, duration }]
        const appointment = await Appointment_1.Appointment.findOneAndUpdate({ _id: req.params.id, doctorId: req.user?.userId }, { $set: { treatment, medicines: medicines ?? [], notes, precautions: precautions ?? '' } }, { new: true });
        if (!appointment)
            return res.status(404).json({ error: 'Appointment not found' });
        return res.json(appointment);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.saveTreatment = saveTreatment;
// ── Doctor: list patient's reports (only if linked by appointment) ────────────
const getPatientReportsForDoctor = async (req, res) => {
    try {
        const linked = await Appointment_1.Appointment.exists({ doctorId: req.user?.userId, patientId: req.params.patientId });
        if (!linked)
            return res.status(403).json({ error: 'No appointment found with this patient' });
        const reports = await MedicalReport_1.MedicalReport.find({ patientId: req.params.patientId })
            .select('-fileData').sort({ uploadedAt: -1 });
        return res.json(reports);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientReportsForDoctor = getPatientReportsForDoctor;
// ── Doctor: get a specific patient report file ────────────────────────────────
const getPatientReportFileForDoctor = async (req, res) => {
    try {
        const linked = await Appointment_1.Appointment.exists({ doctorId: req.user?.userId, patientId: req.params.patientId });
        if (!linked)
            return res.status(403).json({ error: 'No appointment found with this patient' });
        const report = await MedicalReport_1.MedicalReport.findOne({ _id: req.params.reportId, patientId: req.params.patientId });
        if (!report)
            return res.status(404).json({ error: 'Report not found' });
        return res.json({
            fileData: report.fileData,
            fileType: report.fileType,
            name: report.name,
            healthCondition: report.healthCondition,
            prescribedTablets: report.prescribedTablets,
            uploadedAt: report.uploadedAt,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getPatientReportFileForDoctor = getPatientReportFileForDoctor;
