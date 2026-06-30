import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserStatus } from './schemas/user.schema';

jest.mock('bcryptjs');
const bcryptHash = bcrypt.hash as jest.Mock;
const bcryptCompare = bcrypt.compare as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let repository: {
    emailExists: jest.Mock;
    createUser: jest.Mock;
    createProfile: jest.Mock;
    findUserByEmail: jest.Mock;
    findUserById: jest.Mock;
    findUserByRefreshTokenHash: jest.Mock;
    findUserByVerificationToken: jest.Mock;
    findUserByResetToken: jest.Mock;
    findProfileByStudentId: jest.Mock;
    updateUser: jest.Mock;
    updateProfile: jest.Mock;
    pushRefreshToken: jest.Mock;
    removeRefreshToken: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };
  let emailService: { sendVerificationEmail: jest.Mock; sendPasswordResetEmail: jest.Mock };

  const makeUser = (overrides: Partial<any> = {}) => ({
    userId: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Alice',
    lastName: 'Smith',
    role: 'student',
    status: UserStatus.ACTIVE,
    emailVerified: true,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      emailExists: jest.fn().mockResolvedValue(false),
      createUser: jest.fn(),
      createProfile: jest.fn().mockResolvedValue({}),
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      findUserByRefreshTokenHash: jest.fn(),
      findUserByVerificationToken: jest.fn(),
      findUserByResetToken: jest.fn(),
      findProfileByStudentId: jest.fn().mockResolvedValue(null),
      updateUser: jest.fn().mockResolvedValue({}),
      updateProfile: jest.fn().mockResolvedValue({}),
      pushRefreshToken: jest.fn().mockResolvedValue({}),
      removeRefreshToken: jest.fn().mockResolvedValue({}),
    };
    jwtService = { sign: jest.fn().mockReturnValue('access-token') };
    configService = { get: jest.fn().mockReturnValue('development') };
    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };
    bcryptHash.mockResolvedValue('hashed');
    bcryptCompare.mockResolvedValue(true);

    service = new AuthService(
      repository as any,
      jwtService as any,
      configService as any,
      emailService as any,
    );
  });

  // ─── register ─────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws ConflictException when the email is already registered', async () => {
      repository.emailExists.mockResolvedValue(true);

      await expect(service.register({ email: 'test@example.com', password: 'pw', firstName: 'A', lastName: 'B' } as any))
        .rejects.toThrow(ConflictException);

      expect(repository.createUser).not.toHaveBeenCalled();
    });

    it('creates both user and profile on successful registration', async () => {
      const user = makeUser({ emailVerified: false, status: UserStatus.ACTIVE });
      repository.createUser.mockResolvedValue(user);

      await service.register({ email: 'new@example.com', password: 'password123', firstName: 'Bob', lastName: 'Jones' } as any);

      expect(repository.createUser).toHaveBeenCalledTimes(1);
      expect(repository.createProfile).toHaveBeenCalledTimes(1);
    });

    it('normalises the email to lowercase', async () => {
      repository.createUser.mockResolvedValue(makeUser());

      await service.register({ email: 'TEST@EXAMPLE.COM', password: 'pw', firstName: 'A', lastName: 'B' } as any);

      expect(repository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('does not throw if the verification email fails to send', async () => {
      repository.createUser.mockResolvedValue(makeUser());
      emailService.sendVerificationEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.register({ email: 'ok@example.com', password: 'pw', firstName: 'A', lastName: 'B' } as any),
      ).resolves.not.toThrow();
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    const mockRes = { cookie: jest.fn() };

    it('throws UnauthorizedException when the email is not found', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      await expect(service.login({ email: 'no@one.com', password: 'pw' } as any, mockRes))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser());
      bcryptCompare.mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' } as any, mockRes))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException for a suspended account', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser({ status: UserStatus.SUSPENDED }));

      await expect(service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when email is not yet verified', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser({ emailVerified: false }));

      await expect(service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes))
        .rejects.toThrow(ForbiddenException);
    });

    it('returns an access token and user on successful login', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser());

      const result = await service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes);

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
    });
  });

  // ─── refresh ─────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    const mockRes = { cookie: jest.fn() };

    it('throws UnauthorizedException when no refresh token is provided', async () => {
      await expect(service.refresh(undefined, mockRes)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the token hash is not found in the database', async () => {
      repository.findUserByRefreshTokenHash.mockResolvedValue(null);

      await expect(service.refresh('invalid-token', mockRes)).rejects.toThrow(UnauthorizedException);
    });

    it('rotates the refresh token and returns a new access token', async () => {
      repository.findUserByRefreshTokenHash.mockResolvedValue(makeUser());

      const result = await service.refresh('valid-token', mockRes);

      expect(repository.removeRefreshToken).toHaveBeenCalled();
      expect(repository.pushRefreshToken).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
    });
  });

  // ─── verifyEmail ─────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('throws UnauthorizedException for an invalid or already-used token', async () => {
      repository.findUserByVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('marks the user as verified and active', async () => {
      repository.findUserByVerificationToken.mockResolvedValue(makeUser({ emailVerified: false }));

      await service.verifyEmail('valid-token');

      expect(repository.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        emailVerified: true,
        status: UserStatus.ACTIVE,
        emailVerificationToken: null,
      }));
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('returns silently when the email does not exist (no information leakage)', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('ghost@example.com')).resolves.toBeUndefined();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('returns silently for a suspended account', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser({ status: UserStatus.SUSPENDED }));

      await expect(service.forgotPassword('test@example.com')).resolves.toBeUndefined();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sets a reset token and sends the email for an active user', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser());

      await service.forgotPassword('test@example.com');

      expect(repository.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        passwordResetToken: expect.any(String),
        passwordResetExpiry: expect.any(Date),
      }));
      await Promise.resolve();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('throws UnauthorizedException for an invalid or expired token', async () => {
      repository.findUserByResetToken.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'newpassword')).rejects.toThrow(UnauthorizedException);
    });

    it('hashes the new password and clears all session tokens', async () => {
      repository.findUserByResetToken.mockResolvedValue(makeUser());

      await service.resetPassword('valid-token', 'newpassword');

      expect(repository.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        passwordHash: 'hashed',
        passwordResetToken: null,
        refreshTokens: [],
      }));
    });
  });

  // ─── getMe ────────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      repository.findUserById.mockResolvedValue(null);

      await expect(service.getMe('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns sanitized user without passwordHash', async () => {
      repository.findUserById.mockResolvedValue(makeUser());

      const result = await service.getMe('user-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });
  });
});
