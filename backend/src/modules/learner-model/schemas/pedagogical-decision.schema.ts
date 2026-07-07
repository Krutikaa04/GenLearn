import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DecisionTrigger {
  MISCONCEPTION = 'misconception',
  WEAK_CONCEPT = 'weak_concept',
  PRACTICE = 'practice',
  ADVANCE = 'advance',
}

export enum DecisionAction {
  LESSON = 'lesson',
  QUIZ = 'quiz',
}

export enum DecisionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
}

/**
 * One pedagogical decision = the policy's answer to "what should this
 * student do next, and why". masteryBefore/After bracket the recommended
 * activity so intervention effectiveness can be measured.
 */
@Schema({ timestamps: true, collection: 'pedagogical_decisions' })
export class PedagogicalDecision {
  @Prop({ required: true, unique: true })
  decisionId: string;

  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  conceptId: string;

  /** Human-readable topic for generation prompts and UI copy. */
  @Prop({ required: true })
  topic: string;

  @Prop({ enum: DecisionTrigger, required: true })
  trigger: DecisionTrigger;

  @Prop({ enum: DecisionAction, required: true })
  action: DecisionAction;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ enum: DecisionStatus, default: DecisionStatus.PENDING, index: true })
  status: DecisionStatus;

  @Prop({ required: true })
  masteryBefore: number;

  @Prop({ type: Number, default: null })
  masteryAfter: number | null;

  @Prop({ type: String, default: null })
  sourceQuizId: string | null;

  /** Set once an adaptive activity has been generated for this decision. */
  @Prop({ type: String, default: null })
  generatedActivityId: string | null;
}

export type PedagogicalDecisionDocument = PedagogicalDecision & Document;
export const PedagogicalDecisionSchema = SchemaFactory.createForClass(PedagogicalDecision);

PedagogicalDecisionSchema.index({ studentId: 1, status: 1, createdAt: -1 });
