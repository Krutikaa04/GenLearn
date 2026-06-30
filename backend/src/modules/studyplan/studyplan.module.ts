import { Module } from '@nestjs/common';
import { StudyPlanController } from './studyplan.controller';
import { StudyPlanService } from './studyplan.service';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [AiGatewayModule],
  controllers: [StudyPlanController],
  providers: [StudyPlanService],
})
export class StudyPlanModule {}
