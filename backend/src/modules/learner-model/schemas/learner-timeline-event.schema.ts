import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * The learner's chronological educational history (Task 3). Every meaningful
 * learning event is appended here as an immutable, semantic record — distinct
 * from raw behavior telemetry (which is low-level input to feature engineering).
 * This timeline is the learner's memory and the substrate future sprints
 * (weekly reports, AI coach, knowledge graph) read from.
 */

export enum TimelineEventType {
  QUIZ_ATTEMPTED = 'quiz_attempted',
  ADAPTIVE_QUIZ = 'adaptive_quiz',
  CONCEPT_IMPROVED = 'concept_improved',
  CONCEPT_DECLINED = 'concept_declined',
  MISCONCEPTION_DETECTED = 'misconception_detected',
  INTERVENTION_RECOMMENDED = 'intervention_recommended',
  INTERVENTION_ASSESSED = 'intervention_assessed',
  REFLECTION = 'reflection',
  LESSON_COMPLETED = 'lesson_completed',
  FLASHCARDS_GENERATED = 'flashcards_generated',
  TUTOR_SESSION = 'tutor_session',
}

@Schema({ timestamps: true, collection: 'learner_timeline' })
export class LearnerTimelineEvent {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ enum: TimelineEventType, required: true })
  type: TimelineEventType;

  @Prop({ type: String, default: null })
  topic: string | null;

  @Prop({ type: [String], default: [] })
  conceptIds: string[];

  /** Short human-readable line for timeline/report rendering. */
  @Prop({ type: String, default: null })
  summary: string | null;

  /** Structured payload specific to the event type (scores, deltas, etc.). */
  @Prop({ type: Object, default: {} })
  data: Record<string, unknown>;

  @Prop({ type: Date, required: true })
  occurredAt: Date;
}

export type LearnerTimelineEventDocument = LearnerTimelineEvent & Document;
export const LearnerTimelineEventSchema = SchemaFactory.createForClass(LearnerTimelineEvent);

LearnerTimelineEventSchema.index({ studentId: 1, occurredAt: -1 });
