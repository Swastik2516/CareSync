"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOTP = exports.forgotPassword = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const DoctorProfile_1 = require("../models/DoctorProfile");
const PatientProfile_1 = require("../models/PatientProfile");
const OTP_1 = require("../models/OTP");
const mailer_1 = require("../config/mailer");
const register = async (req, res) => {
    try {
        const { name, email, phone, password, role, ...profileData } = req.body;
        const existing = await User_1.User.findOne({ email });
        if (existing)
            return res.status(409).json({ error: 'Email already registered' });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await User_1.User.create({ name, email, phone, passwordHash, role });
        if (role === 'DOCTOR') {
            await DoctorProfile_1.DoctorProfile.create({ userId: user._id, ...profileData });
        }
        else {
            await PatientProfile_1.PatientProfile.create({ userId: user._id, ...profileData });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, role: user.role, name: user.name });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, role: user.role, name: user.name });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.login = login;
// ─── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        // Always return 200 to prevent email enumeration attacks
        if (!user)
            return res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });
        // Generate secure 6-digit OTP
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        // Delete any existing OTP for this email
        await OTP_1.OTP.deleteMany({ email: email.toLowerCase() });
        // Hash OTP and save
        const otpHash = await bcryptjs_1.default.hash(otp, 10);
        await OTP_1.OTP.create({ email: email.toLowerCase(), otpHash });
        // Send email
        await (0, mailer_1.sendOTPEmail)(email, otp);
        return res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.forgotPassword = forgotPassword;
// ─── Verify OTP ────────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ error: 'Email and OTP are required' });
        const record = await OTP_1.OTP.findOne({ email: email.toLowerCase() });
        if (!record)
            return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
        const valid = await bcryptjs_1.default.compare(otp.toString(), record.otpHash);
        if (!valid)
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        return res.status(200).json({ message: 'OTP verified successfully.' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.verifyOTP = verifyOTP;
// ─── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return res.status(400).json({ error: 'Email, OTP, and new password are required' });
        // Re-verify OTP
        const record = await OTP_1.OTP.findOne({ email: email.toLowerCase() });
        if (!record)
            return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
        const valid = await bcryptjs_1.default.compare(otp.toString(), record.otpHash);
        if (!valid)
            return res.status(400).json({ error: 'Invalid OTP.' });
        // Hash new password and update user
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        const updated = await User_1.User.findOneAndUpdate({ email: email.toLowerCase() }, { passwordHash }, { new: true });
        if (!updated)
            return res.status(404).json({ error: 'User not found.' });
        // Delete OTP record
        await OTP_1.OTP.deleteMany({ email: email.toLowerCase() });
        return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.resetPassword = resetPassword;
