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
import { FlashcardSetStatus } from './schemas/flashcard.schema';
import { GenerateFlashcardsDto } from './dto/generate-flashcards.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { FLASHCARD_GENERATION_QUEUE, FlashcardGenerationJob } from './workers/flashcard-generator.processor';

@Injectable()
export class FlashcardService {
  private readonly logger = new Logger(FlashcardService.name);

  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    private readonly analyticsService: AnalyticsService,
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
    this.analyticsService.recordActivity(studentId, 'flashcard').catch(() => {});

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

  async reviewCard(setId: string, studentId: string, cardId: string, rating: number) {
    const set = await this.findReady(setId, studentId);
    const card = set.cards.find((c: any) => c.cardId === cardId);
    if (!card) throw new NotFoundException({ code: 'CARD_NOT_FOUND', message: 'Card not found' });

    const { easeFactor, interval, repetitions, nextReviewAt } = this.sm2(
      rating,
      (card as any).easeFactor ?? 2.5,
      (card as any).interval ?? 0,
      (card as any).repetitions ?? 0,
    );

    await this.flashcardRepository.reviewCard(setId, cardId, easeFactor, interval, repetitions, nextReviewAt);

    this.analyticsService
      .recordActivity(studentId, 'flashcard_review')
      .catch((err) => this.logger.warn(`Analytics update failed for card review: ${(err as Error).message}`));

    return { cardId, easeFactor, interval, repetitions, nextReviewAt };
  }

  async getDueCards(studentId: string) {
    const due = await this.flashcardRepository.getDueCards(studentId);
    return due.map(({ setId, setTitle, card }) => ({
      setId,
      setTitle,
      cardId: card.cardId,
      front: card.front,
      back: card.back,
      hint: card.hint,
      nextReviewAt: card.nextReviewAt,
    }));
  }

  private sm2(
    rating: number,
    easeFactor: number,
    interval: number,
    repetitions: number,
  ): { easeFactor: number; interval: number; repetitions: number; nextReviewAt: Date } {
    // SM-2 algorithm
    let newInterval: number;
    let newRepetitions: number;
    let newEaseFactor: number;

    if (rating < 3) {
      // Incorrect or very hard — reset
      newRepetitions = 0;
      newInterval = 1;
      newEaseFactor = easeFactor;
    } else {
      newRepetitions = repetitions + 1;
      if (repetitions === 0) {
        newInterval = 1;
      } else if (repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
      // Update ease factor: EF' = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02))
      newEaseFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
      if (newEaseFactor < 1.3) newEaseFactor = 1.3;
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

    return {
      easeFactor: Math.round(newEaseFactor * 100) / 100,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewAt,
    };
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
