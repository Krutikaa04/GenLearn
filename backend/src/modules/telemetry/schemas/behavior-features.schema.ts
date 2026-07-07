import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class QuestionBehaviorFeatures {
  @Prop({ required: true })
  questionId: string;

  @Prop({ default: 0 })
  dwellMs: number;

  @Prop({ type: Number, default: null })
  timeToFirstAnswerMs: number | null;

  @Prop({ default: 0 })
  answerChanges: number;

  @Prop({ default: 0 })
  idleMs: number;

  @Prop({ default: false })
  underTimerPressure: boolean;

  @Prop({ default: 0 })
  tabSwitches: number;

  @Prop({ default: 0 })
  hiddenMs: number;

  @Prop({ default: false })
  answeredAfterTabSwitch: boolean;
}

class SessionBehaviorFeatures {
  @Prop({ default: 0 })
  totalDurationMs: number;

  @Prop({ default: 0 })
  questionCount: number;

  @Prop({ default: 0 })
  answeredCount: number;

  @Prop({ default: 0 })
  avgDwellMs: number;

  @Prop({ default: 0 })
  medianDwellMs: number;

  @Prop({ default: 0 })
  totalAnswerChanges: number;

  @Prop({ default: 0 })
  totalIdleMs: number;

  @Prop({ default: false })
  abandoned: boolean;

  @Prop({ default: false })
  challengeMode: boolean;

  @Prop({ default: 0 })
  totalTabSwitches: number;

  @Prop({ default: 0 })
  tabSwitchAnswerRate: number;
}

/**
 * Engineered behavior signals for one quiz session — the learner model's
 * input. One document per (studentId, sessionId), recomputed idempotently.
 */
@Schema({ timestamps: { createdAt: 'computedAt', updatedAt: 'recomputedAt' }, collection: 'behavior_features' })
export class BehaviorFeatures {
  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop({ type: String, default: null, index: true })
  quizId: string | null;

  @Prop({ type: [QuestionBehaviorFeatures], default: [] })
  perQuestion: QuestionBehaviorFeatures[];

  @Prop({ type: SessionBehaviorFeatures, required: true })
  session: SessionBehaviorFeatures;
}

export type BehaviorFeaturesDocument = BehaviorFeatures & Document;
export const BehaviorFeaturesSchema = SchemaFactory.createForClass(BehaviorFeatures);
