import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class TopicMastery {
  @Prop({ required: true })
  topic: string;

  @Prop({ required: true, min: 0, max: 100 })
  masteryScore: number;

  @Prop({ required: true })
  quizzesTaken: number;

  @Prop({ required: true, min: 0, max: 100 })
  averageScore: number;

  @Prop({ required: true })
  lastAttemptAt: Date;
}

export class EarnedBadge {
  @Prop({ required: true })
  badgeId: string;

  @Prop({ required: true })
  earnedAt: Date;
}

@Schema({ timestamps: true, collection: 'student_progress' })
export class StudentProgress {
  @Prop({ required: true, unique: true })
  studentId: string;

  @Prop({ default: 0 })
  totalQuizzesTaken: number;

  @Prop({ default: 0 })
  totalDocumentsUploaded: number;

  @Prop({ default: 0 })
  totalLessonsGenerated: number;

  @Prop({ default: 0 })
  totalFlashcardSetsCreated: number;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop({ type: Date, default: null })
  lastActiveDate: Date | null;

  @Prop({ type: [TopicMastery], default: [] })
  topicMastery: TopicMastery[];

  @Prop({ default: 0, min: 0, max: 100 })
  overallMasteryScore: number;

  @Prop({ default: 0 })
  totalFlashcardsReviewed: number;

  @Prop({ default: 0 })
  xpTotal: number;

  @Prop({ type: [EarnedBadge], default: [] })
  badges: EarnedBadge[];
}

export type StudentProgressDocument = StudentProgress & Document;
export const StudentProgressSchema = SchemaFactory.createForClass(StudentProgress);
