/**
 * Turns a pedagogical decision + the concept evidence behind it into a
 * structured quiz blueprint — the contract between the decision layer and
 * LLM generation. Pure, persisted alongside the decision for explainability.
 */

import { ConceptSnapshot, PolicyDecision } from './pedagogical-policy';
import { DecisionTrigger } from './schemas/pedagogical-decision.schema';

export interface QuizBlueprint {
  purpose: 'PROBE_MISCONCEPTION' | 'REBUILD_WEAK_CONCEPT' | 'VERIFY_PRACTICE' | 'ADVANCE_MASTERY';
  targetConceptDistribution: Record<string, number>;
  conceptsToReduce: string[];
  misconceptionsToProbe: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  reasonCodes: string[];
}

const PURPOSE_BY_TRIGGER: Record<DecisionTrigger, QuizBlueprint['purpose']> = {
  [DecisionTrigger.MISCONCEPTION]: 'PROBE_MISCONCEPTION',
  [DecisionTrigger.WEAK_CONCEPT]: 'REBUILD_WEAK_CONCEPT',
  [DecisionTrigger.PRACTICE]: 'VERIFY_PRACTICE',
  [DecisionTrigger.ADVANCE]: 'ADVANCE_MASTERY',
};

const STRONG_MASTERY = 80;
const WEAK_MASTERY = 50;
const DEFAULT_QUESTION_COUNT = 5;

export function buildQuizBlueprint(decision: PolicyDecision, touched: ConceptSnapshot[]): QuizBlueprint {
  const others = touched.filter((c) => c.conceptId !== decision.conceptId);
  const supporting = others.filter((c) => c.mastery < STRONG_MASTERY);
  const strong = others.filter((c) => c.mastery >= STRONG_MASTERY);

  // Focus concept gets half the quiz; remaining weight spreads across other
  // not-yet-strong concepts so the quiz stays coherent rather than single-note.
  const distribution: Record<string, number> = { [decision.conceptId]: supporting.length ? 0.5 : 1 };
  if (supporting.length) {
    const share = 0.5 / supporting.length;
    for (const concept of supporting) {
      distribution[concept.conceptId] = Math.round(share * 100) / 100;
    }
  }

  const reasonCodes: string[] = [];
  if (decision.trigger === DecisionTrigger.MISCONCEPTION) reasonCodes.push('MISCONCEPTION_DETECTED');
  if (decision.trigger === DecisionTrigger.WEAK_CONCEPT) reasonCodes.push('LOW_MASTERY_LOW_CONFIDENCE');
  if (decision.trigger === DecisionTrigger.PRACTICE) reasonCodes.push('MID_BAND_MASTERY');
  if (decision.trigger === DecisionTrigger.ADVANCE) reasonCodes.push('ALL_CONCEPTS_STRONG');
  if (touched.some((c) => c.integritySuspect)) reasonCodes.push('UNVERIFIED_EVIDENCE');
  if (touched.some((c) => c.mastery < WEAK_MASTERY && c.conceptId !== decision.conceptId)) {
    reasonCodes.push('ADDITIONAL_WEAK_CONCEPTS');
  }

  return {
    purpose: PURPOSE_BY_TRIGGER[decision.trigger],
    targetConceptDistribution: distribution,
    conceptsToReduce: strong.map((c) => c.conceptId),
    misconceptionsToProbe:
      decision.trigger === DecisionTrigger.MISCONCEPTION ? [decision.conceptId] : [],
    difficulty: decision.difficulty,
    questionCount: DEFAULT_QUESTION_COUNT,
    reasonCodes,
  };
}
