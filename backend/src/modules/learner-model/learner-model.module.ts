import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptMastery, ConceptMasterySchema } from './schemas/concept-mastery.schema';
import { PedagogicalDecision, PedagogicalDecisionSchema } from './schemas/pedagogical-decision.schema';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { BehaviorFeatures, BehaviorFeaturesSchema } from '../telemetry/schemas/behavior-features.schema';
import { LearnerModelRepository } from './learner-model.repository';
import { LearnerModelService } from './learner-model.service';
import { AdaptiveController } from './adaptive.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConceptMastery.name, schema: ConceptMasterySchema },
      { name: PedagogicalDecision.name, schema: PedagogicalDecisionSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: BehaviorFeatures.name, schema: BehaviorFeaturesSchema },
    ]),
  ],
  controllers: [AdaptiveController],
  providers: [LearnerModelRepository, LearnerModelService],
  exports: [LearnerModelService],
})
export class LearnerModelModule {}
