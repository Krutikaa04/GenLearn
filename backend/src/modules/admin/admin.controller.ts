import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide statistics' })
  async getStats() {
    const result = await this.adminService.getPlatformStats();
    return { data: result };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with optional status filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'suspended', 'unverified'] })
  async listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers(page, Math.min(pageSize, 100), status);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user details with learning progress' })
  async getUser(@Param('userId') userId: string) {
    const result = await this.adminService.getUser(userId);
    return { data: result };
  }

  @Patch('users/:userId/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Activate or suspend a user' })
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<void> {
    await this.adminService.updateUserStatus(userId, dto.status);
  }
}
