import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudyPlanService } from './studyplan.service';
import { GenerateStudyPlanDto } from './dto/generate-studyplan.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Study Plan')
@Controller('studyplan')
export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a personalized day-by-day learning plan' })
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateStudyPlanDto) {
    const result = await this.studyPlanService.generate(user.userId, dto);
    return { data: result };
  }
}
