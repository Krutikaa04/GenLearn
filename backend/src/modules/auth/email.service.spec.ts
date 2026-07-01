import { of, throwError } from 'rxjs';
import { EmailService } from './email.service';

function makeService(httpPost: jest.Mock, configOverrides: Record<string, string | undefined> = {}) {
  const defaults: Record<string, string | undefined> = {
    SMTP_PASSWORD: 're_test_api_key',
    SMTP_FROM: 'onboarding@resend.dev',
    FRONTEND_URL: 'https://genlearn.vercel.app',
  };
  const values = { ...defaults, ...configOverrides };
  const config = { get: jest.fn((key: string) => values[key]) };
  const httpService = { post: httpPost };
  return new EmailService(config as any, httpService as any);
}

describe('EmailService', () => {
  let httpPost: jest.Mock;

  beforeEach(() => {
    httpPost = jest.fn().mockReturnValue(of({ data: { id: 'email-1' } }));
  });

  describe('sendVerificationEmail', () => {
    it('posts to the Resend API with the correct from/to/subject and a verification link', async () => {
      const service = makeService(httpPost);
      await service.sendVerificationEmail('alice@test.com', 'Alice', 'raw-token');

      expect(httpPost).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          from: 'onboarding@resend.dev',
          to: 'alice@test.com',
          subject: 'Verify your GenLearn account',
          html: expect.stringContaining('https://genlearn.vercel.app/verify-email?token=raw-token'),
        }),
        { headers: { Authorization: 'Bearer re_test_api_key' } },
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('posts a reset link scoped to the reset-password route', async () => {
      const service = makeService(httpPost);
      await service.sendPasswordResetEmail('alice@test.com', 'Alice', 'reset-token');

      expect(httpPost).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: 'alice@test.com',
          subject: 'Reset your GenLearn password',
          html: expect.stringContaining('https://genlearn.vercel.app/reset-password?token=reset-token'),
        }),
        expect.anything(),
      );
    });
  });

  describe('sendEmailChangeConfirmation', () => {
    it('sends the confirmation to the new email address with a confirm-email-change link', async () => {
      const service = makeService(httpPost);
      await service.sendEmailChangeConfirmation('new@test.com', 'Alice', 'change-token');

      expect(httpPost).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: 'new@test.com',
          subject: 'Confirm your new GenLearn email address',
          html: expect.stringContaining('https://genlearn.vercel.app/confirm-email-change?token=change-token'),
        }),
        expect.anything(),
      );
    });
  });

  describe('when not configured', () => {
    it('skips sending and does not throw when SMTP_PASSWORD is unset', async () => {
      const service = makeService(httpPost, { SMTP_PASSWORD: undefined });
      await expect(service.sendVerificationEmail('alice@test.com', 'Alice', 'token')).resolves.toBeUndefined();
      expect(httpPost).not.toHaveBeenCalled();
    });
  });

  describe('failure handling', () => {
    it('swallows API errors instead of throwing, so a failed send never breaks the request', async () => {
      httpPost.mockReturnValue(throwError(() => ({ response: { data: { message: 'invalid api key' } } })));
      const service = makeService(httpPost);
      await expect(service.sendVerificationEmail('alice@test.com', 'Alice', 'token')).resolves.toBeUndefined();
    });
  });
});
