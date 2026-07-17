/**
 * Learning Intelligence & Prediction System (LIPS) — pure, rule-based, no I/O
 * and no ML. Everything here is composed from data the platform already stores
 * (concept mastery, persistent profile, learning timeline). Deterministic so
 * every forecast, insight, and coaching line is unit-testable and evidence-
 * backed — nothing is invented.
 */

export type ConceptTrend = 'new' | 'improving' | 'declining' | 'stable';
export type RevisionUrgency = 'immediate' | 'soon' | 'safe';

export interface ConceptSignal {
  conceptId: string;
  topic?: string | null;
  mastery: number;
  confidence: number;
  evidenceCount: number;
  trend: ConceptTrend;
  lastPracticedAt: Date | null;
  reviewPriority: number;
}

const DAY_MS = 86_400_000;
const MASTERED_MIN = 80;
const WEAK_MAX = 50;
const humanize = (id: string) => id.replace(/-/g, ' ');

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.max(0, (now.getTime() - new Date(date).getTime()) / DAY_MS);
}

// ── Task 3: Revision prediction ──────────────────────────────────────────────

export interface RevisionItem {
  conceptId: string;
  urgency: RevisionUrgency;
  reviewPriority: number;
  daysSincePracticed: number | null;
  reason: string;
}

/** Classify each concept's revision urgency from stored signals (no ML). */
export function forecastRevision(concepts: ConceptSignal[], now: Date = new Date()): {
  immediate: RevisionItem[];
  soon: RevisionItem[];
  safe: RevisionItem[];
} {
  const immediate: RevisionItem[] = [];
  const soon: RevisionItem[] = [];
  const safe: RevisionItem[] = [];

  for (const c of concepts) {
    const days = daysSince(c.lastPracticedAt, now);
    let urgency: RevisionUrgency;
    let reason: string;

    if (c.reviewPriority >= 60 || (c.trend === 'declining' && c.mastery < 60)) {
      urgency = 'immediate';
      reason = c.trend === 'declining' ? 'declining and not yet solid' : 'high review priority';
    } else if (c.reviewPriority >= 35 || (days !== null && days > 7 && c.mastery < MASTERED_MIN)) {
      urgency = 'soon';
      reason = days !== null && days > 7 ? 'not practiced in over a week' : 'moderate review priority';
    } else {
      urgency = 'safe';
      reason = c.mastery >= MASTERED_MIN ? 'strong and recently practiced' : 'stable for now';
    }

    const item: RevisionItem = { conceptId: c.conceptId, urgency, reviewPriority: c.reviewPriority, daysSincePracticed: days === null ? null : Math.round(days), reason };
    (urgency === 'immediate' ? immediate : urgency === 'soon' ? soon : safe).push(item);
  }

  const byPriority = (a: RevisionItem, b: RevisionItem) => b.reviewPriority - a.reviewPriority;
  return { immediate: immediate.sort(byPriority), soon: soon.sort(byPriority), safe: safe.sort(byPriority) };
}

// ── Task 7: Future learning prediction ───────────────────────────────────────

export interface Prediction {
  readyToAdvance: string[];
  nextConcept: { conceptId: string; reason: string } | null;
  nextMilestone: string;
  likelyToMaster: string[];
  likelyToForget: string[];
}

/** Predict readiness, the next concept, and the next milestone (rule-based). */
export function predictFutureLearning(concepts: ConceptSignal[]): Prediction {
  const readyToAdvance = concepts.filter((c) => c.mastery >= MASTERED_MIN && c.confidence >= 0.6).map((c) => c.conceptId);
  // Improving + mid mastery = on track to master soon.
  const likelyToMaster = concepts
    .filter((c) => c.trend === 'improving' && c.mastery >= WEAK_MAX && c.mastery < MASTERED_MIN)
    .map((c) => c.conceptId);
  // Was solid but slipping, or stale and shaky = likely to forget.
  const likelyToForget = concepts
    .filter((c) => (c.trend === 'declining' && c.mastery >= WEAK_MAX) || (c.reviewPriority >= 50 && c.mastery >= WEAK_MAX))
    .map((c) => c.conceptId);

  // Next concept: the weakest with enough evidence to trust, else lowest mastery.
  const trustworthy = concepts.filter((c) => c.evidenceCount >= 2);
  const pool = trustworthy.length ? trustworthy : concepts;
  const nextConcept = pool.length
    ? (() => {
        const weakest = [...pool].sort((a, b) => a.mastery - b.mastery)[0];
        return {
          conceptId: weakest.conceptId,
          reason: weakest.trend === 'declining' ? 'weakest and declining' : 'lowest current mastery',
        };
      })()
    : null;

  let nextMilestone: string;
  if (nextConcept) {
    const c = concepts.find((x) => x.conceptId === nextConcept.conceptId)!;
    const target = c.mastery < WEAK_MAX ? WEAK_MAX : MASTERED_MIN;
    nextMilestone = `Reach ${target}% mastery on ${humanize(nextConcept.conceptId)}`;
  } else if (readyToAdvance.length) {
    nextMilestone = `Advance ${humanize(readyToAdvance[0])} to harder material`;
  } else {
    nextMilestone = 'Complete a diagnostic quiz to set your first milestone';
  }

  return { readyToAdvance, nextConcept, nextMilestone, likelyToMaster, likelyToForget };
}

// ── Task 6: Evidence-based insights ──────────────────────────────────────────

export interface InsightInput {
  concepts: ConceptSignal[];
  preferredIntervention?: string | null;
  supportScore?: number;
}

