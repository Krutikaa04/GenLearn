import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptMastery, ConceptMasterySchema } from './schemas/concept-mastery.schema';
import { PedagogicalDecision, PedagogicalDecisionSchema } from './schemas/pedagogical-decision.schema';
import { LearnerProfile, LearnerProfileSchema } from './schemas/learner-profile.schema';
import { LearnerTimelineEvent, LearnerTimelineEventSchema } from './schemas/learner-timeline-event.schema';
import { LearningPlan, LearningPlanSchema } from './schemas/learning-plan.schema';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { BehaviorFeatures, BehaviorFeaturesSchema } from '../telemetry/schemas/behavior-features.schema';
import { LearnerModelRepository } from './learner-model.repository';
import { LearnerModelService } from './learner-model.service';
import { LearnerProfileRepository } from './learner-profile.repository';
import { LearnerProfileService } from './learner-profile.service';
import { AutonomousPlannerService } from './autonomous-planner.service';
import { AdaptiveController } from './adaptive.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConceptMastery.name, schema: ConceptMasterySchema },
      { name: PedagogicalDecision.name, schema: PedagogicalDecisionSchema },
      { name: LearnerProfile.name, schema: LearnerProfileSchema },
      { name: LearnerTimelineEvent.name, schema: LearnerTimelineEventSchema },
      { name: LearningPlan.name, schema: LearningPlanSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: BehaviorFeatures.name, schema: BehaviorFeaturesSchema },
    ]),
  ],
  controllers: [AdaptiveController],
  providers: [
    LearnerModelRepository,
    LearnerModelService,
    LearnerProfileRepository,
    LearnerProfileService,
    AutonomousPlannerService,
  ],
  exports: [LearnerModelService, LearnerProfileService, AutonomousPlannerService],
})
export class LearnerModelModule {}
