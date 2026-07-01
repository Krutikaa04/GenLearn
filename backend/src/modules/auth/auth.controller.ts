import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student account' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return { data: user };
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, res);
    return { data: result };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;
    await this.authService.logout(user.userId, refreshToken, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;
    const result = await this.authService.refresh(refreshToken, res);
    return { data: result };
  }

  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address via token from email link' })
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { data: { message: 'Email verified successfully' } };
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { data: { message: 'If that email exists, a reset link has been sent' } };
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { data: { message: 'Password reset successfully' } };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    const result = await this.authService.getMe(user.userId);
    return { data: result };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    const result = await this.authService.updateProfile(user.userId, dto);
    return { data: result };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete the current user account' })
  async deleteMe(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteAccount(user.userId, res);
  }
}
