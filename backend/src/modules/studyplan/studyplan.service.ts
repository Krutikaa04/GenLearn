import { Injectable } from '@nestjs/common';
import { CognitiveEngineService } from '../cognitive-engine/cognitive-engine.service';
import { GenerateStudyPlanDto } from './dto/generate-studyplan.dto';

@Injectable()
export class StudyPlanService {
  constructor(private readonly cognitive: CognitiveEngineService) {}

  async generate(userId: string, dto: GenerateStudyPlanDto) {
    return this.cognitive.generateStudyPlan({
      userId,
      goal: dto.goal,
      targetDate: dto.targetDate,
      topics: dto.topics,
      masteryData: dto.masteryData ?? [],
      hoursPerDay: dto.hoursPerDay ?? 2,
    });
  }
}
