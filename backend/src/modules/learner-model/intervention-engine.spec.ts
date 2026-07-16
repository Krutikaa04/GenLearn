import { buildExplanation, InterventionEvidence, selectIntervention } from './intervention-engine';

const base: InterventionEvidence = {
  conceptId: 'recursion-base-case',
  topic: 'Recursion',
  trigger: 'weak_concept',
  defaultAction: 'quiz',
  mastery: 40,
  confidence: 0.4,
  evidenceCount: 5,
  trend: 'stable',
  effectiveness: {},
  supportScore: 0.1,
};

describe('intervention-engine', () => {
  describe('selectIntervention', () => {
    it('re-teaches misconceptions with a worked example', () => {
      const s = selectIntervention({ ...base, trigger: 'misconception' });
      expect(s.type).toBe('worked_example');
      expect(s.reasonCodes).toContain('misconception_reteach');
    });

    it('steps back to concept review when weak and declining', () => {
      const s = selectIntervention({ ...base, trend: 'declining' });
      expect(s.type).toBe('concept_review');
    });

    it('uses the policy default for a plain weak concept', () => {
      expect(selectIntervention(base).type).toBe('quiz');
      expect(selectIntervention({ ...base, defaultAction: 'lesson' }).type).toBe('lesson');
    });

    it('chooses revision when a practiced concept is slipping', () => {
      const s = selectIntervention({ ...base, trigger: 'practice', trend: 'declining', mastery: 60 });
      expect(s.type).toBe('revision');
    });

    it('routes high-support struggling learners to the tutor', () => {
      const s = selectIntervention({ ...base, supportScore: 0.7, mastery: 35 });
      expect(s.type).toBe('tutor');
      expect(s.reasonCodes).toContain('high_support_needs_guidance');
    });

    it('prefers an intervention type with proven better effectiveness', () => {
      const s = selectIntervention({
        ...base,
        effectiveness: {
          quiz: { count: 3, avgMasteryDelta: 2 },
          flashcards: { count: 3, avgMasteryDelta: 9 },
        },
      });
      expect(s.type).toBe('flashcards');
      expect(s.reasonCodes).toContain('history_prefers_flashcards');
    });

    it('does not override on thin or marginal history', () => {
      const s = selectIntervention({
        ...base,
        effectiveness: { flashcards: { count: 1, avgMasteryDelta: 20 } }, // too few samples
      });
      expect(s.type).toBe('quiz');
    });
  });

  describe('buildExplanation', () => {
    it('grounds every section in supplied evidence', () => {
      const selected = selectIntervention(base);
      const x = buildExplanation(base, selected);
      expect(x.recommendation).toContain('recursion base case');
      expect(x.why.length).toBeGreaterThan(0);
      expect(x.evidence).toContain('Current mastery: 40%');
      expect(x.evidence).toContain('Based on 5 answered questions on this concept');
      expect(x.expectedOutcome).toMatch(/40% toward \d+%/);
    });

    it('grades confidence by evidence volume', () => {
      const sel = selectIntervention(base);
      expect(buildExplanation({ ...base, evidenceCount: 10, confidence: 0.7 }, sel).confidence).toBe('high');
      expect(buildExplanation({ ...base, evidenceCount: 4 }, sel).confidence).toBe('medium');
      expect(buildExplanation({ ...base, evidenceCount: 1 }, sel).confidence).toBe('low');
    });

    it('explains history-driven overrides to the learner', () => {
      const e = { ...base, effectiveness: { quiz: { count: 3, avgMasteryDelta: 1 }, tutor: { count: 2, avgMasteryDelta: 10 } } };
      const sel = selectIntervention(e);
      const x = buildExplanation(e, sel);
      expect(sel.type).toBe('tutor');
      expect(x.why.join(' ')).toContain('has improved your mastery more');
    });
  });
});
