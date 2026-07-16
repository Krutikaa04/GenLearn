import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LearnerModelService } from './learner-model.service';
import { AutonomousPlannerService } from './autonomous-planner.service';
import { ExplainableIntelligenceService } from './explainable-intelligence.service';
import { isFeatureEnabled } from '../../common/feature-flags';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Adaptive Learning')
@Controller('adaptive')
export class AdaptiveController {
  constructor(
    private readonly learnerModelService: LearnerModelService,
    private readonly planner: AutonomousPlannerService,
    private readonly explainable: ExplainableIntelligenceService,
    private readonly configService: ConfigService,
  ) {}

  @Get('recommendation')
  @ApiOperation({ summary: "The student's current recommended next activity, with evidence-based explanation (null when none or feature disabled)" })
  async getRecommendation(@CurrentUser() user: JwtPayload) {
    if (!isFeatureEnabled(this.configService, 'ADAPTIVE_LEARNING_ENABLED')) {
      return { data: null };
    }
    const recommendation = await this.learnerModelService.getRecommendation(user.userId);
    if (!recommendation) return { data: null };

    // Explainability (Sprint 4): attach WHY, evidence, and expected outcome.
    // Additive and best-effort — existing consumers of the base fields are
    // unaffected if explanation assembly fails.
    const explained = await this.explainable.getExplainedRecommendation(user.userId).catch(() => null);
    return {
      data: {
        ...recommendation,
        ...(explained
          ? { intervention: explained.intervention, explanation: explained.explanation }
          : {}),
      },
    };
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

  @Get('plan')
  @ApiOperation({ summary: "The learner's single active Learning Plan for the Continue Learning flow (null when feature disabled)" })
  async getPlan(@CurrentUser() user: JwtPayload) {
    if (!isFeatureEnabled(this.configService, 'ADAPTIVE_LEARNING_ENABLED')) {
      return { data: null };
    }
    const plan = await this.planner.getCurrentPlan(user.userId);
    return { data: plan };
  }
}
