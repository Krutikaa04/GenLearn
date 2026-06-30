import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum LessonStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

class LessonSection {
  @Prop({ required: true })
  heading: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  keyPoints: string[];

  @Prop({ type: String, default: null })
  codeExample: string | null;
}

@Schema({ timestamps: true, collection: 'lessons' })
export class Lesson {
  @Prop({ required: true, unique: true })
  lessonId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ enum: DifficultyLevel, required: true })
  difficulty: DifficultyLevel;

  @Prop({ type: [String], default: [] })
  documentIds: string[];

  @Prop({ enum: LessonStatus, default: LessonStatus.PENDING })
  status: LessonStatus;

  @Prop({ type: String, default: null })
  title: string | null;

  @Prop({ type: String, default: null })
  summary: string | null;

  @Prop({ type: [LessonSection], default: [] })
  sections: LessonSection[];

  @Prop({ type: [String], default: [] })
  keyTakeaways: string[];

  @Prop({ type: Number, default: null })
  estimatedReadMinutes: number | null;

  @Prop({ type: String, default: null })
  generationError: string | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type LessonDocument = Lesson & Document;
export const LessonSchema = SchemaFactory.createForClass(Lesson);

LessonSchema.index({ lessonId: 1 }, { unique: true });
LessonSchema.index({ studentId: 1, createdAt: -1 });
LessonSchema.index({ studentId: 1, status: 1 });
LessonSchema.index({ studentId: 1, topic: 1 });
LessonSchema.index({ deletedAt: 1 });
