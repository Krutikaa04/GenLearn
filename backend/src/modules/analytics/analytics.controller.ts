import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Get learning progress, mastery scores and streak for the current student' })
  async getProgress(@CurrentUser() user: JwtPayload) {
    const result = await this.analyticsService.getProgress(user.userId);
    return { data: result };
  }
}
