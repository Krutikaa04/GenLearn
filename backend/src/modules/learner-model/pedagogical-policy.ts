/**
 * Deterministic pedagogical policy: given the concepts a quiz just touched,
 * decide the single most valuable next activity. Rules run in strict
 * priority order — the LLM is never in the decision loop. Pure, no I/O.
 */

import { DecisionAction, DecisionTrigger } from './schemas/pedagogical-decision.schema';

export interface ConceptSnapshot {
  conceptId: string;
  topic: string;
  mastery: number;
  confidence: number;
  hasRecentMisconception: boolean;
}

export interface PolicyDecision {
  conceptId: string;
  topic: string;
  trigger: DecisionTrigger;
  action: DecisionAction;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  masteryBefore: number;
}

const WEAK_MASTERY = 50;
const STRONG_MASTERY = 80;
const LOW_CONFIDENCE = 0.5;
const STABLE_CONFIDENCE = 0.6;

export function decideNextActivity(touched: ConceptSnapshot[]): PolicyDecision | null {
  if (touched.length === 0) return null;
  const byMasteryAsc = [...touched].sort((a, b) => a.mastery - b.mastery);

  // 1. Misconceptions first: the student is confidently wrong — explain, don't drill.
  const misconception = byMasteryAsc.find((c) => c.hasRecentMisconception);
  if (misconception) {
    return {
      conceptId: misconception.conceptId,
      topic: misconception.topic,
      trigger: DecisionTrigger.MISCONCEPTION,
      action: DecisionAction.LESSON,
      difficulty: misconception.mastery < WEAK_MASTERY ? 'beginner' : 'intermediate',
      masteryBefore: misconception.mastery,
    };
  }

  // 2. Weak and uncertain: scaffold with an easier quiz to build evidence.
  const weak = byMasteryAsc.find((c) => c.mastery < WEAK_MASTERY && c.confidence < LOW_CONFIDENCE);
  if (weak) {
    return {
      conceptId: weak.conceptId,
      topic: weak.topic,
      trigger: DecisionTrigger.WEAK_CONCEPT,
      action: DecisionAction.QUIZ,
      difficulty: 'beginner',
      masteryBefore: weak.mastery,
    };
  }

  // 3. Mid-band: targeted practice at working difficulty.
  const midBand = byMasteryAsc.find((c) => c.mastery >= WEAK_MASTERY && c.mastery < STRONG_MASTERY);
  if (midBand) {
    return {
      conceptId: midBand.conceptId,
      topic: midBand.topic,
      trigger: DecisionTrigger.PRACTICE,
      action: DecisionAction.QUIZ,
      difficulty: 'intermediate',
      masteryBefore: midBand.mastery,
    };
  }

  // 4. Everything strong with stable confidence: level up on the weakest.
  const allStrong = byMasteryAsc.every((c) => c.mastery >= STRONG_MASTERY);
  const allStable = byMasteryAsc.every((c) => c.confidence >= STABLE_CONFIDENCE);
  if (allStrong && allStable) {
    const weakest = byMasteryAsc[0];
    return {
      conceptId: weakest.conceptId,
      topic: weakest.topic,
      trigger: DecisionTrigger.ADVANCE,
      action: DecisionAction.QUIZ,
      difficulty: 'advanced',
      masteryBefore: weakest.mastery,
    };
  }

  // Strong mastery but thin evidence — let normal usage accumulate more before pushing.
  return null;
}
