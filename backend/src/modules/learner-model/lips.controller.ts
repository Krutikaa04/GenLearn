import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LearningIntelligenceService } from './learning-intelligence.service';
import { isFeatureEnabled } from '../../common/feature-flags';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

/**
 * Read-only endpoints for the Learning Intelligence & Prediction System.
 * All flag-gated behind ADAPTIVE_LEARNING_ENABLED and degrade to empty data
 * when off, so the UI renders nothing rather than breaking.
 */
@ApiTags('Learning Intelligence')
@Controller('lips')
export class LipsController {
  constructor(
    private readonly lips: LearningIntelligenceService,
    private readonly configService: ConfigService,
  ) {}

  private get enabled(): boolean {
    return isFeatureEnabled(this.configService, 'ADAPTIVE_LEARNING_ENABLED');
  }

  @Get('concept-progress')
  @ApiOperation({ summary: 'Concept-level progress (mastery, confidence, trend, last practiced, review priority)' })
  async conceptProgress(@CurrentUser() user: JwtPayload) {
    if (!this.enabled) return { data: [] };
    return { data: await this.lips.getConceptProgress(user.userId) };
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Chronological learning timeline' })
  async timeline(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string) {
    if (!this.enabled) return { data: [] };
    const n = Math.min(Math.max(parseInt(limit ?? '50', 10) || 50, 1), 100);
    return { data: await this.lips.getTimeline(user.userId, n) };
  }

  @Get('revision-forecast')
  @ApiOperation({ summary: 'Revision prediction: immediate / soon / safe' })
  async revision(@CurrentUser() user: JwtPayload) {
    if (!this.enabled) return { data: null };
    return { data: await this.lips.getRevisionForecast(user.userId) };
  }

  @Get('prediction')
  @ApiOperation({ summary: 'Future learning prediction: next milestone, readiness, likely to master/forget' })
  async prediction(@CurrentUser() user: JwtPayload) {
    if (!this.enabled) return { data: null };
    return { data: await this.lips.getPrediction(user.userId) };
  }

  @Get('insights')
  @ApiOperation({ summary: 'Evidence-based learning insights' })
  async insights(@CurrentUser() user: JwtPayload) {
    if (!this.enabled) return { data: [] };
    return { data: await this.lips.getInsights(user.userId) };
  }

  @Get('coach')
  @ApiOperation({ summary: 'Concise AI coach summary' })
  async coach(@CurrentUser() user: JwtPayload) {
    if (!this.enabled) return { data: null };
    return { data: await this.lips.getCoachSummary(user.userId) };
  }

  @Get('weekly-summary')
  @ApiOperation({ summary: 'Weekly learning summary' })
  async weekly(@CurrentUser() user: JwtPayload) {
    if (!this.enabled) return { data: null };
    return { data: await this.lips.getWeeklySummary(user.userId) };
  }
}
