import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserStatus } from './schemas/user.schema';
import { DifficultyLevel } from './schemas/student-profile.schema';

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
    findUserByPendingEmailToken: jest.Mock;
    findProfileByStudentId: jest.Mock;
    updateUser: jest.Mock;
    updateProfile: jest.Mock;
    pushRefreshToken: jest.Mock;
    removeRefreshToken: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };
  let emailService: { sendVerificationEmail: jest.Mock; sendPasswordResetEmail: jest.Mock; sendEmailChangeConfirmation: jest.Mock };

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
      findUserByPendingEmailToken: jest.fn(),
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
      sendEmailChangeConfirmation: jest.fn().mockResolvedValue(undefined),
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

    it('auto-verifies new accounts (verification gate temporarily disabled — see #20)', async () => {
      repository.createUser.mockResolvedValue(makeUser());

      await service.register({ email: 'new@example.com', password: 'password123', firstName: 'Bob', lastName: 'Jones' } as any);

      expect(repository.createUser).toHaveBeenCalledWith(expect.objectContaining({
        emailVerified: true,
        status: UserStatus.ACTIVE,
      }));
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

    it('allows login for an unverified account (verification gate temporarily disabled — see #20)', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser({ emailVerified: false }));

      const result = await service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes);

      expect(result.accessToken).toBe('access-token');
    });

    it('returns an access token and user on successful login', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser());

      const result = await service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes);

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
    });

    describe('account lockout', () => {
      it('increments failedLoginAttempts on a wrong password', async () => {
        repository.findUserByEmail.mockResolvedValue(makeUser({ failedLoginAttempts: 2 }));
        bcryptCompare.mockResolvedValue(false);

        await expect(service.login({ email: 'test@example.com', password: 'wrong' } as any, mockRes))
          .rejects.toThrow(UnauthorizedException);

        expect(repository.updateUser).toHaveBeenCalledWith('user-1', { failedLoginAttempts: 3 });
      });

      it('locks the account once failedLoginAttempts reaches the threshold', async () => {
        repository.findUserByEmail.mockResolvedValue(makeUser({ failedLoginAttempts: 4 }));
        bcryptCompare.mockResolvedValue(false);

        await expect(service.login({ email: 'test@example.com', password: 'wrong' } as any, mockRes))
          .rejects.toThrow(UnauthorizedException);

        expect(repository.updateUser).toHaveBeenCalledWith('user-1', {
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        });
      });

      it('throws ForbiddenException with ACCOUNT_LOCKED when the account is currently locked', async () => {
        repository.findUserByEmail.mockResolvedValue(
          makeUser({ lockedUntil: new Date(Date.now() + 10 * 60 * 1000) }),
        );
        const callsBefore = bcryptCompare.mock.calls.length;

        await expect(service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes))
          .rejects.toThrow(ForbiddenException);
        // The lock check short-circuits before ever comparing the password
        expect(bcryptCompare.mock.calls.length).toBe(callsBefore);
      });

      it('allows login again once the lockout has expired', async () => {
        repository.findUserByEmail.mockResolvedValue(
          makeUser({ lockedUntil: new Date(Date.now() - 1000), failedLoginAttempts: 5 }),
        );

        const result = await service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes);

        expect(result.accessToken).toBe('access-token');
      });

      it('resets failedLoginAttempts and lockedUntil on a successful login', async () => {
        repository.findUserByEmail.mockResolvedValue(makeUser({ failedLoginAttempts: 3 }));

        await service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes);

        expect(repository.updateUser).toHaveBeenCalledWith('user-1', {
          failedLoginAttempts: 0,
          lockedUntil: null,
        });
      });

      it('does not call updateUser on success when there were no prior failed attempts', async () => {
        repository.findUserByEmail.mockResolvedValue(makeUser({ failedLoginAttempts: 0 }));

        await service.login({ email: 'test@example.com', password: 'pw' } as any, mockRes);

        expect(repository.updateUser).not.toHaveBeenCalled();
      });
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

  describe('resendVerification', () => {
    it('returns silently when the email does not exist (no information leakage)', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      await expect(service.resendVerification('ghost@example.com')).resolves.toBeUndefined();
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('returns silently when the account is already verified', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser({ emailVerified: true }));

      await expect(service.resendVerification('test@example.com')).resolves.toBeUndefined();
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('generates a fresh token and resends for an unverified account', async () => {
      repository.findUserByEmail.mockResolvedValue(makeUser({ emailVerified: false }));

      await service.resendVerification('test@example.com');

      expect(repository.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        emailVerificationToken: expect.any(String),
      }));
      await Promise.resolve();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith('test@example.com', 'Alice', expect.any(String));
    });
  });

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

  // ─── requestEmailChange / confirmEmailChange ───────────────────────────────

  describe('requestEmailChange', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      repository.findUserById.mockResolvedValue(null);
      await expect(service.requestEmailChange('user-1', 'new@test.com')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the new email matches the current one', async () => {
      repository.findUserById.mockResolvedValue(makeUser({ email: 'same@test.com' }));
      await expect(service.requestEmailChange('user-1', 'same@test.com')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when the new email is already registered', async () => {
      repository.findUserById.mockResolvedValue(makeUser());
      repository.emailExists.mockResolvedValue(true);
      await expect(service.requestEmailChange('user-1', 'taken@test.com')).rejects.toThrow(ConflictException);
    });

    it('stores a pending email and token, and sends a confirmation email', async () => {
      repository.findUserById.mockResolvedValue(makeUser());
      repository.emailExists.mockResolvedValue(false);

      await service.requestEmailChange('user-1', 'NEW@Test.com');

      expect(repository.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        pendingEmail: 'new@test.com',
        pendingEmailToken: expect.any(String),
      }));
      expect(emailService.sendEmailChangeConfirmation).toHaveBeenCalledWith(
        'new@test.com', 'Alice', expect.any(String),
      );
    });
  });

  describe('confirmEmailChange', () => {
    it('throws UnauthorizedException for an invalid token', async () => {
      repository.findUserByPendingEmailToken.mockResolvedValue(null);
      await expect(service.confirmEmailChange('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws ConflictException if the pending email was taken in the meantime', async () => {
      repository.findUserByPendingEmailToken.mockResolvedValue(makeUser({ pendingEmail: 'new@test.com' }));
      repository.emailExists.mockResolvedValue(true);
      await expect(service.confirmEmailChange('valid-token')).rejects.toThrow(ConflictException);
    });

    it('swaps email and clears pending fields on success', async () => {
      repository.findUserByPendingEmailToken.mockResolvedValue(makeUser({ pendingEmail: 'new@test.com' }));
      repository.emailExists.mockResolvedValue(false);

      await service.confirmEmailChange('valid-token');

      expect(repository.updateUser).toHaveBeenCalledWith('user-1', {
        email: 'new@test.com',
        pendingEmail: null,
        pendingEmailToken: null,
      });
    });
  });

  // ─── deleteAccount ──────────────────────────────────────────────────────────

  describe('deleteAccount', () => {
    it('soft-deletes the user by setting deletedAt and clearing refresh tokens', async () => {
      const mockRes = { clearCookie: jest.fn() };
      await service.deleteAccount('user-1', mockRes);

      expect(repository.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        deletedAt: expect.any(Date),
        refreshTokens: [],
      }));
    });

    it('clears the refresh token cookie', async () => {
      const mockRes = { clearCookie: jest.fn() };
      await service.deleteAccount('user-1', mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/v1/auth' });
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

  // ─── updateProfile ────────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    beforeEach(() => {
      repository.findUserById.mockResolvedValue(makeUser());
    });

    it('updates firstName and lastName via updateUser when provided', async () => {
      await service.updateProfile('user-1', { firstName: 'Bob', lastName: 'Jones' });

      expect(repository.updateUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ firstName: 'Bob', lastName: 'Jones' }),
      );
    });

    it('does not call updateUser when no name fields are provided', async () => {
      await service.updateProfile('user-1', { grade: '10' });

      expect(repository.updateUser).not.toHaveBeenCalled();
    });

    it('updates profile fields via updateProfile when provided', async () => {
      await service.updateProfile('user-1', {
        grade: '10',
        learningGoals: ['Pass exam'],
        interests: ['Math'],
        preferredDifficulty: DifficultyLevel.ADVANCED,
      });

      expect(repository.updateProfile).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          grade: '10',
          learningGoals: ['Pass exam'],
          interests: ['Math'],
          preferredDifficulty: DifficultyLevel.ADVANCED,
        }),
      );
    });

    it('does not call updateProfile when no profile fields are provided', async () => {
      await service.updateProfile('user-1', { firstName: 'Bob' });

      expect(repository.updateProfile).not.toHaveBeenCalled();
    });

    it('returns the updated user via getMe after persisting changes', async () => {
      const result = await service.updateProfile('user-1', { firstName: 'Bob' });

      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('handles a partial update with only interests', async () => {
      await service.updateProfile('user-1', { interests: ['Physics', 'Chemistry'] });

      expect(repository.updateProfile).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ interests: ['Physics', 'Chemistry'] }),
      );
      expect(repository.updateUser).not.toHaveBeenCalled();
    });
  });
});
