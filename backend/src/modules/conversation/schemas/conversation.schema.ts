import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class ConversationTurn {
  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  followUpSuggestions: string[];

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;
}

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ type: [String], default: [] })
  documentIds: string[];

  @Prop({ type: [ConversationTurn], default: [] })
  messages: ConversationTurn[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type ConversationDocument = Conversation & Document;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ conversationId: 1 }, { unique: true });
ConversationSchema.index({ studentId: 1, updatedAt: -1 });
ConversationSchema.index({ deletedAt: 1 });
