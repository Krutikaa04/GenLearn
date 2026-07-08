import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto, JoinClassroomDto } from './dto/classroom.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Classrooms')
@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  // ---------- Teacher routes ----------

  @Post()
  @Roles('teacher')
  @ApiOperation({ summary: 'Create a classroom (teacher only) — returns its join code' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateClassroomDto) {
    const result = await this.classroomService.create(user.userId, dto.name, dto.description);
    return { data: result };
  }

  @Get()
  @Roles('teacher')
  @ApiOperation({ summary: "List the teacher's own classrooms" })
  async listOwn(@CurrentUser() user: JwtPayload) {
    const result = await this.classroomService.listOwn(user.userId);
    return { data: result };
  }

  @Get('mine')
  @Roles('student')
  @ApiOperation({ summary: 'List classrooms the student has joined' })
  async listJoined(@CurrentUser() user: JwtPayload) {
    const result = await this.classroomService.listJoined(user.userId);
    return { data: result };
  }

  @Get(':id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Classroom detail with member roster (owning teacher only)' })
  async getRoster(@CurrentUser() user: JwtPayload, @Param('id') classroomId: string) {
    const result = await this.classroomService.getRoster(user.userId, classroomId);
    return { data: result };
  }

  @Get(':id/dashboard')
  @Roles('teacher')
  @ApiOperation({ summary: 'Per-student progress dashboard for a classroom (owning teacher only)' })
  async getDashboard(@CurrentUser() user: JwtPayload, @Param('id') classroomId: string) {
    const result = await this.classroomService.getDashboard(user.userId, classroomId);
    return { data: result };
  }

  @Get(':id/students/:studentId/report')
  @Roles('teacher')
  @ApiOperation({ summary: 'Full quiz/progress report for one classroom member (owning teacher only)' })
  async getStudentReport(
    @CurrentUser() user: JwtPayload,
    @Param('id') classroomId: string,
    @Param('studentId') studentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    const result = await this.classroomService.getStudentReport(user.userId, classroomId, studentId, page, pageSize);
    return { data: result };
  }

  @Delete(':id/students/:studentId')
  @Roles('teacher')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a student from the classroom (owning teacher only)' })
  async removeStudent(
    @CurrentUser() user: JwtPayload,
    @Param('id') classroomId: string,
    @Param('studentId') studentId: string,
  ): Promise<void> {
    await this.classroomService.removeStudent(user.userId, classroomId, studentId);
  }

  @Delete(':id')
  @Roles('teacher')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a classroom (owning teacher only, soft delete)' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') classroomId: string): Promise<void> {
    await this.classroomService.delete(user.userId, classroomId);
  }

  // ---------- Student routes ----------

  @Post('join')
  @Roles('student')
  @ApiOperation({ summary: 'Join a classroom with its join code' })
  async join(@CurrentUser() user: JwtPayload, @Body() dto: JoinClassroomDto) {
    const result = await this.classroomService.join(user.userId, dto.joinCode);
    return { data: result };
  }

  @Post(':id/leave')
  @Roles('student')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a classroom' })
  async leave(@CurrentUser() user: JwtPayload, @Param('id') classroomId: string): Promise<void> {
    await this.classroomService.leave(user.userId, classroomId);
  }
}
