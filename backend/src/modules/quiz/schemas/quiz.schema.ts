import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum QuizStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  READY = 'ready',
  SUBMITTED = 'submitted',
  FAILED = 'failed',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

class QuizQuestion {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true, select: false })
  correctIndex: number;

  @Prop({ required: true, select: false })
  explanation: string;
}

class QuizAnswer {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  selectedIndex: number;

  @Prop({ default: false })
  isCorrect: boolean;
}

@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz {
  @Prop({ required: true, unique: true })
  quizId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ enum: DifficultyLevel, required: true })
  difficulty: DifficultyLevel;

  @Prop({ default: 10 })
  questionCount: number;

  @Prop({ type: [String], default: [] })
  documentIds: string[];

  @Prop({ enum: QuizStatus, default: QuizStatus.PENDING })
  status: QuizStatus;

  @Prop({ default: null })
  title: string | null;

  @Prop({ type: [QuizQuestion], default: [] })
  questions: QuizQuestion[];

  @Prop({ type: [QuizAnswer], default: [] })
  answers: QuizAnswer[];

  @Prop({ default: null })
  score: number | null;

  @Prop({ default: null })
  totalQuestions: number | null;

  @Prop({ default: null })
  submittedAt: Date | null;

  @Prop({ default: null })
  generationError: string | null;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export type QuizDocument = Quiz & Document;
export const QuizSchema = SchemaFactory.createForClass(Quiz);

QuizSchema.index({ quizId: 1 }, { unique: true });
QuizSchema.index({ studentId: 1, createdAt: -1 });
QuizSchema.index({ studentId: 1, status: 1 });
QuizSchema.index({ deletedAt: 1 });
