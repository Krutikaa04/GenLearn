import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: { findByStudentId: jest.Mock; updateAfterQuiz: jest.Mock; incrementCounter: jest.Mock };

  beforeEach(() => {
    repository = {
      findByStudentId: jest.fn(),
      updateAfterQuiz: jest.fn(),
      incrementCounter: jest.fn(),
    };
    service = new AnalyticsService(repository as any);
  });

  describe('getWeakTopics', () => {
    it('returns an empty array when the student has no progress record yet', async () => {
      repository.findByStudentId.mockResolvedValue(null);

      const result = await service.getWeakTopics('student-1');

      expect(result).toEqual([]);
    });

    it('filters out topics with masteryScore >= 60', async () => {
      repository.findByStudentId.mockResolvedValue({
        topicMastery: [
          { topic: 'Recursion', masteryScore: 80, averageScore: 80, quizzesTaken: 3 },
          { topic: 'Graphs', masteryScore: 10, averageScore: 10, quizzesTaken: 1 },
          { topic: 'Trees', masteryScore: 59, averageScore: 59, quizzesTaken: 2 },
          { topic: 'Pointers', masteryScore: 60, averageScore: 60, quizzesTaken: 4 },
        ],
      });

      const result = await service.getWeakTopics('student-1');

      expect(result.map((t) => t.topic)).toEqual(['Graphs', 'Trees']);
    });

    it('sorts weak topics ascending by masteryScore (weakest first)', async () => {
      repository.findByStudentId.mockResolvedValue({
        topicMastery: [
          { topic: 'Trees', masteryScore: 45, averageScore: 45, quizzesTaken: 2 },
          { topic: 'Graphs', masteryScore: 10, averageScore: 10, quizzesTaken: 1 },
          { topic: 'DP', masteryScore: 30, averageScore: 30, quizzesTaken: 1 },
        ],
      });

      const result = await service.getWeakTopics('student-1');

      expect(result.map((t) => t.topic)).toEqual(['Graphs', 'DP', 'Trees']);
    });
  });

  describe('getProgress', () => {
    it('returns zeroed-out defaults for a brand-new student', async () => {
      repository.findByStudentId.mockResolvedValue(null);

      const result = await service.getProgress('student-1');

      expect(result).toMatchObject({
        studentId: 'student-1',
        totalQuizzesTaken: 0,
        topicMastery: [],
        lastActiveDate: null,
      });
    });

    it('sorts topicMastery descending by masteryScore (strongest first)', async () => {
      repository.findByStudentId.mockResolvedValue({
        studentId: 'student-1',
        totalQuizzesTaken: 5,
        totalDocumentsUploaded: 1,
        totalLessonsGenerated: 1,
        totalFlashcardSetsCreated: 1,
        currentStreak: 2,
        longestStreak: 4,
        overallMasteryScore: 50,
        lastActiveDate: new Date('2026-06-30'),
        topicMastery: [
          { topic: 'Graphs', masteryScore: 10, averageScore: 10, quizzesTaken: 1, lastAttemptAt: null },
          { topic: 'Recursion', masteryScore: 80, averageScore: 80, quizzesTaken: 3, lastAttemptAt: null },
        ],
      });

      const result = await service.getProgress('student-1');

      expect(result.topicMastery.map((t) => t.topic)).toEqual(['Recursion', 'Graphs']);
    });
  });

  describe('recordActivity', () => {
    it('maps activity types to the correct analytics counter field', async () => {
      await service.recordActivity('student-1', 'document');
      expect(repository.incrementCounter).toHaveBeenCalledWith('student-1', 'totalDocumentsUploaded');

      await service.recordActivity('student-1', 'lesson');
      expect(repository.incrementCounter).toHaveBeenCalledWith('student-1', 'totalLessonsGenerated');

      await service.recordActivity('student-1', 'flashcard');
      expect(repository.incrementCounter).toHaveBeenCalledWith('student-1', 'totalFlashcardSetsCreated');
    });
  });
});
