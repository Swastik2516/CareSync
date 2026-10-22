import nodemailer from 'nodemailer';

export const sendOTPEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
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
