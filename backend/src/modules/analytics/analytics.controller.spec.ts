import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

const mockProgress = {
  currentStreak: 7,
  longestStreak: 14,
  overallMasteryScore: 82,
  totalDocumentsUploaded: 5,
  totalLessonsGenerated: 10,
  totalQuizzesTaken: 20,
  totalFlashcardSetsCreated: 3,
  topicMastery: [{ topic: 'Arrays', masteryScore: 90 }],
};

const mockWeakTopics = [
  { topic: 'Graphs', masteryScore: 30 },
  { topic: 'DP', masteryScore: 45 },
];

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getProgress: jest.fn(),
            getWeakTopics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AnalyticsController);
    service = module.get(AnalyticsService) as jest.Mocked<AnalyticsService>;
  });

  describe('getProgress', () => {
    it('returns progress data wrapped in data envelope', async () => {
      service.getProgress.mockResolvedValue(mockProgress as any);
      const result = await controller.getProgress(jwtPayload as any);
      expect(result).toEqual({ data: mockProgress });
      expect(service.getProgress).toHaveBeenCalledWith('student-1');
    });

    it('uses userId from JWT payload, not a query param', async () => {
      service.getProgress.mockResolvedValue(mockProgress as any);
      const otherUser = { userId: 'student-99', email: 'x@test.com', role: 'student' };
      await controller.getProgress(otherUser as any);
      expect(service.getProgress).toHaveBeenCalledWith('student-99');
    });
  });

  describe('getWeakTopics', () => {
    it('returns weak topics wrapped in data envelope', async () => {
      service.getWeakTopics.mockResolvedValue(mockWeakTopics as any);
      const result = await controller.getWeakTopics(jwtPayload as any);
      expect(result).toEqual({ data: mockWeakTopics });
      expect(service.getWeakTopics).toHaveBeenCalledWith('student-1');
    });

    it('returns empty array when no weak topics', async () => {
      service.getWeakTopics.mockResolvedValue([] as any);
      const result = await controller.getWeakTopics(jwtPayload as any);
      expect(result).toEqual({ data: [] });
    });

    it('uses userId from JWT payload for isolation', async () => {
      service.getWeakTopics.mockResolvedValue([] as any);
      const anotherUser = { userId: 'student-42', email: 'y@test.com', role: 'student' };
      await controller.getWeakTopics(anotherUser as any);
      expect(service.getWeakTopics).toHaveBeenCalledWith('student-42');
    });
  });
});
