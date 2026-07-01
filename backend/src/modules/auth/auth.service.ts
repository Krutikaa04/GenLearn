import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserStatus } from './schemas/user.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.authRepository.emailExists(dto.email);
    if (exists) {
      throw new ConflictException({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email address is already registered' });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const userId = uuidv4();
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = this.hash(rawVerificationToken);

    const user = await this.authRepository.createUser({
      userId,
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerificationToken: verificationTokenHash,
    });

    await this.authRepository.createProfile({
      profileId: uuidv4(),
      studentId: userId,
    });

    // Email send is non-blocking — failure doesn't break registration
    this.emailService
      .sendVerificationEmail(user.email, user.firstName, rawVerificationToken)
      .catch((err) => this.logger.error('Verification email failed', err));

    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto, res: { cookie: Function }) {
    const user = await this.authRepository.findUserByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException({ code: 'ACCOUNT_SUSPENDED', message: 'Account has been suspended' });
    }

    if (!user.emailVerified) {
      throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in' });
    }

    const { accessToken, rawRefreshToken } = await this.generateTokenPair(user.userId, user.email, user.role);
    this.setRefreshCookie(res, rawRefreshToken);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(userId: string, refreshToken: string | undefined, res: { clearCookie: Function }) {
    if (refreshToken) {
      const tokenHash = this.hash(refreshToken);
      await this.authRepository.removeRefreshToken(userId, tokenHash);
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  }

  async refresh(rawRefreshToken: string | undefined, res: { cookie: Function }) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID', message: 'Refresh token is invalid or expired' });
    }

    const tokenHash = this.hash(rawRefreshToken);
    const now = new Date();

    // Find a user that has this token hash in their refreshTokens array
    // We do this by scanning — in production this would be indexed
    const user = await this.authRepository.findUserByRefreshTokenHash(tokenHash, now);

    if (!user) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID', message: 'Refresh token is invalid or expired' });
    }

    // Rotate: remove old token, issue new pair
    await this.authRepository.removeRefreshToken(user.userId, tokenHash);
    const { accessToken, rawRefreshToken: newRawToken } = await this.generateTokenPair(
      user.userId,
      user.email,
      user.role,
    );
    this.setRefreshCookie(res, newRawToken);

    return { accessToken };
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = this.hash(rawToken);
    const user = await this.authRepository.findUserByVerificationToken(tokenHash);

    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Verification link is invalid or has already been used' });
    }

    await this.authRepository.updateUser(user.userId, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
      emailVerificationToken: null,
    } as any);
  }

  async forgotPassword(email: string) {
    const user = await this.authRepository.findUserByEmail(email);

    // Always return success — don't reveal if email exists
    if (!user || user.status === UserStatus.SUSPENDED) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hash(rawToken);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepository.updateUser(user.userId, {
      passwordResetToken: tokenHash,
      passwordResetExpiry: expiry,
    } as any);

    this.emailService
      .sendPasswordResetEmail(user.email, user.firstName, rawToken)
      .catch((err) => this.logger.error('Password reset email failed', err));
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = this.hash(rawToken);
    const user = await this.authRepository.findUserByResetToken(tokenHash);

    if (!user) {
      throw new UnauthorizedException({ code: 'RESET_TOKEN_EXPIRED', message: 'Password reset link is invalid or has expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.authRepository.updateUser(user.userId, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshTokens: [], // force re-login on all devices
    } as any);
  }

  async getMe(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });

    const profile = await this.authRepository.findProfileByStudentId(userId);

    return {
      ...this.sanitizeUser(user),
      profile: profile
        ? {
            grade: profile.grade,
            learningGoals: profile.learningGoals,
            interests: profile.interests,
            preferredDifficulty: profile.preferredDifficulty,
            adaptiveScore: profile.adaptiveScore,
            masteryLevel: profile.masteryLevel,
          }
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { firstName, lastName, grade, learningGoals, interests, preferredDifficulty } = dto;

    if (firstName || lastName) {
      const userUpdate: Record<string, string> = {};
      if (firstName) userUpdate.firstName = firstName;
      if (lastName) userUpdate.lastName = lastName;
      await this.authRepository.updateUser(userId, userUpdate as any);
    }

    const profileUpdate: Record<string, unknown> = {};
    if (grade !== undefined) profileUpdate.grade = grade;
    if (learningGoals !== undefined) profileUpdate.learningGoals = learningGoals;
    if (interests !== undefined) profileUpdate.interests = interests;
    if (preferredDifficulty !== undefined) profileUpdate.preferredDifficulty = preferredDifficulty;

    if (Object.keys(profileUpdate).length > 0) {
      await this.authRepository.updateProfile(userId, profileUpdate as any);
    }

    return this.getMe(userId);
  }

  async deleteAccount(userId: string, res: { clearCookie: Function }) {
    await this.authRepository.updateUser(userId, {
      deletedAt: new Date(),
      refreshTokens: [],
    } as any);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async generateTokenPair(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hash(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.authRepository.pushRefreshToken(userId, {
      tokenHash,
      expiresAt,
      createdAt: new Date(),
    });

    return { accessToken, rawRefreshToken };
  }

  private setRefreshCookie(res: { cookie: Function }, rawToken: string) {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    res.cookie('refreshToken', rawToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }

  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private sanitizeUser(user: any) {
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
