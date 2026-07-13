import { Module } from '@nestjs/common';
import { StudyPlanController } from './studyplan.controller';
import { StudyPlanService } from './studyplan.service';
import { CognitiveEngineModule } from '../cognitive-engine/cognitive-engine.module';

@Module({
  imports: [CognitiveEngineModule],
  controllers: [StudyPlanController],
  providers: [StudyPlanService],
})
export class StudyPlanModule {}
