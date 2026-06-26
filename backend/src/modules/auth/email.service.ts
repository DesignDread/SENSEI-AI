import nodemailer from 'nodemailer';
import { env, isEmailOtpEnabled } from '../../config/env';
import { logger } from '../../lib/logger';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter | null => {
  if (!isEmailOtpEnabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    logger.info('✅ SMTP transporter configured');
  }
  return transporter;
};

export const sendOtpEmail = async (to: string, code: string): Promise<boolean> => {
  const t = getTransporter();
  if (!t) {
    logger.warn('SMTP not configured — skipping OTP email');
    return false;
  }

  try {
    await t.sendMail({
      from: `"SenseiAI" <${env.SMTP_USER}>`,
      to,
      subject: 'SenseiAI — Verify your email',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #fff; border-radius: 12px;">
          <h1 style="color: #a78bfa; margin: 0 0 8px;">SenseiAI 先生</h1>
          <p style="color: #94a3b8; margin: 0 0 24px;">Verify your email to get started</p>
          <div style="background: #16213e; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px;">Your verification code:</p>
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #a78bfa;">${code}</p>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 0;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    logger.info(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send OTP email:', error);
    return false;
  }
};
