"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendOTPEmail = async (to, otp) => {
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
    await transporter.sendMail({
        from: `"CareSync" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'Your CareSync Password Reset OTP',
        html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px;">
        <h2 style="color:#4F46E5;margin-bottom:8px;">CareSync Password Reset</h2>
        <p style="color:#6B7280;font-size:14px;">Use the OTP below to reset your password. It expires in <strong>5 minutes</strong>.</p>
        <div style="background:#F1F5F9;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#1E293B;">${otp}</span>
        </div>
        <p style="color:#9CA3AF;font-size:12px;">If you did not request this, please ignore this email. Do not share this OTP with anyone.</p>
      </div>
    `,
    });
};
exports.sendOTPEmail = sendOTPEmail;
