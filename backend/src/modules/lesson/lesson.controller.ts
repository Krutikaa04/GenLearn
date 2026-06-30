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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LessonService } from './lesson.service';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request AI lesson generation (async — polls /status)' })
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateLessonDto) {
    const result = await this.lessonService.generate(user.userId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List all lessons for the current student' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.lessonService.findAll(user.userId, page, Math.min(pageSize, 50));
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Poll lesson generation status' })
  async getStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.lessonService.getStatus(id, user.userId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full lesson content' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.lessonService.findOne(id, user.userId);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.lessonService.delete(id, user.userId);
  }
}
