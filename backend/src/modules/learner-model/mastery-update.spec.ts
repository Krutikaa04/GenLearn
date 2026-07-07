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
