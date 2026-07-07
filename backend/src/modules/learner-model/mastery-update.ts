/**
 * Pure evidence-update rules for the concept-level learner model.
 * Correctness moves mastery; behavior signals scale the step so the model
 * distinguishes confident knowledge from lucky or shaky answers. No I/O.
 */

export interface ConceptEvidenceState {
  mastery: number;
  confidence: number;
  evidenceCount: number;
}

export interface QuestionBehaviorSignal {
  answerChanges: number;
  timeToFirstAnswerMs: number | null;
  idleMs: number;
  /** The tab left and came back before the first answer (look-it-up signature). */
  answeredAfterTabSwitch?: boolean;
}

export interface QuestionEvidence {
  correct: boolean;
  /** Primary concept gets the full step; secondary concepts get half. */
  isPrimary: boolean;
  behavior: QuestionBehaviorSignal | null;
  /** Per-question expected read+answer time from generation metadata (null on legacy quizzes). */
  expectedTimeMs?: number | null;
}

export interface EvidenceUpdateResult extends ConceptEvidenceState {
  /** Fast, unhesitating wrong answer — the signature of a misconception. */
  misconception: boolean;
  /** Correct answer right after a tab-away — mastery can't be trusted from it. */
  integritySuspect: boolean;
}

const CORRECT_STEP = 8;
const WRONG_STEP = 6;
const SECONDARY_SCALE = 0.5;
/** Fallback snap threshold when a question has no expected time. */
const SNAP_ANSWER_MS = 2_000;
/** Fraction of expected time below which an answer counts as a snap. */
const SNAP_EXPECTED_FRACTION = 0.15;
/** Multiple of expected time above which the student clearly struggled. */
const OVERTIME_FACTOR = 2;
/** Two or more answer switches signal low confidence in the final answer. */
const VOLATILE_CHANGES = 2;
/** Evidence weight for a correct answer that followed a tab-away. */
const TAB_SWITCH_DISCOUNT = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Confidence grows with accumulated evidence, saturating around ~10 samples. */
export function confidenceForEvidenceCount(evidenceCount: number): number {
  return clamp(1 - Math.exp(-evidenceCount / 4), 0, 1);
}

export function updateConceptEvidence(
  current: ConceptEvidenceState,
  evidence: QuestionEvidence,
): EvidenceUpdateResult {
  const behavior = evidence.behavior;
  const answerMs = behavior?.timeToFirstAnswerMs ?? null;
  const expectedMs = evidence.expectedTimeMs ?? null;

  // Expected-time-aware thresholds: a question the LLM budgeted 90s for,
  // answered in 8s, is a snap even though 8s beats the fixed floor.
  const snapThresholdMs = expectedMs
    ? Math.max(SNAP_ANSWER_MS, expectedMs * SNAP_EXPECTED_FRACTION)
    : SNAP_ANSWER_MS;
  const snapAnswer = answerMs !== null && answerMs < snapThresholdMs;
  const overTime = expectedMs !== null && answerMs !== null && answerMs > expectedMs * OVERTIME_FACTOR;
  const volatile = (behavior?.answerChanges ?? 0) >= VOLATILE_CHANGES;
  const tabSwitched = behavior?.answeredAfterTabSwitch === true;

  let step: number;
  let misconception = false;
  let integritySuspect = false;

  if (evidence.correct) {
    step = CORRECT_STEP;
    if (tabSwitched) {
      // Right answer after leaving the tab: possibly looked up — count it,
      // but barely, and flag the session's difficulty decisions.
      step *= TAB_SWITCH_DISCOUNT;
      integritySuspect = true;
    } else if (volatile || snapAnswer || overTime) {
      // Heavy switching, a snap guess, or far-over-budget struggle are all
      // weaker evidence of solid understanding — halve the gain.
      step *= 0.5;
    }
  } else {
    step = -WRONG_STEP;
    // Wrong without any hesitation and without leaving the tab: the student
    // genuinely believed they knew — that's a misconception, not a lookup.
    misconception = snapAnswer && !volatile && !tabSwitched;
  }

  if (!evidence.isPrimary) step *= SECONDARY_SCALE;

  const evidenceCount = current.evidenceCount + 1;

  return {
    mastery: Math.round(clamp(current.mastery + step, 0, 100)),
    confidence: confidenceForEvidenceCount(evidenceCount),
    evidenceCount,
    misconception,
    integritySuspect,
  };
}

/** Legacy bridge: quizzes without concept metadata map their topic string to a provisional concept. */
export function topicToConceptId(topic: string | null | undefined): string {
  const slug = (topic ?? 'general')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'general';
}
