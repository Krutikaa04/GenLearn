import { Injectable } from '@nestjs/common';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { GenerateStudyPlanDto } from './dto/generate-studyplan.dto';

@Injectable()
export class StudyPlanService {
  constructor(private readonly aiGateway: AiGatewayService) {}

  async generate(userId: string, dto: GenerateStudyPlanDto) {
    return this.aiGateway.generateStudyPlan({
      userId,
      goal: dto.goal,
      targetDate: dto.targetDate,
      topics: dto.topics,
      masteryData: dto.masteryData ?? [],
      hoursPerDay: dto.hoursPerDay ?? 2,
    });
  }
}
