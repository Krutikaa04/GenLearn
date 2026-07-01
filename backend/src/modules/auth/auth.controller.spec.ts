import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const jwtPayload = { userId: 'user-1', email: 'alice@test.com', role: 'student' };

const mockUser = {
  userId: 'user-1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@test.com',
  role: 'student',
  emailVerified: true,
};

const mockRes = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as any;

const mockReq = (cookies: Record<string, string> = {}) => ({ cookies }) as any;

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            refresh: jest.fn(),
            verifyEmail: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            getMe: jest.fn(),
            updateProfile: jest.fn(),
            deleteAccount: jest.fn(),
            requestEmailChange: jest.fn(),
            confirmEmailChange: jest.fn(),
            resendVerification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService) as jest.Mocked<AuthService>;
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('returns registered user wrapped in data', async () => {
      service.register.mockResolvedValue(mockUser as any);
      const dto = { firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com', password: 'pass1234' };
      const result = await controller.register(dto as any);
      expect(result).toEqual({ data: mockUser });
      expect(service.register).toHaveBeenCalledWith(dto);
    });

    it('propagates ConflictException for duplicate email', async () => {
      service.register.mockRejectedValue(new ConflictException('Email already registered'));
      await expect(controller.register({ email: 'exists@test.com' } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns login result wrapped in data', async () => {
      const loginResult = { accessToken: 'token-abc', user: mockUser };
      service.login.mockResolvedValue(loginResult as any);
      const dto = { email: 'alice@test.com', password: 'pass1234' };
      const result = await controller.login(dto as any, mockRes);
      expect(result).toEqual({ data: loginResult });
      expect(service.login).toHaveBeenCalledWith(dto, mockRes);
    });

    it('propagates UnauthorizedException for bad credentials', async () => {
      service.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      await expect(controller.login({ email: 'x@test.com', password: 'wrong' } as any, mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('reads refreshToken from cookie and calls service', async () => {
      service.logout.mockResolvedValue(undefined as any);
      const req = mockReq({ refreshToken: 'rt-token' });
      const result = await controller.logout(jwtPayload as any, req, mockRes);
      expect(service.logout).toHaveBeenCalledWith('user-1', 'rt-token', mockRes);
      expect(result).toBeUndefined();
    });

    it('passes undefined when no refresh cookie is present', async () => {
      service.logout.mockResolvedValue(undefined as any);
      const req = mockReq({});
      await controller.logout(jwtPayload as any, req, mockRes);
      expect(service.logout).toHaveBeenCalledWith('user-1', undefined, mockRes);
    });
  });

  describe('refresh', () => {
    it('reads refreshToken from cookie and returns new access token', async () => {
      const refreshResult = { accessToken: 'new-token' };
      service.refresh.mockResolvedValue(refreshResult as any);
      const req = mockReq({ refreshToken: 'rt-token' });
      const result = await controller.refresh(req, mockRes);
      expect(result).toEqual({ data: refreshResult });
      expect(service.refresh).toHaveBeenCalledWith('rt-token', mockRes);
    });

    it('propagates UnauthorizedException when refresh token is missing or invalid', async () => {
      service.refresh.mockRejectedValue(new UnauthorizedException());
      const req = mockReq({});
      await expect(controller.refresh(req, mockRes)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('calls service and returns success message', async () => {
      service.verifyEmail.mockResolvedValue(undefined);
      const result = await controller.verifyEmail('verify-token-123');
      expect(service.verifyEmail).toHaveBeenCalledWith('verify-token-123');
      expect(result).toEqual({ data: { message: 'Email verified successfully' } });
    });
  });

  describe('resendVerification', () => {
    it('calls service and returns silent success message', async () => {
      service.resendVerification.mockResolvedValue(undefined);
      const result = await controller.resendVerification({ email: 'alice@test.com' } as any);
      expect(service.resendVerification).toHaveBeenCalledWith('alice@test.com');
      expect(result.data.message).toMatch(/verification link/i);
    });
  });

  describe('forgotPassword', () => {
    it('calls service and returns silent success message', async () => {
      service.forgotPassword.mockResolvedValue(undefined);
      const result = await controller.forgotPassword({ email: 'alice@test.com' } as any);
      expect(service.forgotPassword).toHaveBeenCalledWith('alice@test.com');
      expect(result.data.message).toMatch(/reset link/i);
    });
  });

  describe('resetPassword', () => {
    it('calls service with token and new password', async () => {
      service.resetPassword.mockResolvedValue(undefined);
      const dto = { token: 'reset-token', newPassword: 'newpass123' };
      const result = await controller.resetPassword(dto as any);
      expect(service.resetPassword).toHaveBeenCalledWith('reset-token', 'newpass123');
      expect(result).toEqual({ data: { message: 'Password reset successfully' } });
    });
  });

  describe('getMe', () => {
    it('returns current user wrapped in data', async () => {
      service.getMe.mockResolvedValue(mockUser as any);
      const result = await controller.getMe(jwtPayload as any);
      expect(result).toEqual({ data: mockUser });
      expect(service.getMe).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateMe', () => {
    it('returns updated user wrapped in data', async () => {
      const updated = { ...mockUser, firstName: 'Alicia' };
      service.updateProfile.mockResolvedValue(updated as any);
      const dto = { firstName: 'Alicia' };
      const result = await controller.updateMe(jwtPayload as any, dto as any);
      expect(result).toEqual({ data: updated });
      expect(service.updateProfile).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('deleteMe', () => {
    it('calls service.deleteAccount with the current user id and response object', async () => {
      service.deleteAccount.mockResolvedValue(undefined as any);
      await controller.deleteMe(jwtPayload as any, mockRes);
      expect(service.deleteAccount).toHaveBeenCalledWith('user-1', mockRes);
    });

    it('isolates deletion to the JWT-derived userId', async () => {
      service.deleteAccount.mockResolvedValue(undefined as any);
      const otherUser = { userId: 'user-2', email: 'bob@test.com', role: 'student' };
      await controller.deleteMe(otherUser as any, mockRes);
      expect(service.deleteAccount).toHaveBeenCalledWith('user-2', mockRes);
    });
  });

  describe('changeEmail', () => {
    it('calls service.requestEmailChange with the current userId and new email, returns a message', async () => {
      service.requestEmailChange.mockResolvedValue(undefined as any);
      const dto = { newEmail: 'new@test.com' };
      const result = await controller.changeEmail(jwtPayload as any, dto as any);
      expect(service.requestEmailChange).toHaveBeenCalledWith('user-1', 'new@test.com');
      expect(result).toEqual({ data: { message: expect.any(String) } });
    });
  });

  describe('confirmEmailChange', () => {
    it('calls service.confirmEmailChange with the token, returns a success message', async () => {
      service.confirmEmailChange.mockResolvedValue(undefined as any);
      const result = await controller.confirmEmailChange('raw-token');
      expect(service.confirmEmailChange).toHaveBeenCalledWith('raw-token');
      expect(result).toEqual({ data: { message: expect.any(String) } });
    });
  });
});
