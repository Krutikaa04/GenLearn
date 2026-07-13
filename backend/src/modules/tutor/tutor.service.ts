import { Injectable } from '@nestjs/common';
import { CognitiveEngineService } from '../cognitive-engine/cognitive-engine.service';
import { TutorChatDto } from './dto/tutor-chat.dto';

@Injectable()
export class TutorService {
  constructor(private readonly cognitive: CognitiveEngineService) {}

  async chat(userId: string, dto: TutorChatDto) {
    return this.cognitive.tutorChat({
      studentId: userId,
      topic: dto.topic,
      message: dto.message,
      conversationHistory: dto.conversationHistory ?? [],
      documentIds: dto.documentIds,
      studentContext: dto.studentContext,
    });
  }
}
