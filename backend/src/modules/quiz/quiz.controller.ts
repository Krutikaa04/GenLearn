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
import { QuizService } from './quiz.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request AI quiz generation (async — polls /status)' })
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateQuizDto) {
    const result = await this.quizService.generate(user.userId, dto);
    return { data: result };
  }

  @Post('adaptive/next')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate the next behavior-driven adaptive quiz from the pending plan' })
  async generateAdaptive(@CurrentUser() user: JwtPayload) {
    const result = await this.quizService.generateAdaptive(user.userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List all quizzes for the current student' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.quizService.findAll(user.userId, page, Math.min(pageSize, 50));
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Poll quiz generation status' })
  async getStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.quizService.getStatus(id, user.userId);
    return { data: result };
  }

  @Get(':id/review')
  @ApiOperation({ summary: 'Get the full answer breakdown for a submitted quiz' })
  async review(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.quizService.review(id, user.userId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz questions (without answers)' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.quizService.findOne(id, user.userId);
    return { data: result };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit quiz answers and receive evaluated results' })
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
  ) {
    const result = await this.quizService.submit(id, user.userId, dto);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a quiz' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.quizService.delete(id, user.userId);
  }
}
