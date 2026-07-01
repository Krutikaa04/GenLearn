import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardController } from './flashcard.controller';
import { FlashcardService } from './flashcard.service';

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

const mockSet = {
  setId: 'set-1',
  studentId: 'student-1',
  topic: 'Arrays',
  status: 'ready',
  cards: [
    { cardId: 'c1', question: 'What is an array?', answer: 'Ordered collection', interval: 1, easeFactor: 2.5, repetitions: 0 },
  ],
};

const mockDueCards = [
  { cardId: 'c2', question: 'Big O of binary search?', answer: 'O(log n)', setId: 'set-2', topic: 'Algorithms' },
];

describe('FlashcardController', () => {
  let controller: FlashcardController;
  let service: jest.Mocked<FlashcardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashcardController],
      providers: [
        {
          provide: FlashcardService,
          useValue: {
            generate: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            getStatus: jest.fn(),
            getDueCards: jest.fn(),
            delete: jest.fn(),
            reviewCard: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(FlashcardController);
    service = module.get(FlashcardService) as jest.Mocked<FlashcardService>;
  });

  describe('generate', () => {
    it('returns generated set wrapped in data', async () => {
      service.generate.mockResolvedValue(mockSet as any);
      const dto = { topic: 'Arrays', count: 10 };
      const result = await controller.generate(jwtPayload as any, dto as any);
      expect(result).toEqual({ data: mockSet });
      expect(service.generate).toHaveBeenCalledWith('student-1', dto);
    });
  });

  describe('findAll', () => {
    it('delegates to service with userId and pagination', async () => {
      const page = { data: [mockSet], total: 1, meta: {} };
      service.findAll.mockResolvedValue(page as any);
      const result = await controller.findAll(jwtPayload as any, 2, 10);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 2, 10);
      expect(result).toBe(page);
    });

    it('caps pageSize at 50', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0, meta: {} } as any);
      await controller.findAll(jwtPayload as any, 1, 200);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 50);
    });
  });

  describe('getStatus', () => {
    it('returns status wrapped in data', async () => {
      const status = { setId: 'set-1', status: 'generating' };
      service.getStatus.mockResolvedValue(status as any);
      const result = await controller.getStatus(jwtPayload as any, 'set-1');
      expect(result).toEqual({ data: status });
      expect(service.getStatus).toHaveBeenCalledWith('set-1', 'student-1');
    });
  });

  describe('getDue', () => {
    it('returns due cards wrapped in data', async () => {
      service.getDueCards.mockResolvedValue(mockDueCards as any);
      const result = await controller.getDue(jwtPayload as any);
      expect(result).toEqual({ data: mockDueCards });
      expect(service.getDueCards).toHaveBeenCalledWith('student-1');
    });

    it('returns empty array when no cards are due', async () => {
      service.getDueCards.mockResolvedValue([]);
      const result = await controller.getDue(jwtPayload as any);
      expect(result).toEqual({ data: [] });
    });
  });

  describe('findOne', () => {
    it('returns flashcard set wrapped in data', async () => {
      service.findOne.mockResolvedValue(mockSet as any);
      const result = await controller.findOne(jwtPayload as any, 'set-1');
      expect(result).toEqual({ data: mockSet });
      expect(service.findOne).toHaveBeenCalledWith('set-1', 'student-1');
    });

    it('propagates NotFoundException when set does not exist', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(jwtPayload as any, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('calls service delete and returns void', async () => {
      service.delete.mockResolvedValue(undefined);
      const result = await controller.delete(jwtPayload as any, 'set-1');
      expect(service.delete).toHaveBeenCalledWith('set-1', 'student-1');
      expect(result).toBeUndefined();
    });
  });

  describe('reviewCard (SRS)', () => {
    it('returns updated card after review', async () => {
      const updated = { cardId: 'c1', interval: 4, easeFactor: 2.6, repetitions: 1 };
      service.reviewCard.mockResolvedValue(updated as any);
      const result = await controller.reviewCard(jwtPayload as any, 'set-1', 'c1', 3);
      expect(result).toEqual({ data: updated });
      expect(service.reviewCard).toHaveBeenCalledWith('set-1', 'student-1', 'c1', 3);
    });

    it('passes Again rating (0) to service', async () => {
      service.reviewCard.mockResolvedValue({} as any);
      await controller.reviewCard(jwtPayload as any, 'set-1', 'c1', 0);
      expect(service.reviewCard).toHaveBeenCalledWith('set-1', 'student-1', 'c1', 0);
    });

    it('passes Easy rating (5) to service', async () => {
      service.reviewCard.mockResolvedValue({} as any);
      await controller.reviewCard(jwtPayload as any, 'set-1', 'c1', 5);
      expect(service.reviewCard).toHaveBeenCalledWith('set-1', 'student-1', 'c1', 5);
    });

    it('propagates BadRequestException from service on invalid card', async () => {
      service.reviewCard.mockRejectedValue(new BadRequestException('Card not found'));
      await expect(
        controller.reviewCard(jwtPayload as any, 'set-1', 'bad-card', 3),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
