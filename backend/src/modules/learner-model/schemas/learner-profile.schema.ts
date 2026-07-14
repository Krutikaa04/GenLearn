import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Persistent Learner Intelligence (PLI) — one continuously-evolving cognitive
 * profile per learner. This document is upserted and never recreated: it is the
 * aggregate/rollup layer over the per-concept mastery states and the learning
 * timeline. Concept-level truth lives in ConceptMastery; this profile summarises
 * *how* the learner learns (velocity, support dependency, preferences, trends,
 * which interventions historically helped) for adaptive planning and AI context.
 */

export enum LearningStage {
  ONBOARDING = 'onboarding',
  BUILDING = 'building',
  CONSOLIDATING = 'consolidating',
  ADVANCING = 'advancing',
}

export class ActiveTopic {
  @Prop({ required: true }) topic: string;
  @Prop({ default: 0 }) conceptCount: number;
  @Prop({ type: Date, default: null }) lastActiveAt: Date | null;
}

/** Rolling effectiveness of one intervention type for this learner (Task 5). */
export class InterventionEffect {
  @Prop({ default: 0 }) count: number;
  @Prop({ default: 0 }) avgMasteryDelta: number;
}

/** One stored reflection from a completed adaptive session (Task 10). */
export class LearnerReflection {
  @Prop({ type: Date, default: null }) sessionAt: Date | null;
  @Prop({ type: [String], default: [] }) improved: string[];
  @Prop({ type: [String], default: [] }) struggled: string[];
  @Prop({ type: String, default: null }) behaviorSummary: string | null;
  @Prop({ type: String, default: null }) nextRecommendation: string | null;
}

@Schema({ timestamps: true, collection: 'learner_profiles' })
export class LearnerProfile {
  @Prop({ required: true, unique: true, index: true })
  studentId: string;

  // ── Learning identity & goals ──
  @Prop({ type: String, default: 'new-learner' })
  learningIdentity: string;

  @Prop({ type: String, default: null })
  currentGoal: string | null;

  @Prop({ type: String, default: null })
  futureObjective: string | null;

  @Prop({ enum: LearningStage, default: LearningStage.ONBOARDING })
  learningStage: LearningStage;

  @Prop({ type: [ActiveTopic], default: [] })
  activeTopics: ActiveTopic[];

  // ── Rollup intelligence (flexible shapes; computed each update) ──
  @Prop({ type: Object, default: {} })
  velocity: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  consistency: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  supportDependency: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  preferences: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  trends: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  retentionSummary: Record<string, unknown>;

  /** Keyed by intervention type (lesson | quiz | flashcards | tutor). */
  @Prop({ type: Object, default: {} })
  interventionEffectiveness: Record<string, InterventionEffect>;

  /** Most recent reflections, capped to keep the document bounded. */
  @Prop({ type: [LearnerReflection], default: [] })
  reflections: LearnerReflection[];

  // ── Counters / bookkeeping ──
  @Prop({ default: 0 })
  conceptsTracked: number;

  @Prop({ default: 0 })
  totalEvidence: number;

  @Prop({ default: 0 })
  sessionsCount: number;

  @Prop({ type: Date, default: null })
  lastActivityAt: Date | null;
}

export type LearnerProfileDocument = LearnerProfile & Document;
export const LearnerProfileSchema = SchemaFactory.createForClass(LearnerProfile);
