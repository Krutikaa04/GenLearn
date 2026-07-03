import { BADGE_CATALOG, BadgeCheckableProgress } from './badges.catalog';

function baseProgress(overrides: Partial<BadgeCheckableProgress> = {}): BadgeCheckableProgress {
  return {
    totalQuizzesTaken: 0,
    totalFlashcardsReviewed: 0,
    currentStreak: 0,
    overallMasteryScore: 0,
    topicMastery: [],
    ...overrides,
  };
}

function check(id: string, progress: BadgeCheckableProgress): boolean {
  const badge = BADGE_CATALOG.find((b) => b.id === id);
  if (!badge) throw new Error(`Unknown badge id: ${id}`);
  return badge.check(progress);
}

describe('BADGE_CATALOG', () => {
  it('has between 5 and 8 badges', () => {
    expect(BADGE_CATALOG.length).toBeGreaterThanOrEqual(5);
    expect(BADGE_CATALOG.length).toBeLessThanOrEqual(8);
  });

  it('every badge has a unique id', () => {
    const ids = BADGE_CATALOG.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe('first-quiz', () => {
    it('is false with zero quizzes and true after one', () => {
      expect(check('first-quiz', baseProgress({ totalQuizzesTaken: 0 }))).toBe(false);
      expect(check('first-quiz', baseProgress({ totalQuizzesTaken: 1 }))).toBe(true);
    });
  });

  describe('streak-7 / streak-30', () => {
    it('trip at the correct streak thresholds', () => {
      expect(check('streak-7', baseProgress({ currentStreak: 6 }))).toBe(false);
      expect(check('streak-7', baseProgress({ currentStreak: 7 }))).toBe(true);
      expect(check('streak-30', baseProgress({ currentStreak: 29 }))).toBe(false);
      expect(check('streak-30', baseProgress({ currentStreak: 30 }))).toBe(true);
    });
  });

  describe('topic-master', () => {
    it('requires at least one topic at 80% mastery', () => {
      expect(check('topic-master', baseProgress({ topicMastery: [{ masteryScore: 79 }] }))).toBe(false);
      expect(check('topic-master', baseProgress({ topicMastery: [{ masteryScore: 60 }, { masteryScore: 80 }] }))).toBe(true);
    });
  });

  describe('flashcard-100', () => {
    it('trips at 100 reviewed flashcards', () => {
      expect(check('flashcard-100', baseProgress({ totalFlashcardsReviewed: 99 }))).toBe(false);
      expect(check('flashcard-100', baseProgress({ totalFlashcardsReviewed: 100 }))).toBe(true);
    });
  });

  describe('overall-mastery-70', () => {
    it('trips at 70% overall mastery', () => {
      expect(check('overall-mastery-70', baseProgress({ overallMasteryScore: 69 }))).toBe(false);
      expect(check('overall-mastery-70', baseProgress({ overallMasteryScore: 70 }))).toBe(true);
    });
  });
});
