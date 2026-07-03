import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Raw behavior events captured from the frontend (quiz interactions in v1).
 * Append-only evidence store consumed by the feature-engineering worker.
 */
@Schema({ timestamps: { createdAt: 'receivedAt', updatedAt: false }, collection: 'learning_events' })
export class LearningEvent {
  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ type: String, default: null, index: true })
  quizId: string | null;

  @Prop({ required: true })
  type: string;

  @Prop({ type: String, default: null })
  questionId: string | null;

  @Prop({ type: Object, default: null })
  data: Record<string, unknown> | null;

  @Prop({ type: Date, required: true })
  clientTs: Date;
}

export type LearningEventDocument = LearningEvent & Document;
export const LearningEventSchema = SchemaFactory.createForClass(LearningEvent);
