import {
  computeConceptTrend,
  computeReviewPriority,
  summariseTrends,
  computeVelocity,
  computeSupportDependency,
  inferPreferences,
  foldInterventionOutcome,
  deriveLearningStage,
  deriveIdentity,
  ConceptState,
} from './learner-intelligence';
import { LearningStage } from './schemas/learner-profile.schema';

describe('learner-intelligence', () => {
  describe('computeConceptTrend', () => {
    it('classifies improvement, decline, and stability past the epsilon', () => {
      expect(computeConceptTrend(50, 60)).toBe('improving');
      expect(computeConceptTrend(60, 50)).toBe('declining');
      expect(computeConceptTrend(50, 51)).toBe('stable');
    });
  });

  describe('computeReviewPriority', () => {
    it('is higher for weak, low-confidence, stale concepts', () => {
      const now = new Date('2026-07-14T00:00:00Z');
      const strongFresh = computeReviewPriority(90, 0.9, now, now);
      const weakStale = computeReviewPriority(20, 0.2, new Date('2026-07-01T00:00:00Z'), now);
      expect(weakStale).toBeGreaterThan(strongFresh);
      expect(weakStale).toBeLessThanOrEqual(100);
      expect(strongFresh).toBeGreaterThanOrEqual(0);
    });
  });

  describe('summariseTrends', () => {
    it('bands concepts by trend and mastery', () => {
      const concepts: ConceptState[] = [
        { conceptId: 'a', mastery: 90, confidence: 0.8, evidenceCount: 6, trend: 'improving' },
        { conceptId: 'b', mastery: 30, confidence: 0.3, evidenceCount: 4, trend: 'declining' },
        { conceptId: 'c', mastery: 85, confidence: 0.7, evidenceCount: 5, trend: 'stable' },
      ];
      const t = summariseTrends(concepts);
      expect(t.improving).toEqual(['a']);
      expect(t.declining).toEqual(['b']);
      expect(t.mastered).toEqual(expect.arrayContaining(['a', 'c']));
      expect(t.needsReview).toEqual(['b']);
    });
  });

  describe('computeVelocity', () => {
    it('summarises breadth and efficiency, and handles the empty case', () => {
      expect(computeVelocity([])).toEqual({ conceptsTracked: 0, masteredCount: 0, avgMastery: 0, avgConfidence: 0, efficiency: 0 });
      const v = computeVelocity([
        { conceptId: 'a', mastery: 80, confidence: 0.8, evidenceCount: 5 },
        { conceptId: 'b', mastery: 40, confidence: 0.4, evidenceCount: 3 },
      ]);
      expect(v.conceptsTracked).toBe(2);
      expect(v.masteredCount).toBe(1);
      expect(v.avgMastery).toBe(60);
      expect(v.efficiency).toBe(0.5);
    });
  });

  describe('computeSupportDependency', () => {
    it('stays within 0-1 and rises with assistance', () => {
      const low = computeSupportDependency({ answerChanges: 0, tabSwitches: 0, tutorSessions: 0, flashcardSessions: 0, quizzes: 5 });
      const high = computeSupportDependency({ answerChanges: 30, tabSwitches: 10, tutorSessions: 8, flashcardSessions: 6, quizzes: 4 });
      expect(low.score).toBe(0);
      expect(high.score).toBeGreaterThan(low.score);
      expect(high.score).toBeLessThanOrEqual(1);
    });
  });

  describe('inferPreferences', () => {
    it('picks the intervention with the best measured delta', () => {
      const p = inferPreferences({
        lesson: { count: 3, avgMasteryDelta: 12 },
        flashcards: { count: 2, avgMasteryDelta: 3 },
        quiz: { count: 0, avgMasteryDelta: 0 },
      });
      expect(p.preferredIntervention).toBe('lesson');
      expect(p.ranked[0].type).toBe('lesson');
      expect(p.ranked.find((r) => r.type === 'quiz')).toBeUndefined();
    });
  });

  describe('foldInterventionOutcome', () => {
    it('maintains a running average', () => {
      const first = foldInterventionOutcome(undefined, 10);
      expect(first).toEqual({ count: 1, avgMasteryDelta: 10 });
      const second = foldInterventionOutcome(first, 20);
      expect(second).toEqual({ count: 2, avgMasteryDelta: 15 });
    });
  });

  describe('deriveLearningStage', () => {
    it('progresses with breadth and mastery', () => {
      expect(deriveLearningStage(1, 0)).toBe(LearningStage.ONBOARDING);
      expect(deriveLearningStage(5, 30)).toBe(LearningStage.BUILDING);
      expect(deriveLearningStage(5, 60)).toBe(LearningStage.CONSOLIDATING);
      expect(deriveLearningStage(5, 85)).toBe(LearningStage.ADVANCING);
    });
  });

  describe('deriveIdentity', () => {
    it('labels a steady improver', () => {
      const id = deriveIdentity(
        { conceptsTracked: 6, masteredCount: 3, avgMastery: 70, avgConfidence: 0.7, efficiency: 0.5 },
        { improving: ['a', 'b'], declining: [], mastered: ['a'], needsReview: [] },
        { lookupReliance: 0.1, tutorReliance: 0.1, revisionReliance: 0.1, score: 0.1 },
      );
      expect(id).toBe('steady-improver');
    });

    it('stays new-learner without enough evidence', () => {
      const id = deriveIdentity(
        { conceptsTracked: 1, masteredCount: 0, avgMastery: 10, avgConfidence: 0.2, efficiency: 0 },
        { improving: [], declining: [], mastered: [], needsReview: ['a'] },
        { lookupReliance: 0, tutorReliance: 0, revisionReliance: 0, score: 0 },
      );
      expect(id).toBe('new-learner');
    });
  });
});
