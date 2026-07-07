import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class MisconceptionFlag {
  @Prop({ required: true })
  quizId: string;

  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  flaggedAt: Date;
}

/**
 * Concept-level learner model: one document per (student, concept).
 * Concepts come from quiz-question metadata; legacy quizzes bridge via a
 * slugified topic string. Created lazily on first evidence — no backfill.
 */
@Schema({ timestamps: true, collection: 'concept_mastery' })
export class ConceptMastery {
  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  conceptId: string;

  @Prop({ default: 0, min: 0, max: 100 })
  mastery: number;

  /** How much evidence backs the mastery estimate (0-1). */
  @Prop({ default: 0, min: 0, max: 1 })
  confidence: number;

  @Prop({ default: 0 })
  evidenceCount: number;

  @Prop({ type: Date, default: null })
  lastEvidenceAt: Date | null;

  @Prop({ type: [MisconceptionFlag], default: [] })
  misconceptionFlags: MisconceptionFlag[];
}

export type ConceptMasteryDocument = ConceptMastery & Document;
export const ConceptMasterySchema = SchemaFactory.createForClass(ConceptMastery);

ConceptMasterySchema.index({ studentId: 1, conceptId: 1 }, { unique: true });
