import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FlashcardRepository } from '../flashcard.repository';
import { AiGatewayService } from '../../ai-gateway/ai-gateway.service';
import { FlashcardSetStatus, FlashcardSourceType } from '../schemas/flashcard.schema';

export const FLASHCARD_GENERATION_QUEUE = 'flashcard-generation';

export interface FlashcardGenerationJob {
  setId: string;
  studentId: string;
  sourceType: FlashcardSourceType;
  sourceId: string;
  count: number;
}

@Processor(FLASHCARD_GENERATION_QUEUE)
export class FlashcardGeneratorWorker extends WorkerHost {
  private readonly logger = new Logger(FlashcardGeneratorWorker.name);

  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    private readonly aiGateway: AiGatewayService,
  ) {
    super();
  }

  async process(job: Job<FlashcardGenerationJob>): Promise<void> {
    const { setId, studentId, sourceType, sourceId, count } = job.data;
    this.logger.log(`Generating flashcard set ${setId} from ${sourceType}:${sourceId}`);

    try {
      await this.flashcardRepository.updateStatus(setId, FlashcardSetStatus.GENERATING);

      const result = await this.aiGateway.generateFlashcards({
        setId,
        studentId,
        sourceType,
        sourceId,
        count,
      });

      await this.flashcardRepository.updateStatus(setId, FlashcardSetStatus.READY, {
        cards: result.cards as any,
      });

      this.logger.log(`Flashcard set ${setId} generated: ${result.cards.length} cards`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Flashcard set ${setId} generation failed: ${message}`);
      await this.flashcardRepository.updateStatus(setId, FlashcardSetStatus.FAILED, {
        generationError: message,
      });
    }
  }
}
