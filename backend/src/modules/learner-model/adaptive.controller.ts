import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LearnerModelService } from './learner-model.service';
import { isFeatureEnabled } from '../../common/feature-flags';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Adaptive Learning')
@Controller('adaptive')
export class AdaptiveController {
  constructor(
    private readonly learnerModelService: LearnerModelService,
    private readonly configService: ConfigService,
  ) {}

  @Get('recommendation')
  @ApiOperation({ summary: "The student's current recommended next activity (null when none or feature disabled)" })
  async getRecommendation(@CurrentUser() user: JwtPayload) {
    if (!isFeatureEnabled(this.configService, 'ADAPTIVE_LEARNING_ENABLED')) {
      return { data: null };
    }
    const recommendation = await this.learnerModelService.getRecommendation(user.userId);
    return { data: recommendation };
  }

  @Get('analysis/:quizId')
  @ApiOperation({ summary: 'Quiz Intelligence Report for a submitted quiz (null when feature disabled)' })
  async getAnalysis(@CurrentUser() user: JwtPayload, @Param('quizId') quizId: string) {
    if (!isFeatureEnabled(this.configService, 'ADAPTIVE_LEARNING_ENABLED')) {
      return { data: null };
    }
    const analysis = await this.learnerModelService.getQuizAnalysis(user.userId, quizId);
    return { data: analysis };
  }

  @Get('question-analysis')
  @ApiOperation({ summary: 'Per-question behavioral breakdown of the latest quiz on each topic' })
  async getQuestionAnalysis(@CurrentUser() user: JwtPayload) {
    if (!isFeatureEnabled(this.configService, 'ADAPTIVE_LEARNING_ENABLED')) {
      return { data: [] };
    }
    const analysis = await this.learnerModelService.getRecentQuestionAnalysis(user.userId);
    return { data: analysis };
  }
}
