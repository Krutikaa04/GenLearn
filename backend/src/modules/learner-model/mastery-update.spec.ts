import { confidenceForEvidenceCount, topicToConceptId, updateConceptEvidence } from './mastery-update';

const fresh = { mastery: 50, confidence: 0.5, evidenceCount: 5 };
const calmBehavior = { answerChanges: 0, timeToFirstAnswerMs: 8_000, idleMs: 0 };

describe('updateConceptEvidence', () => {
  it('raises mastery by the full step for a calm correct answer on the primary concept', () => {
    const result = updateConceptEvidence(fresh, { correct: true, isPrimary: true, behavior: calmBehavior });

    expect(result.mastery).toBe(58);
    expect(result.evidenceCount).toBe(6);
    expect(result.misconception).toBe(false);
  });

  it('lowers mastery for a wrong answer', () => {
    const result = updateConceptEvidence(fresh, { correct: false, isPrimary: true, behavior: calmBehavior });

    expect(result.mastery).toBe(44);
    expect(result.misconception).toBe(false);
  });

  it('halves the gain when the correct answer came after heavy switching', () => {
    const result = updateConceptEvidence(fresh, {
      correct: true,
      isPrimary: true,
      behavior: { answerChanges: 2, timeToFirstAnswerMs: 8_000, idleMs: 0 },
    });

    expect(result.mastery).toBe(54);
  });

  it('halves the gain for a snap correct answer (guessing suspicion)', () => {
    const result = updateConceptEvidence(fresh, {
      correct: true,
      isPrimary: true,
      behavior: { answerChanges: 0, timeToFirstAnswerMs: 900, idleMs: 0 },
    });

    expect(result.mastery).toBe(54);
  });

  it('flags a misconception for a fast confident wrong answer', () => {
    const result = updateConceptEvidence(fresh, {
      correct: false,
      isPrimary: true,
      behavior: { answerChanges: 0, timeToFirstAnswerMs: 1_200, idleMs: 0 },
    });

    expect(result.misconception).toBe(true);
    expect(result.mastery).toBe(44);
  });

  it('does not flag a misconception when the fast wrong answer followed switching', () => {
    const result = updateConceptEvidence(fresh, {
      correct: false,
      isPrimary: true,
      behavior: { answerChanges: 3, timeToFirstAnswerMs: 1_200, idleMs: 0 },
    });

    expect(result.misconception).toBe(false);
  });

  it('applies half steps to secondary concepts', () => {
    const result = updateConceptEvidence(fresh, { correct: true, isPrimary: false, behavior: calmBehavior });

    expect(result.mastery).toBe(54);
  });

  it('works without behavior data (telemetry disabled) using full steps', () => {
    const result = updateConceptEvidence(fresh, { correct: true, isPrimary: true, behavior: null });

    expect(result.mastery).toBe(58);
    expect(result.misconception).toBe(false);
  });

  it('clamps mastery to the 0-100 range', () => {
    expect(updateConceptEvidence({ ...fresh, mastery: 98 }, { correct: true, isPrimary: true, behavior: calmBehavior }).mastery).toBe(100);
    expect(updateConceptEvidence({ ...fresh, mastery: 3 }, { correct: false, isPrimary: true, behavior: calmBehavior }).mastery).toBe(0);
  });

  describe('expected-time awareness', () => {
    it('treats a fast answer as a snap relative to a generous expected time', () => {
      // 8s is calm against the fixed 2s floor, but a snap for a 90s question
      const result = updateConceptEvidence(fresh, {
        correct: true,
        isPrimary: true,
        behavior: { answerChanges: 0, timeToFirstAnswerMs: 8_000, idleMs: 0 },
        expectedTimeMs: 90_000,
      });

      expect(result.mastery).toBe(54); // half gain
    });

    it('halves the gain when the answer took far longer than expected (struggle)', () => {
      const result = updateConceptEvidence(fresh, {
        correct: true,
        isPrimary: true,
        behavior: { answerChanges: 0, timeToFirstAnswerMs: 70_000, idleMs: 0 },
        expectedTimeMs: 30_000,
      });

      expect(result.mastery).toBe(54);
    });

    it('gives the full gain when the answer lands inside the expected window', () => {
      const result = updateConceptEvidence(fresh, {
        correct: true,
        isPrimary: true,
        behavior: { answerChanges: 0, timeToFirstAnswerMs: 40_000, idleMs: 0 },
        expectedTimeMs: 60_000,
      });

      expect(result.mastery).toBe(58);
    });
  });

  describe('tab-switch integrity', () => {
    it('heavily discounts a correct answer that followed a tab-away and flags it', () => {
      const result = updateConceptEvidence(fresh, {
        correct: true,
        isPrimary: true,
        behavior: { answerChanges: 0, timeToFirstAnswerMs: 8_000, idleMs: 0, answeredAfterTabSwitch: true },
      });

      expect(result.mastery).toBe(52); // 8 * 0.25 = 2
      expect(result.integritySuspect).toBe(true);
    });

    it('does not raise a misconception for a fast wrong answer after a tab-away', () => {
      const result = updateConceptEvidence(fresh, {
        correct: false,
        isPrimary: true,
        behavior: { answerChanges: 0, timeToFirstAnswerMs: 1_000, idleMs: 0, answeredAfterTabSwitch: true },
      });

      expect(result.misconception).toBe(false);
      expect(result.integritySuspect).toBe(false);
      expect(result.mastery).toBe(44);
    });

    it('leaves normal answers unflagged', () => {
      const result = updateConceptEvidence(fresh, { correct: true, isPrimary: true, behavior: calmBehavior });

      expect(result.integritySuspect).toBe(false);
    });
  });
});

describe('confidenceForEvidenceCount', () => {
  it('starts at zero, grows with evidence, and saturates below 1', () => {
    expect(confidenceForEvidenceCount(0)).toBe(0);
    expect(confidenceForEvidenceCount(4)).toBeGreaterThan(0.6);
    expect(confidenceForEvidenceCount(20)).toBeGreaterThan(0.99);
    expect(confidenceForEvidenceCount(20)).toBeLessThanOrEqual(1);
  });
});

describe('topicToConceptId', () => {
  it('slugifies topic strings into provisional concept ids', () => {
    expect(topicToConceptId('Binary Search Trees')).toBe('binary-search-trees');
    expect(topicToConceptId("Newton's Laws!")).toBe('newton-s-laws');
  });

  it('falls back to "general" for empty or missing topics', () => {
    expect(topicToConceptId(null)).toBe('general');
    expect(topicToConceptId('   ')).toBe('general');
  });
});
