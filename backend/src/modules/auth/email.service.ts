import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT') || 587,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASSWORD'),
        },
      });
    }
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const link = `${frontendUrl}/verify-email?token=${token}`;

    await this.send(email, 'Verify your GenLearn account', `
      <h2>Welcome to GenLearn, ${firstName}!</h2>
      <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:12px;">Verify Email</a>
      <p style="margin-top:16px;color:#666;">Or copy this link: ${link}</p>
    `);
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await this.send(email, 'Reset your GenLearn password', `
      <h2>Password Reset Request</h2>
      <p>Hi ${firstName}, we received a request to reset your password.</p>
      <p>Click the link below. This link expires in 1 hour.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:12px;">Reset Password</a>
      <p style="margin-top:16px;color:#666;">If you didn't request this, ignore this email.</p>
    `);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email not configured — skipping send to ${to}: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@genlearn.dev',
        to,
        subject,
        html,
      });
    } catch (error) {
      // Don't let email failures break the request
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }
}
