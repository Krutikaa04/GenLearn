/**
 * Pure functions that turn concept states + activity signals into the rollup
 * intelligence stored on the LearnerProfile. No I/O, fully deterministic, so
 * every derived metric is unit-testable and reproducible. The learner-profile
 * service owns persistence; this module owns the maths.
 */

import { LearningStage } from './schemas/learner-profile.schema';

export type ConceptTrend = 'new' | 'improving' | 'declining' | 'stable';

export interface ConceptState {
  conceptId: string;
  topic?: string | null;
  mastery: number;
  confidence: number;
  evidenceCount: number;
  trend?: ConceptTrend;
  lastPracticedAt?: Date | null;
}

const MASTERED_MIN = 80;
const WEAK_MAX = 50;
const TREND_EPSILON = 2; // mastery points of movement that count as a real change

/** Direction of a concept's latest mastery movement. */
export function computeConceptTrend(previousMastery: number, newMastery: number): ConceptTrend {
  const delta = newMastery - previousMastery;
  if (delta > TREND_EPSILON) return 'improving';
  if (delta < -TREND_EPSILON) return 'declining';
  return 'stable';
}

/**
 * Review priority (Task 8 scaffolding): low mastery, low confidence, and time
 * since last practice all raise it. Bounded 0-100. Stored now; a future
 * forgetting model consumes it.
 */
export function computeReviewPriority(
  mastery: number,
  confidence: number,
  lastPracticedAt: Date | null,
  now: Date = new Date(),
): number {
  const masteryGap = (100 - mastery) * 0.5;
  const confidenceGap = (1 - confidence) * 25;
  const days = lastPracticedAt ? (now.getTime() - lastPracticedAt.getTime()) / 86_400_000 : 0;
  const staleness = Math.min(25, days * 2.5);
  return Math.round(Math.min(100, Math.max(0, masteryGap + confidenceGap + staleness)));
}

export interface TrendSummary {
  improving: string[];
  declining: string[];
  mastered: string[];
  needsReview: string[];
}

/** Long-term trend bands across all tracked concepts (Task 4). */
export function summariseTrends(concepts: ConceptState[]): TrendSummary {
  const improving: string[] = [];
  const declining: string[] = [];
  const mastered: string[] = [];
  const needsReview: string[] = [];
  for (const c of concepts) {
    if (c.trend === 'improving') improving.push(c.conceptId);
    if (c.trend === 'declining') declining.push(c.conceptId);
    if (c.mastery >= MASTERED_MIN && c.confidence >= 0.6) mastered.push(c.conceptId);
    if (c.mastery < WEAK_MAX) needsReview.push(c.conceptId);
  }
  return { improving, declining, mastered, needsReview };
}

export interface Velocity {
  conceptsTracked: number;
  masteredCount: number;
  avgMastery: number;
  avgConfidence: number;
  /** Fraction of tracked concepts that are mastered — a coarse efficiency proxy. */
  efficiency: number;
}

/** Learning velocity across the whole profile (Task 7). */
export function computeVelocity(concepts: ConceptState[]): Velocity {
  const conceptsTracked = concepts.length;
  if (conceptsTracked === 0) {
    return { conceptsTracked: 0, masteredCount: 0, avgMastery: 0, avgConfidence: 0, efficiency: 0 };
  }
  const masteredCount = concepts.filter((c) => c.mastery >= MASTERED_MIN).length;
  const avgMastery = Math.round(concepts.reduce((s, c) => s + c.mastery, 0) / conceptsTracked);
  const avgConfidence = Math.round((concepts.reduce((s, c) => s + c.confidence, 0) / conceptsTracked) * 100) / 100;
  return {
    conceptsTracked,
    masteredCount,
    avgMastery,
    avgConfidence,
    efficiency: Math.round((masteredCount / conceptsTracked) * 100) / 100,
  };
}

export interface SupportSignals {
  answerChanges: number;
  tabSwitches: number;
  tutorSessions: number;
  flashcardSessions: number;
  quizzes: number;
}

export interface SupportDependency {
  lookupReliance: number; // 0-1: correcting/looking things up mid-quiz
  tutorReliance: number; // 0-1
  revisionReliance: number; // 0-1: flashcards relative to quizzes
  score: number; // 0-1 overall assistance need (higher = more support used)
}

/**
 * How much assistance the learner leans on (Task 6). Derived only from signals
 * the app already collects. Never used to penalise — only to personalise.
 */
export function computeSupportDependency(s: SupportSignals): SupportDependency {
  const activity = Math.max(1, s.quizzes);
  const lookupReliance = clamp01((s.answerChanges + s.tabSwitches) / (activity * 5));
  const tutorReliance = clamp01(s.tutorSessions / (activity + s.tutorSessions));
  const revisionReliance = clamp01(s.flashcardSessions / (activity + s.flashcardSessions));
  const score = Math.round(((lookupReliance + tutorReliance + revisionReliance) / 3) * 100) / 100;
  return {
    lookupReliance: round2(lookupReliance),
    tutorReliance: round2(tutorReliance),
    revisionReliance: round2(revisionReliance),
    score,
  };
}

export interface InterventionEffectMap {
  [type: string]: { count: number; avgMasteryDelta: number };
}

export interface Preferences {
  preferredIntervention: string | null;
  ranked: { type: string; avgMasteryDelta: number; count: number }[];
}

/**
 * Infer which intervention type has historically helped this learner most,
 * from measured before/after mastery deltas (Task 9). Never asks the learner.
 */
export function inferPreferences(effectiveness: InterventionEffectMap): Preferences {
  const ranked = Object.entries(effectiveness)
    .filter(([, v]) => v.count > 0)
    .map(([type, v]) => ({ type, avgMasteryDelta: v.avgMasteryDelta, count: v.count }))
    .sort((a, b) => b.avgMasteryDelta - a.avgMasteryDelta);
  return { preferredIntervention: ranked[0]?.type ?? null, ranked };
}

/** Fold one new intervention outcome into a running effectiveness average. */
export function foldInterventionOutcome(
  prev: { count: number; avgMasteryDelta: number } | undefined,
  masteryDelta: number,
): { count: number; avgMasteryDelta: number } {
  const count = (prev?.count ?? 0) + 1;
  const prevAvg = prev?.avgMasteryDelta ?? 0;
  const avgMasteryDelta = Math.round(((prevAvg * (count - 1) + masteryDelta) / count) * 100) / 100;
  return { count, avgMasteryDelta };
}

/** Coarse learning stage from breadth of evidence and average mastery (Task 1). */
export function deriveLearningStage(conceptsTracked: number, avgMastery: number): LearningStage {
  if (conceptsTracked < 3) return LearningStage.ONBOARDING;
  if (avgMastery >= MASTERED_MIN) return LearningStage.ADVANCING;
  if (avgMastery >= WEAK_MAX) return LearningStage.CONSOLIDATING;
  return LearningStage.BUILDING;
}

/** A short human label for the learner's current pattern (Task 1). */
export function deriveIdentity(velocity: Velocity, trends: TrendSummary, support: SupportDependency): string {
  if (velocity.conceptsTracked < 3) return 'new-learner';
  if (trends.improving.length > trends.declining.length && velocity.efficiency >= 0.5) return 'steady-improver';
  if (trends.declining.length > trends.improving.length) return 'needs-reinforcement';
  if (support.score >= 0.5) return 'support-seeking';
  if (velocity.efficiency >= 0.7) return 'fast-mastery';
  return 'developing';
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
