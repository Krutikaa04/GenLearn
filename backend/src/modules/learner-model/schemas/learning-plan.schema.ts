import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * The single active Learning Plan per learner (Sprint 3). Upserted, never
 * duplicated — there is exactly one current plan and one current objective at a
 * time. The plan is *composed* from existing intelligence (persistent profile,
 * the pending pedagogical decision, and concept mastery); it does not re-derive
 * adaptive logic. It is regenerated after every mastery-changing activity so the
 * "Continue Learning" action always has a fresh next session to run.
 */

export enum PlanStatus {
  /** A concrete next session is ready to run. */
  ACTIVE = 'active',
  /** No history yet (or all mastered) — learner should pick a topic to begin. */
  AWAITING_TOPIC = 'awaiting_topic',
}

export class PlanRevision {
  @Prop({ type: [String], default: [] }) revise: string[];
  @Prop({ type: [String], default: [] }) reinforce: string[];
  @Prop({ type: [String], default: [] }) advance: string[];
  @Prop({ type: [String], default: [] }) prerequisites: string[];
}

@Schema({ timestamps: true, collection: 'learning_plans' })
export class LearningPlan {
  @Prop({ required: true, unique: true, index: true })
  studentId: string;

  @Prop({ enum: PlanStatus, default: PlanStatus.AWAITING_TOPIC })
  status: PlanStatus;

  @Prop({ type: String, default: null })
  currentGoal: string | null;

  /** Exactly one measurable objective for the session. */
  @Prop({ type: String, required: true })
  objective: string;

  @Prop({ type: String, default: null })
  topic: string | null;

  @Prop({ type: [String], default: [] })
  targetConcepts: string[];

  /** Whether a lesson should precede the quiz (misconception/weak concept). */
  @Prop({ type: Object, default: { needed: false } })
  recommendedLesson: Record<string, unknown>;

  /** The adaptive quiz the "Continue Learning" action will run. */
  @Prop({ type: Object, default: { needed: false } })
  recommendedQuiz: Record<string, unknown>;

  @Prop({ type: PlanRevision, default: {} })
  revision: PlanRevision;

  @Prop({ type: Object, default: { needed: false, concepts: [] } })
  recommendedFlashcards: Record<string, unknown>;

  @Prop({ default: 15 })
  estimatedMinutes: number;

  @Prop({ type: String, default: null })
  expectedOutcome: string | null;

  @Prop({ type: String, default: null })
  completionCriteria: string | null;

  /** What the planner will do once this session completes. */
  @Prop({ type: String, default: null })
  nextPlannerDecision: string | null;

  @Prop({ type: [String], default: [] })
  reasonCodes: string[];

  @Prop({ type: Date, default: null })
  generatedAt: Date | null;
}

export type LearningPlanDocument = LearningPlan & Document;
export const LearningPlanSchema = SchemaFactory.createForClass(LearningPlan);
