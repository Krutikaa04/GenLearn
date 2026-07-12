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

export enum CognitiveLevel {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand',
  APPLY = 'apply',
  ANALYZE = 'analyze',
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

  @Prop({ type: String, default: null })
  topic: string | null;

  // Adaptive-learning concept metadata. Optional and internal-only (never
  // serialized to API responses); legacy quizzes without it keep working —
  // consumers must treat absence as "no concept data" and fall back to topic.
  @Prop({ type: [String], default: [] })
  conceptIds: string[];

  @Prop({ type: String, default: null })
  primaryConceptId: string | null;

  @Prop({ type: String, enum: [...Object.values(CognitiveLevel), null], default: null })
  cognitiveLevel: CognitiveLevel | null;

  /** LLM's estimate of a reasonable read+answer time; the learner model
   * compares actual answer time against it. Null on legacy questions. */
  @Prop({ type: Number, default: null })
  expectedSeconds: number | null;
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

  @Prop({ type: String, default: null })
  title: string | null;

  @Prop({ type: [QuizQuestion], default: [] })
  questions: QuizQuestion[];

  @Prop({ type: [QuizAnswer], default: [] })
  answers: QuizAnswer[];

  @Prop({ type: Number, default: null })
  score: number | null;

  @Prop({ type: Number, default: null })
  totalQuestions: number | null;

  @Prop({ type: Date, default: null })
  submittedAt: Date | null;

  @Prop({ default: false })
  challengeMode: boolean;

  /** True when this quiz was auto-planned by the adaptive loop (not manual). */
  @Prop({ default: false })
  adaptive: boolean;

  @Prop({ type: Number, default: null })
  timeLimitMinutes: number | null;

  @Prop({ type: [String], default: [] })
  challengeTopics: string[];

  @Prop({ type: String, default: null })
  generationError: string | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type QuizDocument = Quiz & Document;
export const QuizSchema = SchemaFactory.createForClass(Quiz);

QuizSchema.index({ studentId: 1, createdAt: -1 });
QuizSchema.index({ studentId: 1, status: 1 });
QuizSchema.index({ deletedAt: 1 });
