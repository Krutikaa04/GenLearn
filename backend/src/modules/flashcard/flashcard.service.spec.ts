import { NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { FlashcardService } from './flashcard.service';
import { FlashcardSetStatus, FlashcardSourceType } from './schemas/flashcard.schema';

describe('FlashcardService', () => {
  let service: FlashcardService;
  let repository: { findById: jest.Mock; reviewCard: jest.Mock; getDueCards: jest.Mock };
  let analytics: { recordActivity: jest.Mock };
  let queue: { add: jest.Mock };

  const makeSet = (overrides: Partial<any> = {}) => ({
    setId: 'set-1',
    studentId: 'student-1',
    status: FlashcardSetStatus.READY,
    cards: [
      { cardId: 'card-1', front: 'Q', back: 'A', easeFactor: 2.5, interval: 0, repetitions: 0, nextReviewAt: null },
    ],
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      reviewCard: jest.fn(),
      getDueCards: jest.fn(),
    };
    analytics = { recordActivity: jest.fn().mockResolvedValue(undefined) };
    queue = { add: jest.fn() };
    service = new FlashcardService(repository as any, analytics as any, queue as any);
  });

  describe('reviewCard / SM-2 scheduling', () => {
    it('rejects review for a set owned by a different student', async () => {
      repository.findById.mockResolvedValue(makeSet({ studentId: 'other-student' }));

      await expect(service.reviewCard('set-1', 'student-1', 'card-1', 5)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the card does not exist', async () => {
      repository.findById.mockResolvedValue(makeSet());

      await expect(service.reviewCard('set-1', 'student-1', 'missing-card', 5)).rejects.toThrow(NotFoundException);
    });

    it('rejects review when the set is not ready', async () => {
      repository.findById.mockResolvedValue(makeSet({ status: FlashcardSetStatus.GENERATING }));

      await expect(service.reviewCard('set-1', 'student-1', 'card-1', 5)).rejects.toThrow(UnprocessableEntityException);
    });

    it('resets repetitions and sets a 1-day interval on a failing rating (<3)', async () => {
      repository.findById.mockResolvedValue(
        makeSet({ cards: [{ cardId: 'card-1', easeFactor: 2.5, interval: 10, repetitions: 3 }] }),
      );

      const result = await service.reviewCard('set-1', 'student-1', 'card-1', 1);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBe(2.5); // unchanged on failure
      expect(repository.reviewCard).toHaveBeenCalledWith('set-1', 'card-1', 2.5, 1, 0, expect.any(Date));
    });

    it('schedules first successful review (repetitions 0 -> 1) with a 1-day interval', async () => {
      repository.findById.mockResolvedValue(
        makeSet({ cards: [{ cardId: 'card-1', easeFactor: 2.5, interval: 0, repetitions: 0 }] }),
      );

      const result = await service.reviewCard('set-1', 'student-1', 'card-1', 5);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
    });

    it('schedules second successful review (repetitions 1 -> 2) with a 6-day interval', async () => {
      repository.findById.mockResolvedValue(
        makeSet({ cards: [{ cardId: 'card-1', easeFactor: 2.5, interval: 1, repetitions: 1 }] }),
      );

      const result = await service.reviewCard('set-1', 'student-1', 'card-1', 5);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });

    it('multiplies interval by ease factor on the third+ successful review', async () => {
      repository.findById.mockResolvedValue(
        makeSet({ cards: [{ cardId: 'card-1', easeFactor: 2.5, interval: 6, repetitions: 2 }] }),
      );

      const result = await service.reviewCard('set-1', 'student-1', 'card-1', 5);

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
    });

    it('increases ease factor for a perfect rating (5) and decreases it for a barely-passing rating (3)', async () => {
      repository.findById
        .mockResolvedValueOnce(makeSet({ cards: [{ cardId: 'card-1', easeFactor: 2.5, interval: 6, repetitions: 2 }] }))
        .mockResolvedValueOnce(makeSet({ cards: [{ cardId: 'card-1', easeFactor: 2.5, interval: 6, repetitions: 2 }] }));

      const perfect = await service.reviewCard('set-1', 'student-1', 'card-1', 5);
      const barelyPassing = await service.reviewCard('set-1', 'student-1', 'card-1', 3);

      expect(perfect.easeFactor).toBeGreaterThan(2.5);
      expect(barelyPassing.easeFactor).toBeLessThan(2.5);
    });

    it('never lets ease factor drop below the SM-2 floor of 1.3', async () => {
      repository.findById.mockResolvedValue(
        makeSet({ cards: [{ cardId: 'card-1', easeFactor: 1.3, interval: 6, repetitions: 2 }] }),
      );

      const result = await service.reviewCard('set-1', 'student-1', 'card-1', 3);

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('generate', () => {
    it('queues a generation job and returns a pending set summary', async () => {
      repository.findById.mockResolvedValue(undefined);
      const created = { setId: 'new-set', title: 'My Set', status: FlashcardSetStatus.PENDING, sourceType: FlashcardSourceType.DOCUMENT, sourceId: 'doc-1' };
      const create = jest.fn().mockResolvedValue(created);
      (service as any).flashcardRepository.create = create;

      const result = await service.generate('student-1', {
        sourceType: FlashcardSourceType.DOCUMENT,
        sourceId: 'doc-1',
        title: 'My Set',
        count: 10,
      } as any);

      expect(create).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith(
        'generate',
        expect.objectContaining({ studentId: 'student-1', count: 10, sourceId: 'doc-1' }),
        expect.any(Object),
      );
      expect(result.status).toBe(FlashcardSetStatus.PENDING);
    });
  });
});
