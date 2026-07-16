/**
 * Explainable Intelligence & Intervention Engine (EIIE) — pure rules, no I/O.
 *
 * The pedagogical policy already decides WHICH concept needs work and at what
 * difficulty; this engine decides HOW to work on it (which intervention type)
 * and WHY, in learner-friendly language backed only by real evidence. It is the
 * single place intervention selection and recommendation explanation live.
 * Deterministic and unit-testable; never invents reasons.
 */

export type InterventionType =
  | 'lesson'
  | 'quiz'
  | 'flashcards'
  | 'tutor'
  | 'revision'
  | 'worked_example'
  | 'concept_review';

export interface InterventionEvidence {
  conceptId: string;
  topic: string;
  trigger: 'misconception' | 'weak_concept' | 'practice' | 'advance' | string;
  /** The policy's default action (lesson | quiz). */
  defaultAction: string;
  mastery: number;
  confidence: number;
  evidenceCount: number;
  trend: 'new' | 'improving' | 'declining' | 'stable';
  /** Rolling per-type effectiveness from the persistent profile (Task 4 data). */
  effectiveness: Record<string, { count: number; avgMasteryDelta: number }>;
  /** Support dependency score 0-1 from the profile (personalisation only). */
  supportScore: number;
}

export interface SelectedIntervention {
  type: InterventionType;
  reasonCodes: string[];
}

export interface Explanation {
  recommendation: string;
  why: string[];
  evidence: string[];
  expectedOutcome: string;
  confidence: 'high' | 'medium' | 'low';
}

/** An intervention type must beat the default by this much to override it. */
const OVERRIDE_MARGIN = 3;
const MIN_SAMPLES_TO_TRUST = 2;

const humanize = (id: string) => id.replace(/-/g, ' ');

/**
 * Pick the most effective historically-proven intervention if one clearly
 * beats the rule-based default for this learner; otherwise keep the default.
 */
function preferProven(
  defaultType: InterventionType,
  effectiveness: InterventionEvidence['effectiveness'],
  reasonCodes: string[],
): InterventionType {
  const candidates = Object.entries(effectiveness ?? {})
    .filter(([, v]) => v.count >= MIN_SAMPLES_TO_TRUST)
    .sort((a, b) => b[1].avgMasteryDelta - a[1].avgMasteryDelta);
  if (!candidates.length) return defaultType;

  const [bestType, best] = candidates[0];
  const defaultStats = effectiveness[defaultType];
  const defaultDelta = defaultStats && defaultStats.count >= MIN_SAMPLES_TO_TRUST ? defaultStats.avgMasteryDelta : 0;

  if (bestType !== defaultType && best.avgMasteryDelta >= defaultDelta + OVERRIDE_MARGIN && best.avgMasteryDelta > 0) {
    reasonCodes.push(`history_prefers_${bestType}`);
    return bestType as InterventionType;
  }
  return defaultType;
}

/**
 * Single intervention decision (Tasks 2-3). Rules run in priority order; the
 * learner's own intervention history can override the default when it has
 * demonstrably worked better.
 */
export function selectIntervention(e: InterventionEvidence): SelectedIntervention {
  const reasonCodes: string[] = [];
  let type: InterventionType;

  if (e.trigger === 'misconception') {
    // Confidently wrong → re-teach, don't drill. Worked examples fix the
    // "believed they knew it" pattern better than more questions.
    type = 'worked_example';
    reasonCodes.push('misconception_reteach');
  } else if (e.trigger === 'weak_concept' && e.trend === 'declining') {
    // Weak AND getting worse → step back to a concept review before quizzing.
    type = 'concept_review';
    reasonCodes.push('weak_and_declining');
  } else if (e.trigger === 'weak_concept') {
    type = e.defaultAction === 'lesson' ? 'lesson' : 'quiz';
    reasonCodes.push('weak_scaffold');
  } else if (e.trigger === 'practice' && e.trend === 'declining' && e.mastery >= 50) {
    // Previously okay but slipping → spaced revision beats new material.
    type = 'revision';
    reasonCodes.push('slipping_needs_revision');
  } else if (e.trigger === 'advance') {
    type = 'quiz';
    reasonCodes.push('ready_to_advance');
  } else {
    type = 'quiz';
    reasonCodes.push('targeted_practice');
  }

  // High support dependency + struggling → a guided tutor session can unblock
  // where solo material hasn't.
  if (e.supportScore >= 0.6 && e.mastery < 50 && type !== 'worked_example') {
    type = 'tutor';
    reasonCodes.push('high_support_needs_guidance');
  }

  type = preferProven(type, e.effectiveness, reasonCodes);
  return { type, reasonCodes };
}

