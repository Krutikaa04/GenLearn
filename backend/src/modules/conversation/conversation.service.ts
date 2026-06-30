import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ConversationRepository } from './conversation.repository';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async sendMessage(
    studentId: string,
    params: {
      conversationId?: string;
      topic: string;
      message: string;
      documentIds?: string[];
      studentContext?: Record<string, unknown>;
    },
  ) {
    const existing = params.conversationId
      ? await this.conversationRepository.findById(params.conversationId)
      : null;

    if (existing && existing.studentId !== studentId) {
      throw new ForbiddenException('Conversation does not belong to this student');
    }

    const topic = existing?.topic ?? params.topic;
    const documentIds = params.documentIds ?? existing?.documentIds ?? [];
    const conversationHistory = (existing?.messages ?? []).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Only persist once the AI call succeeds — a failed generation must not
    // leave behind an empty conversation record.
    const result = await this.aiGateway.tutorChat({
      studentId,
      topic,
      message: params.message,
      conversationHistory,
      documentIds,
      studentContext: params.studentContext,
    });

    const now = new Date();
    const turns = [
      { role: 'user' as const, content: params.message, followUpSuggestions: [], createdAt: now },
      {
        role: 'assistant' as const,
        content: result.reply,
        followUpSuggestions: result.followUpSuggestions ?? [],
        createdAt: now,
      },
    ];

    let conversationId: string;
    if (existing) {
      conversationId = existing.conversationId;
      await this.conversationRepository.appendTurns(conversationId, turns);
    } else {
      conversationId = uuidv4();
      await this.conversationRepository.create({
        conversationId,
        studentId,
        topic,
        documentIds,
        messages: turns,
      });
    }

    return {
      conversationId,
      reply: result.reply,
      followUpSuggestions: result.followUpSuggestions ?? [],
      sources: result.sources ?? [],
    };
  }

  async findAll(studentId: string, page: number, pageSize: number) {
    const { items, total } = await this.conversationRepository.findByStudentId(studentId, page, pageSize);
    return {
      items: items.map((c) => ({
        conversationId: c.conversationId,
        topic: c.topic,
        updatedAt: (c as any).updatedAt,
        createdAt: (c as any).createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(conversationId: string, studentId: string) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.studentId !== studentId) throw new ForbiddenException('Conversation does not belong to this student');

    return {
      conversationId: conversation.conversationId,
      topic: conversation.topic,
      documentIds: conversation.documentIds,
      messages: conversation.messages,
    };
  }

  async delete(conversationId: string, studentId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.studentId !== studentId) throw new ForbiddenException('Conversation does not belong to this student');
    await this.conversationRepository.softDelete(conversationId);
  }
}
