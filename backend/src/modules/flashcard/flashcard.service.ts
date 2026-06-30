import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { FlashcardRepository } from './flashcard.repository';
import { FlashcardSetStatus, FlashcardSourceType } from './schemas/flashcard.schema';
import { GenerateFlashcardsDto } from './dto/generate-flashcards.dto';
import { FLASHCARD_GENERATION_QUEUE, FlashcardGenerationJob } from './workers/flashcard-generator.processor';

@Injectable()
export class FlashcardService {
  private readonly logger = new Logger(FlashcardService.name);

  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    @InjectQueue(FLASHCARD_GENERATION_QUEUE) private readonly generationQueue: Queue,
  ) {}

  async generate(studentId: string, dto: GenerateFlashcardsDto) {
    const setId = uuidv4();
    const title = dto.title || `Flashcards: ${dto.sourceType} ${dto.sourceId.slice(0, 8)}`;

    const set = await this.flashcardRepository.create({
      setId,
      studentId,
      title,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      status: FlashcardSetStatus.PENDING,
    });

    const jobData: FlashcardGenerationJob = {
      setId,
      studentId,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      count: dto.count ?? 15,
    };

    await this.generationQueue.add('generate', jobData, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.logger.log(`Flashcard set ${setId} queued for generation`);

    return {
      setId: set.setId,
      title: set.title,
      status: set.status,
      sourceType: set.sourceType,
      sourceId: set.sourceId,
      pollUrl: `/api/v1/flashcards/${setId}/status`,
    };
  }

  async findAll(studentId: string, page = 1, pageSize = 20) {
    const { items, total } = await this.flashcardRepository.findByStudentId(studentId, page, pageSize);
    return {
      data: items.map((s) => this.serialize(s, false)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(setId: string, studentId: string) {
    const set = await this.findReady(setId, studentId);
    return this.serialize(set, true);
  }

  async getStatus(setId: string, studentId: string) {
    const set = await this.findAndCheckOwnership(setId, studentId);
    return { setId: set.setId, status: set.status, generationError: set.generationError };
  }

  async delete(setId: string, studentId: string): Promise<void> {
    await this.findAndCheckOwnership(setId, studentId);
    await this.flashcardRepository.softDelete(setId);
  }

  private async findAndCheckOwnership(setId: string, studentId: string) {
    const set = await this.flashcardRepository.findById(setId);
    if (!set) throw new NotFoundException({ code: 'FLASHCARD_SET_NOT_FOUND', message: 'Flashcard set not found' });
    if (set.studentId !== studentId) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    return set;
  }

  private async findReady(setId: string, studentId: string) {
    const set = await this.findAndCheckOwnership(setId, studentId);
    if (set.status !== FlashcardSetStatus.READY) {
      throw new UnprocessableEntityException({
        code: set.status === FlashcardSetStatus.FAILED ? 'FLASHCARD_GENERATION_FAILED' : 'FLASHCARD_SET_NOT_READY',
        message: set.status === FlashcardSetStatus.FAILED ? 'Flashcard generation failed' : 'Flashcards are still being generated',
      });
    }
    return set;
  }

  private serialize(set: any, includeCards: boolean) {
    return {
      setId: set.setId,
      title: set.title,
      sourceType: set.sourceType,
      sourceId: set.sourceId,
      status: set.status,
      cardCount: set.cards?.length ?? 0,
      ...(includeCards ? { cards: set.cards } : {}),
      createdAt: set.createdAt,
      updatedAt: set.updatedAt,
    };
  }
}
