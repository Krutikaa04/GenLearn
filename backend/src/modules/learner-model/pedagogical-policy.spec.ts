import { decideNextActivity, ConceptSnapshot } from './pedagogical-policy';
import { DecisionAction, DecisionTrigger } from './schemas/pedagogical-decision.schema';

function concept(overrides: Partial<ConceptSnapshot> = {}): ConceptSnapshot {
  return {
    conceptId: 'recursion',
    topic: 'Recursion',
    mastery: 60,
    confidence: 0.6,
    hasRecentMisconception: false,
    ...overrides,
  };
}

describe('decideNextActivity', () => {
  it('returns null for no touched concepts', () => {
    expect(decideNextActivity([])).toBeNull();
  });

  it('prioritizes misconceptions above everything, recommending a lesson', () => {
    const decision = decideNextActivity([
      concept({ conceptId: 'weak', mastery: 20, confidence: 0.2 }),
      concept({ conceptId: 'confused', mastery: 65, hasRecentMisconception: true }),
    ]);

    expect(decision).toMatchObject({
      conceptId: 'confused',
      trigger: DecisionTrigger.MISCONCEPTION,
      action: DecisionAction.LESSON,
      difficulty: 'intermediate',
    });
  });

  it('uses beginner difficulty for a misconception on a weak concept', () => {
    const decision = decideNextActivity([concept({ mastery: 30, hasRecentMisconception: true })]);

    expect(decision!.difficulty).toBe('beginner');
  });

  it('recommends a beginner scaffolding quiz for weak low-confidence concepts', () => {
    const decision = decideNextActivity([
      concept({ conceptId: 'strong', mastery: 85, confidence: 0.9 }),
      concept({ conceptId: 'weak', mastery: 30, confidence: 0.3 }),
    ]);

    expect(decision).toMatchObject({
      conceptId: 'weak',
      trigger: DecisionTrigger.WEAK_CONCEPT,
      action: DecisionAction.QUIZ,
      difficulty: 'beginner',
    });
  });

  it('recommends intermediate practice for mid-band concepts', () => {
    const decision = decideNextActivity([concept({ mastery: 65, confidence: 0.7 })]);

    expect(decision).toMatchObject({
      trigger: DecisionTrigger.PRACTICE,
      action: DecisionAction.QUIZ,
      difficulty: 'intermediate',
    });
  });

  it('advances difficulty only when everything is strong AND stable', () => {
    const advance = decideNextActivity([
      concept({ conceptId: 'a', mastery: 85, confidence: 0.8 }),
      concept({ conceptId: 'b', mastery: 92, confidence: 0.9 }),
    ]);
    expect(advance).toMatchObject({
      conceptId: 'a', // weakest of the strong
      trigger: DecisionTrigger.ADVANCE,
      difficulty: 'advanced',
    });

    // Strong mastery but thin evidence → no push yet
    const thin = decideNextActivity([concept({ mastery: 90, confidence: 0.3 })]);
    expect(thin).toBeNull();
  });

  it('never advances difficulty on integrity-suspect evidence — verifies with same-level practice instead', () => {
    const decision = decideNextActivity([
      concept({ conceptId: 'a', mastery: 85, confidence: 0.8 }),
      concept({ conceptId: 'b', mastery: 92, confidence: 0.9, integritySuspect: true }),
    ]);

    expect(decision).toMatchObject({
      conceptId: 'b',
      trigger: DecisionTrigger.PRACTICE,
      action: DecisionAction.QUIZ,
      difficulty: 'intermediate',
    });
  });
});
