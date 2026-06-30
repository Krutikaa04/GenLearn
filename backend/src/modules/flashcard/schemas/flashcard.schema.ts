import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum FlashcardSetStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

export enum FlashcardSourceType {
  DOCUMENT = 'document',
  LESSON = 'lesson',
}

class FlashcardItem {
  @Prop({ required: true })
  cardId: string;

  @Prop({ required: true })
  front: string;

  @Prop({ required: true })
  back: string;

  @Prop({ type: String, default: null })
  hint: string | null;
}

@Schema({ timestamps: true, collection: 'flashcard_sets' })
export class FlashcardSet {
  @Prop({ required: true, unique: true })
  setId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ enum: FlashcardSourceType, required: true })
  sourceType: FlashcardSourceType;

  @Prop({ required: true })
  sourceId: string;

  @Prop({ enum: FlashcardSetStatus, default: FlashcardSetStatus.PENDING })
  status: FlashcardSetStatus;

  @Prop({ type: [FlashcardItem], default: [] })
  cards: FlashcardItem[];

  @Prop({ type: String, default: null })
  generationError: string | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type FlashcardSetDocument = FlashcardSet & Document;
export const FlashcardSetSchema = SchemaFactory.createForClass(FlashcardSet);

FlashcardSetSchema.index({ setId: 1 }, { unique: true });
FlashcardSetSchema.index({ studentId: 1, createdAt: -1 });
FlashcardSetSchema.index({ studentId: 1, sourceType: 1, sourceId: 1 });
FlashcardSetSchema.index({ deletedAt: 1 });
