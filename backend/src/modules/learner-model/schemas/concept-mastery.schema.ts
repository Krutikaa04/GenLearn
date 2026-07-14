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

  // ── Concept-level intelligence (Sprint 2, all additive/optional) ──

  /** Direction of the last mastery movement. 'new' until enough evidence. */
  @Prop({ type: String, enum: ['new', 'improving', 'declining', 'stable'], default: 'new' })
  trend: 'new' | 'improving' | 'declining' | 'stable';

  /** Recent mastery samples (capped) — the basis for trend/velocity calc. */
  @Prop({ type: [{ mastery: Number, at: Date }], default: [] })
  masteryHistory: { mastery: number; at: Date }[];

  /** When the learner last actively practiced this concept. */
  @Prop({ type: Date, default: null })
  lastPracticedAt: Date | null;

  /** How many times an intervention targeted this concept. */
  @Prop({ default: 0 })
  interventionCount: number;

  // ── Retention scaffolding (Task 8 — stored now, used by a future sprint) ──

  /** 0-100 priority for review; higher = more overdue/at-risk. */
  @Prop({ default: 0 })
  reviewPriority: number;

  /** Qualitative retention direction; null until a forgetting model fills it. */
  @Prop({ type: String, default: null })
  retentionTrend: string | null;
}

export type ConceptMasteryDocument = ConceptMastery & Document;
export const ConceptMasterySchema = SchemaFactory.createForClass(ConceptMastery);

ConceptMasterySchema.index({ studentId: 1, conceptId: 1 }, { unique: true });