const INTERVENTION_LABELS: Record<InterventionType, string> = {
  lesson: 'a focused lesson',
  quiz: 'a targeted adaptive quiz',
  flashcards: 'a flashcard review session',
  tutor: 'a guided tutor session',
  revision: 'a spaced revision session',
  worked_example: 'a worked example walk-through',
  concept_review: 'a concept review',
};

/**
 * Learner-facing explanation (Tasks 1, 5). Every sentence maps to a concrete
 * piece of evidence passed in — nothing is invented, and implementation
 * details (model names, scores' internals) are never exposed.
 */
export function buildExplanation(e: InterventionEvidence, selected: SelectedIntervention): Explanation {
  const concept = humanize(e.conceptId);
  const why: string[] = [];
  const evidence: string[] = [];

  switch (e.trigger) {
    case 'misconception':
      why.push(`You answered questions on ${concept} quickly and confidently, but incorrectly — that pattern points to a misunderstanding rather than a slip.`);
      break;
    case 'weak_concept':
      why.push(`Your recent answers show ${concept} isn't solid yet, so building it up now prevents problems in dependent topics.`);
      break;
    case 'advance':
      why.push(`You've shown consistent, confident mastery of ${concept} — you're ready for harder material.`);
      break;
    default:
      why.push(`${concept} is partly learned; focused practice now is the fastest way to lock it in.`);
  }

  if (e.trend === 'declining') {
    why.push(`Your accuracy on ${concept} has been declining across recent sessions.`);
  } else if (e.trend === 'improving') {
    why.push(`You've been improving on ${concept} — this keeps that momentum going.`);
  }

  const proven = selected.reasonCodes.find((r) => r.startsWith('history_prefers_'));
  if (proven) {
    const t = proven.replace('history_prefers_', '') as InterventionType;
    why.push(`In your history, ${INTERVENTION_LABELS[t] ?? t} has improved your mastery more than other activities, so GenLearn chose it here.`);
  }
  if (selected.reasonCodes.includes('high_support_needs_guidance')) {
    why.push(`You've been leaning on hints and revisits lately, so a guided session should help more than solo practice.`);
  }

  evidence.push(`Current mastery: ${Math.round(e.mastery)}%`);
  evidence.push(`Based on ${e.evidenceCount} answered question${e.evidenceCount === 1 ? '' : 's'} on this concept`);
  if (e.trend !== 'new') evidence.push(`Recent trend: ${e.trend}`);

  const target = Math.min(100, Math.max(e.mastery + 15, e.trigger === 'advance' ? 90 : 70));
  const expectedOutcome =
    e.trigger === 'misconception'
      ? `Clear up the misunderstanding so you can answer ${concept} questions correctly without hesitation.`
      : `Raise your ${concept} mastery from ${Math.round(e.mastery)}% toward ${target}%.`;

  const confidence: Explanation['confidence'] =
    e.evidenceCount >= 8 && e.confidence >= 0.6 ? 'high' : e.evidenceCount >= 3 ? 'medium' : 'low';

  return {
    recommendation: `${INTERVENTION_LABELS[selected.type]} on ${concept}`,
    why,
    evidence,
    expectedOutcome,
    confidence,
  };
}
