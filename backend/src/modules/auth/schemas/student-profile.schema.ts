import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum MasteryLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Schema({ timestamps: true, collection: 'student_profiles' })
export class StudentProfile {
  @Prop({ required: true, unique: true })
  profileId: string;

  @Prop({ required: true, unique: true })
  studentId: string;

  @Prop({ default: '' })
  grade: string;

  @Prop({ type: [String], default: [] })
  learningGoals: string[];

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ enum: DifficultyLevel, default: DifficultyLevel.BEGINNER })
  preferredDifficulty: DifficultyLevel;

  @Prop({ default: 0.0, min: 0, max: 1 })
  adaptiveScore: number;

  @Prop({ enum: MasteryLevel, default: MasteryLevel.BEGINNER })
  masteryLevel: MasteryLevel;
}

export type StudentProfileDocument = StudentProfile & Document;
export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);

StudentProfileSchema.index({ studentId: 1 }, { unique: true });