/** Insights that are each backed by a concrete signal — never invented. */
export function generateInsights(input: InsightInput): string[] {
  const out: string[] = [];
  const improving = input.concepts.filter((c) => c.trend === 'improving');
  const declining = input.concepts.filter((c) => c.trend === 'declining');

  for (const c of improving.slice(0, 2)) {
    out.push(`${cap(humanize(c.conceptId))} mastery has been improving consistently.`);
  }
  for (const c of declining.slice(0, 2)) {
    out.push(`${cap(humanize(c.conceptId))} confidence is declining — worth a review.`);
  }
  if (input.preferredIntervention) {
    const label: Record<string, string> = {
      lesson: 'lessons', quiz: 'quizzes', flashcards: 'flashcard review', tutor: 'tutor sessions',
      revision: 'revision', worked_example: 'worked examples', concept_review: 'concept reviews',
    };
    out.push(`You tend to improve most after ${label[input.preferredIntervention] ?? input.preferredIntervention}.`);
  }
  const mastered = input.concepts.filter((c) => c.mastery >= MASTERED_MIN && c.confidence >= 0.6);
  if (mastered.length >= 3) out.push(`You've built solid mastery across ${mastered.length} concepts.`);
  if ((input.supportScore ?? 0) >= 0.6) out.push('You lean on hints and revisits — guided sessions may speed you up.');

  return out;
}

// ── Task 4: AI Learning Coach ────────────────────────────────────────────────

export interface CoachSummary {
  todaysFocus: string;
  biggestImprovement: string | null;
  currentWeakness: string | null;
  nextMilestone: string;
  revisionReminder: string | null;
}

/** Concise, actionable coaching — one line each, all evidence-derived. */
export function buildCoachSummary(
  concepts: ConceptSignal[],
  revision: ReturnType<typeof forecastRevision>,
  prediction: Prediction,
): CoachSummary {
  const sorted = [...concepts].sort((a, b) => a.mastery - b.mastery);
  const weakest = sorted[0] ?? null;
  const improving = concepts.filter((c) => c.trend === 'improving').sort((a, b) => b.mastery - a.mastery)[0] ?? null;

  const focusItem = revision.immediate[0] ?? revision.soon[0];
  const todaysFocus = focusItem
    ? `Review ${humanize(focusItem.conceptId)} — ${focusItem.reason}.`
    : weakest
      ? `Build up ${humanize(weakest.conceptId)} (${Math.round(weakest.mastery)}% mastery).`
      : 'Start a topic to get a focused plan.';

  const revisionCount = revision.immediate.length + revision.soon.length;

  return {
    todaysFocus,
    biggestImprovement: improving ? `${cap(humanize(improving.conceptId))} — up and trending well.` : null,
    currentWeakness: weakest ? `${cap(humanize(weakest.conceptId))} at ${Math.round(weakest.mastery)}% mastery.` : null,
    nextMilestone: prediction.nextMilestone,
    revisionReminder: revisionCount > 0 ? `${revisionCount} concept${revisionCount === 1 ? '' : 's'} due for revision (${revision.immediate.length} urgent).` : null,
  };
}

// ── Task 5: Weekly learning summary ──────────────────────────────────────────

export interface TimelineLike {
  type: string;
  conceptIds?: string[];
  topic?: string | null;
  data?: Record<string, unknown>;
  occurredAt: Date | string;
}

export interface WeeklySummary {
  from: string;
  to: string;
  quizzesTaken: number;
  lessonsCompleted: number;
  flashcardsGenerated: number;
  tutorSessions: number;
  conceptsImproved: string[];
  strongestImprovement: { conceptId: string; delta: number } | null;
  conceptsNeedingRevision: string[];
  weakestTopic: string | null;
  recommendedFocus: string | null;
}

/** Aggregate the last 7 days of timeline events + current concept state. */
export function buildWeeklySummary(
  events: TimelineLike[],
  concepts: ConceptSignal[],
  revision: ReturnType<typeof forecastRevision>,
  now: Date = new Date(),
): WeeklySummary {
  const from = new Date(now.getTime() - 7 * DAY_MS);
  const recent = events.filter((e) => new Date(e.occurredAt) >= from);

  const count = (t: string) => recent.filter((e) => e.type === t).length;
  const improvedEvents = recent.filter((e) => e.type === 'concept_improved');
  const conceptsImproved = [...new Set(improvedEvents.flatMap((e) => e.conceptIds ?? []))];

  let strongestImprovement: WeeklySummary['strongestImprovement'] = null;
  for (const e of improvedEvents) {
    const before = Number(e.data?.before ?? NaN);
    const after = Number(e.data?.after ?? NaN);
    if (Number.isFinite(before) && Number.isFinite(after)) {
      const delta = after - before;
      const conceptId = e.conceptIds?.[0];
      if (conceptId && (!strongestImprovement || delta > strongestImprovement.delta)) {
        strongestImprovement = { conceptId, delta };
      }
    }
  }

  const weakest = [...concepts].sort((a, b) => a.mastery - b.mastery)[0] ?? null;
  const recommendedFocus = revision.immediate[0]?.conceptId ?? weakest?.conceptId ?? null;

  return {
    from: from.toISOString(),
    to: now.toISOString(),
    quizzesTaken: count('quiz_attempted') + count('adaptive_quiz'),
    lessonsCompleted: count('lesson_completed'),
    flashcardsGenerated: count('flashcards_generated'),
    tutorSessions: count('tutor_session'),
    conceptsImproved,
    strongestImprovement,
    conceptsNeedingRevision: [...revision.immediate, ...revision.soon].map((r) => r.conceptId),
    weakestTopic: weakest?.topic ?? null,
    recommendedFocus,
  };
}

function cap(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
