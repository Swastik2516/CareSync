import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { DoctorProfile } from '../models/DoctorProfile';
import { PatientProfile } from '../models/PatientProfile';
import { OTP } from '../models/OTP';
import { sendOTPEmail } from '../config/mailer';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, ...profileData } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, passwordHash, role });

    if (role === 'DOCTOR') {
      await DoctorProfile.create({ userId: user._id, ...profileData });
    } else {
      await PatientProfile.create({ userId: user._id, ...profileData });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ token, role: user.role, name: user.name });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.json({ token, role: user.role, name: user.name });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return 200 to prevent email enumeration attacks
    if (!user) return res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Hash OTP and save
    const otpHash = await bcrypt.hash(otp, 10);
    await OTP.create({ email: email.toLowerCase(), otpHash });

    // Send email
    await sendOTPEmail(email, otp);

    return res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── Verify OTP ────────────────────────────────────────────────────────────────
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const record = await OTP.findOne({ email: email.toLowerCase() });
    if (!record) return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });

    const valid = await bcrypt.compare(otp.toString(), record.otpHash);
    if (!valid) return res.status(400).json({ error: 'Invalid OTP. Please try again.' });

    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });

    // Re-verify OTP
    const record = await OTP.findOne({ email: email.toLowerCase() });
    if (!record) return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });

    const valid = await bcrypt.compare(otp.toString(), record.otpHash);
    if (!valid) return res.status(400).json({ error: 'Invalid OTP.' });

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { passwordHash },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found.' });

    // Delete OTP record
    await OTP.deleteMany({ email: email.toLowerCase() });

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
