import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LearnerModelRepository } from './learner-model.repository';
import { LearnerProfileService } from './learner-profile.service';
import { LearningPlan, LearningPlanDocument } from './schemas/learning-plan.schema';
import { composeLearningPlan, PlannerDecisionInput } from './autonomous-planner';

/**
 * The single Autonomous Learning Planner. It is the one authority that decides
 * the learner's next session: it reads existing intelligence (pending
 * pedagogical decision, concept mastery, persistent profile), composes one
 * Learning Plan, and persists it as the learner's single active plan. Business
 * modules never decide sequencing — they read the plan this service owns.
 */
@Injectable()
export class AutonomousPlannerService {
  private readonly logger = new Logger(AutonomousPlannerService.name);

  constructor(
    @InjectModel(LearningPlan.name)
    private readonly planModel: Model<LearningPlanDocument>,
    private readonly learnerRepo: LearnerModelRepository,
    private readonly profileService: LearnerProfileService,
  ) {}

  /**
   * Recompose and persist the learner's single plan from current intelligence.
   * Called after every mastery-changing activity. Best-effort by contract — a
   * planner failure must never break the activity that triggered it.
   */
  async regenerate(studentId: string): Promise<LearningPlanDocument | null> {
    const [pending, concepts, profile] = await Promise.all([
      this.learnerRepo.findPendingDecision(studentId),
      this.learnerRepo.findByStudent(studentId),
      this.profileService.getProfile(studentId),
    ]);

    const decision: PlannerDecisionInput | null = pending
      ? {
          conceptId: pending.conceptId,
          topic: pending.topic,
          trigger: pending.trigger,
          action: pending.action,
          difficulty: pending.difficulty,
          masteryBefore: pending.masteryBefore,
          blueprint: (pending.blueprint as PlannerDecisionInput['blueprint']) ?? null,
          reasonCodes: pending.reasonCodes ?? [],
        }
      : null;

    const composed = composeLearningPlan({
      currentGoal: profile?.currentGoal ?? null,
      decision,
      concepts: concepts.map((c) => ({ conceptId: c.conceptId, mastery: c.mastery, confidence: c.confidence })),
    });

    await this.planModel
      .updateOne({ studentId }, { $set: { studentId, ...composed } }, { upsert: true })
      .exec();

    this.logger.log(`Learning plan regenerated for ${studentId}: ${composed.status} — "${composed.objective}"`);
    return this.planModel.findOne({ studentId }).lean<LearningPlanDocument>().exec();
  }

  /** The learner's current plan, lazily composed on first access. */
  async getCurrentPlan(studentId: string): Promise<LearningPlanDocument | null> {
    const existing = await this.planModel.findOne({ studentId }).lean<LearningPlanDocument>().exec();
    if (existing) return existing;
    return this.regenerate(studentId);
  }

  /** Compact plan bundle for the Cognitive Engine's learner context. */
  async getPlanSummary(studentId: string): Promise<Record<string, unknown> | null> {
    const plan = await this.planModel.findOne({ studentId }).lean<LearningPlanDocument>().exec();
    if (!plan) return null;
    return {
      status: plan.status,
      objective: plan.objective,
      topic: plan.topic,
      targetConcepts: plan.targetConcepts,
      revision: plan.revision,
      estimatedMinutes: plan.estimatedMinutes,
    };
  }
}
