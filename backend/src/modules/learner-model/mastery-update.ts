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
}

export interface QuestionEvidence {
  correct: boolean;
  /** Primary concept gets the full step; secondary concepts get half. */
  isPrimary: boolean;
  behavior: QuestionBehaviorSignal | null;
}

export interface EvidenceUpdateResult extends ConceptEvidenceState {
  /** Fast, unhesitating wrong answer — the signature of a misconception. */
  misconception: boolean;
}

const CORRECT_STEP = 8;
const WRONG_STEP = 6;
const SECONDARY_SCALE = 0.5;
/** Answered faster than this → likely guessing (if right) or misconception (if wrong). */
const SNAP_ANSWER_MS = 2_000;
/** Two or more answer switches signal low confidence in the final answer. */
const VOLATILE_CHANGES = 2;

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
  const snapAnswer =
    behavior?.timeToFirstAnswerMs !== null &&
    behavior?.timeToFirstAnswerMs !== undefined &&
    behavior.timeToFirstAnswerMs < SNAP_ANSWER_MS;
  const volatile = (behavior?.answerChanges ?? 0) >= VOLATILE_CHANGES;

  let step: number;
  let misconception = false;

  if (evidence.correct) {
    step = CORRECT_STEP;
    // A correct answer reached through heavy switching or a snap guess is
    // weaker evidence of understanding — halve the gain.
    if (volatile || snapAnswer) step *= 0.5;
  } else {
    step = -WRONG_STEP;
    // Wrong without any hesitation: the student believed they knew.
    misconception = snapAnswer && !volatile;
  }

  if (!evidence.isPrimary) step *= SECONDARY_SCALE;

  const evidenceCount = current.evidenceCount + 1;

  return {
    mastery: Math.round(clamp(current.mastery + step, 0, 100)),
    confidence: confidenceForEvidenceCount(evidenceCount),
    evidenceCount,
    misconception,
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
