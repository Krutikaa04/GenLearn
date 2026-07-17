import {
  forecastRevision,
  predictFutureLearning,
  generateInsights,
  buildCoachSummary,
  buildWeeklySummary,
  ConceptSignal,
} from './learning-prediction';

const NOW = new Date('2026-07-16T00:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

const concepts: ConceptSignal[] = [
  { conceptId: 'recursion-base-case', topic: 'Recursion', mastery: 35, confidence: 0.4, evidenceCount: 6, trend: 'declining', lastPracticedAt: daysAgo(2), reviewPriority: 70 },
  { conceptId: 'recursion', topic: 'Recursion', mastery: 65, confidence: 0.6, evidenceCount: 5, trend: 'improving', lastPracticedAt: daysAgo(10), reviewPriority: 40 },
  { conceptId: 'tail-recursion', topic: 'Recursion', mastery: 88, confidence: 0.8, evidenceCount: 7, trend: 'stable', lastPracticedAt: daysAgo(1), reviewPriority: 10 },
];

describe('learning-prediction', () => {
  describe('forecastRevision', () => {
    it('classifies urgency by priority, trend and recency', () => {
      const f = forecastRevision(concepts, NOW);
      expect(f.immediate.map((r) => r.conceptId)).toContain('recursion-base-case');
      expect(f.soon.map((r) => r.conceptId)).toContain('recursion'); // stale + not mastered
      expect(f.safe.map((r) => r.conceptId)).toContain('tail-recursion');
    });
  });

  describe('predictFutureLearning', () => {
    it('derives readiness, next concept, and a concrete milestone', () => {
      const p = predictFutureLearning(concepts, NOW);
      expect(p.readyToAdvance).toContain('tail-recursion');
      expect(p.likelyToMaster).toContain('recursion'); // improving, mid-band
      // Already-weak concepts are "needs revision", not "forgetting"; a solid-
      // but-slipping concept is what qualifies as likely-to-forget.
      expect(p.likelyToForget).not.toContain('recursion-base-case');
      const withSlipping = [...concepts, { conceptId: 'linked-list', topic: 'Lists', mastery: 72, confidence: 0.6, evidenceCount: 5, trend: 'declining' as const, lastPracticedAt: daysAgo(5), reviewPriority: 30 }];
      expect(predictFutureLearning(withSlipping, NOW).likelyToForget).toContain('linked-list');
      expect(p.nextConcept?.conceptId).toBe('recursion-base-case'); // weakest with evidence
      expect(p.nextMilestone).toMatch(/recursion base case/);
    });

    it('handles a learner with no concepts', () => {
      const p = predictFutureLearning([], NOW);
      expect(p.nextConcept).toBeNull();
      expect(p.nextMilestone).toContain('diagnostic');
    });
  });

  describe('generateInsights', () => {
    it('only emits evidence-backed insights', () => {
      const insights = generateInsights({ concepts, preferredIntervention: 'flashcards', supportScore: 0.2 });
      expect(insights.join(' ')).toContain('Recursion mastery has been improving');
      expect(insights.join(' ')).toContain('Recursion base case confidence is declining');
      expect(insights.join(' ')).toContain('flashcard review');
    });

    it('returns nothing when there is no signal', () => {
      const flat: ConceptSignal[] = [{ conceptId: 'x', mastery: 60, confidence: 0.5, evidenceCount: 3, trend: 'stable', lastPracticedAt: NOW, reviewPriority: 10 }];
      expect(generateInsights({ concepts: flat })).toEqual([]);
    });
  });

  describe('buildCoachSummary', () => {
    it('produces one concise line per coaching slot', () => {
      const revision = forecastRevision(concepts, NOW);
      const prediction = predictFutureLearning(concepts, NOW);
      const coach = buildCoachSummary(concepts, revision, prediction);
      expect(coach.todaysFocus).toContain('recursion base case');
      expect(coach.biggestImprovement).toContain('Recursion');
      expect(coach.currentWeakness).toContain('Recursion base case');
      expect(coach.nextMilestone).toBe(prediction.nextMilestone);
      expect(coach.revisionReminder).toMatch(/due for revision/);
    });
  });

  describe('buildWeeklySummary', () => {
    it('aggregates the last 7 days of timeline activity', () => {
      const events = [
        { type: 'adaptive_quiz', conceptIds: ['recursion-base-case'], occurredAt: daysAgo(1), data: {} },
        { type: 'concept_improved', conceptIds: ['recursion'], occurredAt: daysAgo(2), data: { before: 55, after: 65 } },
        { type: 'lesson_completed', conceptIds: [], occurredAt: daysAgo(3), data: {} },
        { type: 'adaptive_quiz', conceptIds: [], occurredAt: daysAgo(30), data: {} }, // outside window
      ];
      const revision = forecastRevision(concepts, NOW);
      const w = buildWeeklySummary(events, concepts, revision, NOW);
      expect(w.quizzesTaken).toBe(1);
      expect(w.lessonsCompleted).toBe(1);
      expect(w.conceptsImproved).toContain('recursion');
      expect(w.strongestImprovement).toEqual({ conceptId: 'recursion', delta: 10 });
      expect(w.recommendedFocus).toBe('recursion-base-case');
    });
  });
});
