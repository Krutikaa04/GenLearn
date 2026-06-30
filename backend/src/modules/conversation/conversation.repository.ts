import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectModel(Conversation.name) private readonly model: Model<ConversationDocument>,
  ) {}

  async create(data: Partial<Conversation>): Promise<ConversationDocument> {
    return this.model.create(data);
  }

  async findById(conversationId: string): Promise<ConversationDocument | null> {
    return this.model.findOne({ conversationId, deletedAt: null }).exec();
  }

  async findByStudentId(
    studentId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: ConversationDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.model
        .find({ studentId, deletedAt: null })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('-messages')
        .exec(),
      this.model.countDocuments({ studentId, deletedAt: null }),
    ]);
    return { items, total };
  }

  async appendTurns(
    conversationId: string,
    turns: { role: 'user' | 'assistant'; content: string; followUpSuggestions?: string[]; createdAt: Date }[],
  ): Promise<void> {
    await this.model
      .updateOne({ conversationId }, { $push: { messages: { $each: turns } } })
      .exec();
  }

  async softDelete(conversationId: string): Promise<void> {
    await this.model.updateOne({ conversationId }, { $set: { deletedAt: new Date() } }).exec();
  }
}
