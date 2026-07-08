import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'classrooms' })
export class Classroom {
  @Prop({ required: true, unique: true })
  classroomId: string;

  @Prop({ required: true, index: true })
  teacherId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  description: string;

  /** Short shareable code students use to join (XXXX-XXXX, unambiguous alphabet). */
  @Prop({ required: true, unique: true })
  joinCode: string;

  @Prop({ type: [String], default: [], index: true })
  memberIds: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type ClassroomDocument = Classroom & Document;
export const ClassroomSchema = SchemaFactory.createForClass(Classroom);

ClassroomSchema.index({ teacherId: 1, createdAt: -1 });
