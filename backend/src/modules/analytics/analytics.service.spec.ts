import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: {
    findByStudentId: jest.Mock;
    updateAfterQuiz: jest.Mock;
    incrementCounter: jest.Mock;
    incrementXp: jest.Mock;
    addBadges: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findByStudentId: jest.fn(),
      updateAfterQuiz: jest.fn().mockResolvedValue({ currentStreak: 1, longestStreak: 1 }),
      incrementCounter: jest.fn(),
      incrementXp: jest.fn().mockResolvedValue({ xpTotal: 10, badges: [], topicMastery: [] }),
      addBadges: jest.fn(),
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
        xpTotal: 0,
        level: 1,
        xpToNextLevel: 100,
        badges: [],
      });
    });

    it('sorts topicMastery descending by masteryScore (strongest first)', async () => {
      repository.findByStudentId.mockResolvedValue({
        studentId: 'student-1',
        totalQuizzesTaken: 5,
        totalDocumentsUploaded: 1,
        totalLessonsGenerated: 1,
        totalFlashcardSetsCreated: 1,
        totalFlashcardsReviewed: 0,
        currentStreak: 2,
        longestStreak: 4,
        overallMasteryScore: 50,
        lastActiveDate: new Date('2026-06-30'),
        xpTotal: 0,
        badges: [],
        topicMastery: [
          { topic: 'Graphs', masteryScore: 10, averageScore: 10, quizzesTaken: 1, lastAttemptAt: null },
          { topic: 'Recursion', masteryScore: 80, averageScore: 80, quizzesTaken: 3, lastAttemptAt: null },
        ],
      });

      const result = await service.getProgress('student-1');

      expect(result.topicMastery.map((t) => t.topic)).toEqual(['Recursion', 'Graphs']);
    });

    it('derives level/xpToNextLevel from xpTotal and joins badge metadata', async () => {
      repository.findByStudentId.mockResolvedValue({
        studentId: 'student-1',
        totalQuizzesTaken: 1,
        totalDocumentsUploaded: 0,
        totalLessonsGenerated: 0,
        totalFlashcardSetsCreated: 0,
        totalFlashcardsReviewed: 0,
        currentStreak: 1,
        longestStreak: 1,
        overallMasteryScore: 0,
        lastActiveDate: null,
        xpTotal: 100,
        badges: [{ badgeId: 'first-quiz', earnedAt: new Date('2026-07-01') }],
        topicMastery: [],
      });

      const result = await service.getProgress('student-1');

      expect(result.level).toBe(2);
      expect(result.badges).toEqual([
        { badgeId: 'first-quiz', earnedAt: new Date('2026-07-01'), name: 'First Steps', description: 'Complete your first quiz', icon: 'Footprints' },
      ]);
    });
  });

  describe('getBadgeCatalog', () => {
    it('returns the full static catalog without predicate functions', () => {
      const result = service.getBadgeCatalog();

      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: expect.any(String), name: expect.any(String), description: expect.any(String), icon: expect.any(String) }),
      );
      expect((result[0] as any).check).toBeUndefined();
    });
  });

  describe('awardXp', () => {
    it('increments XP and returns no new badges when none newly qualify', async () => {
      repository.incrementXp.mockResolvedValue({ xpTotal: 10, badges: [], topicMastery: [] });

      const result = await service.awardXp('student-1', 10, 'flashcard_review');

      expect(repository.incrementXp).toHaveBeenCalledWith('student-1', 10);
      expect(result).toEqual({ xpTotal: 10, newBadges: [] });
      expect(repository.addBadges).not.toHaveBeenCalled();
    });

    it('awards a badge exactly once when its predicate newly passes', async () => {
      repository.incrementXp.mockResolvedValue({
        xpTotal: 20,
        badges: [],
        totalQuizzesTaken: 1,
        totalFlashcardsReviewed: 0,
        currentStreak: 0,
        overallMasteryScore: 0,
        topicMastery: [],
      });

      const result = await service.awardXp('student-1', 20, 'quiz_submitted');

      expect(result.newBadges).toEqual([{ badgeId: 'first-quiz', earnedAt: expect.any(Date) }]);
      expect(repository.addBadges).toHaveBeenCalledWith('student-1', [{ badgeId: 'first-quiz', earnedAt: expect.any(Date) }]);
    });

    it('does not re-award a badge the student already has', async () => {
      repository.incrementXp.mockResolvedValue({
        xpTotal: 20,
        badges: [{ badgeId: 'first-quiz', earnedAt: new Date() }],
        totalQuizzesTaken: 2,
        totalFlashcardsReviewed: 0,
        currentStreak: 0,
        overallMasteryScore: 0,
        topicMastery: [],
      });

      const result = await service.awardXp('student-1', 20, 'quiz_submitted');

      expect(result.newBadges).toEqual([]);
      expect(repository.addBadges).not.toHaveBeenCalled();
    });
  });

  describe('recordQuizResult', () => {
    it('delegates to analyticsRepository.updateAfterQuiz with the correct arguments', async () => {
      await service.recordQuizResult('student-1', 'Recursion', 75);

      expect(repository.updateAfterQuiz).toHaveBeenCalledWith('student-1', 'Recursion', 75);
    });

    it('awards base + high-score bonus XP for a strong score', async () => {
      repository.updateAfterQuiz.mockResolvedValue({ currentStreak: 1, longestStreak: 1 });

      await service.recordQuizResult('student-1', 'Recursion', 90);

      expect(repository.incrementXp).toHaveBeenCalledWith('student-1', 20 + 15);
    });

    it('awards only base XP for a low score', async () => {
      repository.updateAfterQuiz.mockResolvedValue({ currentStreak: 1, longestStreak: 1 });

      await service.recordQuizResult('student-1', 'Recursion', 50);

      expect(repository.incrementXp).toHaveBeenCalledWith('student-1', 20);
    });

    it('adds the 7-day streak milestone bonus exactly when the streak just hit 7', async () => {
      repository.updateAfterQuiz.mockResolvedValue({ currentStreak: 7, longestStreak: 7 });

      await service.recordQuizResult('student-1', 'Recursion', 50);

      expect(repository.incrementXp).toHaveBeenCalledWith('student-1', 20 + 50);
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

      await service.recordActivity('student-1', 'flashcard_review');
      expect(repository.incrementCounter).toHaveBeenCalledWith('student-1', 'totalFlashcardsReviewed');
    });

    it('awards the flat XP reward for the activity type', async () => {
      await service.recordActivity('student-1', 'lesson');

      expect(repository.incrementXp).toHaveBeenCalledWith('student-1', 15);
    });
  });
});
