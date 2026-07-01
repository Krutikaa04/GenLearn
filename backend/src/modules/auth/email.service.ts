import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AxiosError } from 'axios';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // Resend's HTTP API is used instead of SMTP: many PaaS hosts (Railway included)
    // block outbound SMTP ports entirely, but regular HTTPS always works.
    this.apiKey = this.configService.get<string>('SMTP_PASSWORD');
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

  async sendEmailChangeConfirmation(newEmail: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const link = `${frontendUrl}/confirm-email-change?token=${token}`;

    await this.send(newEmail, 'Confirm your new GenLearn email address', `
      <h2>Hi ${firstName},</h2>
      <p>We received a request to change the email address on your GenLearn account to this one.</p>
      <p>Click the link below to confirm. This link expires in 24 hours.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:12px;">Confirm new email</a>
      <p style="margin-top:16px;color:#666;">If you didn't request this, you can safely ignore this email — your account email will not change.</p>
    `);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(`Email not configured — skipping send to ${to}: ${subject}`);
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          'https://api.resend.com/emails',
          {
            from: this.configService.get<string>('SMTP_FROM') || 'onboarding@resend.dev',
            to,
            subject,
            html,
          },
          { headers: { Authorization: `Bearer ${this.apiKey}` } },
        ),
      );
    } catch (error) {
      // Don't let email failures break the request
      const axiosErr = error as AxiosError;
      this.logger.error(`Failed to send email to ${to}`, axiosErr.response?.data ?? axiosErr.message);
    }
  }
}
