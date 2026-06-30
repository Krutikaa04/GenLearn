import { Injectable } from '@nestjs/common';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { TutorChatDto } from './dto/tutor-chat.dto';

@Injectable()
export class TutorService {
  constructor(private readonly aiGateway: AiGatewayService) {}

  async chat(userId: string, dto: TutorChatDto) {
    return this.aiGateway.tutorChat({
      studentId: userId,
      topic: dto.topic,
      message: dto.message,
      conversationHistory: dto.conversationHistory ?? [],
      documentIds: dto.documentIds,
      studentContext: dto.studentContext,
    });
  }
}
