import { composeLearningPlan, computeRevision, PlannerInput } from './autonomous-planner';
import { PlanStatus } from './schemas/learning-plan.schema';

const decision = {
  conceptId: 'recursion-base-case',
  topic: 'Recursion',
  trigger: 'weak_concept' as const,
  action: 'quiz' as const,
  difficulty: 'beginner',
  masteryBefore: 40,
  blueprint: { questionCount: 6, targetConceptDistribution: { 'recursion-base-case': 0.7, 'recursion': 0.3 } },
  reasonCodes: ['weak_concept', 'low_confidence'],
};

const concepts = [
  { conceptId: 'recursion-base-case', mastery: 40, confidence: 0.4 },
  { conceptId: 'recursion', mastery: 65, confidence: 0.6 },
  { conceptId: 'tail-recursion', mastery: 88, confidence: 0.8 },
  { conceptId: 'stack-depth', mastery: 25, confidence: 0.3 },
];

describe('autonomous-planner composer', () => {
  describe('computeRevision', () => {
    it('buckets concepts by mastery band', () => {
      const r = computeRevision(concepts);
      expect(r.revise).toEqual(expect.arrayContaining(['recursion-base-case', 'stack-depth']));
      expect(r.reinforce).toEqual(['recursion']);
      expect(r.advance).toEqual(['tail-recursion']);
      expect(r.prerequisites).toEqual(['stack-depth']);
    });
  });

  describe('composeLearningPlan', () => {
    it('builds a concrete active plan from a pending decision', () => {
      const plan = composeLearningPlan({ currentGoal: 'Ace DSA', decision, concepts });
      expect(plan.status).toBe(PlanStatus.ACTIVE);
      expect(plan.topic).toBe('Recursion');
      expect(plan.objective).toContain('recursion base case');
      expect(plan.objective).toMatch(/\d+%/); // measurable
      expect(plan.targetConcepts).toEqual(['recursion-base-case', 'recursion']);
      expect((plan.recommendedQuiz as any).needed).toBe(true);
      expect((plan.recommendedQuiz as any).difficulty).toBe('beginner');
      expect(plan.reasonCodes).toEqual(decision.reasonCodes);
      expect(plan.currentGoal).toBe('Ace DSA');
    });

    it('recommends a lesson first for a misconception', () => {
      const plan = composeLearningPlan({
        currentGoal: null,
        decision: { ...decision, trigger: 'misconception', action: 'lesson' },
        concepts,
      });
      expect((plan.recommendedLesson as any).needed).toBe(true);
      expect(plan.objective.toLowerCase()).toContain('misunderstanding');
    });

    it('falls back to practising the weakest concept when there is no decision', () => {
      const plan = composeLearningPlan({ currentGoal: null, decision: null, concepts });
      expect(plan.status).toBe(PlanStatus.ACTIVE);
      expect(plan.targetConcepts).toEqual(['stack-depth']); // lowest mastery
      expect(plan.reasonCodes).toContain('practice_weakest');
    });

    it('returns an awaiting-topic plan when the learner has no history', () => {
      const input: PlannerInput = { currentGoal: null, decision: null, concepts: [] };
      const plan = composeLearningPlan(input);
      expect(plan.status).toBe(PlanStatus.AWAITING_TOPIC);
      expect((plan.recommendedQuiz as any).needed).toBe(false);
      expect(plan.reasonCodes).toContain('awaiting_topic');
    });
  });
});
