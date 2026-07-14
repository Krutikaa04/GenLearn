/**
 * Pure composition of a Learning Plan from existing intelligence — no I/O.
 * The planner does NOT re-derive adaptive logic: it consumes the pending
 * pedagogical decision (already produced by the adaptive pipeline) plus concept
 * mastery and the persistent profile, and shapes them into one structured,
 * measurable session plan. Deterministic, so every field is unit-testable.
 */

import { LearningPlan, PlanStatus } from './schemas/learning-plan.schema';

export interface PlannerConcept {
  conceptId: string;
  mastery: number;
  confidence: number;
}

export interface PlannerDecisionInput {
  conceptId: string;
  topic: string;
  trigger: 'misconception' | 'weak_concept' | 'practice' | 'advance' | string;
  action: 'lesson' | 'quiz' | string;
  difficulty: string;
  masteryBefore: number;
  blueprint: { questionCount?: number; targetConceptDistribution?: Record<string, number> } | null;
  reasonCodes: string[];
}

export interface PlannerInput {
  currentGoal: string | null;
  decision: PlannerDecisionInput | null;
  concepts: PlannerConcept[];
}

const REVISE_MAX = 50;
const ADVANCE_MIN = 80;
const PREREQ_MAX = 30;

const humanize = (id: string) => id.replace(/-/g, ' ');

/** One measurable objective per session (Task: Learning Objectives). */
function objectiveFor(decision: PlannerDecisionInput): string {
  const c = humanize(decision.conceptId);
  const target = Math.min(100, Math.max(decision.masteryBefore + 15, decision.trigger === 'advance' ? 90 : 70));
  switch (decision.trigger) {
    case 'misconception':
      return `Correct your misunderstanding of ${c} (aim: answer it right without hesitation)`;
    case 'weak_concept':
      return `Build a solid foundation in ${c} (raise mastery from ${decision.masteryBefore}% toward ${target}%)`;
    case 'advance':
      return `Master advanced ${c} (push mastery from ${decision.masteryBefore}% toward ${target}%)`;
    default:
      return `Improve your accuracy on ${c} (raise mastery from ${decision.masteryBefore}% toward ${target}%)`;
  }
}

/** Revision buckets from concept mastery (Task: Revision Planning). */
export function computeRevision(concepts: PlannerConcept[]) {
  return {
    revise: concepts.filter((c) => c.mastery < REVISE_MAX).map((c) => c.conceptId),
    reinforce: concepts.filter((c) => c.mastery >= REVISE_MAX && c.mastery < ADVANCE_MIN).map((c) => c.conceptId),
    advance: concepts.filter((c) => c.mastery >= ADVANCE_MIN && c.confidence >= 0.6).map((c) => c.conceptId),
    // No knowledge graph yet — the weakest concepts stand in as prerequisites.
    prerequisites: concepts.filter((c) => c.mastery < PREREQ_MAX).map((c) => c.conceptId),
  };
}

/**
 * Compose the single Learning Plan. Three shapes:
 *  - a pending decision → a concrete next session (lesson?/quiz + revision);
 *  - no decision but history exists → light practice on the weakest concept;
 *  - no history → awaiting-topic onboarding plan (learner starts a new topic).
 */
export function composeLearningPlan(input: PlannerInput): Omit<LearningPlan, 'studentId'> {
  const revision = computeRevision(input.concepts);

  if (input.decision) {
    const d = input.decision;
    const questionCount = d.blueprint?.questionCount ?? 5;
    const targetConcepts = d.blueprint?.targetConceptDistribution
      ? Object.keys(d.blueprint.targetConceptDistribution)
      : [d.conceptId];
    const lessonNeeded = d.action === 'lesson' || d.trigger === 'misconception';
    const flashcardConcepts = revision.reinforce.slice(0, 5);
    const estimatedMinutes = (lessonNeeded ? 8 : 0) + Math.ceil(questionCount * 1.2) + (revision.revise.length ? 4 : 0);

    return {
      status: PlanStatus.ACTIVE,
      currentGoal: input.currentGoal,
      objective: objectiveFor(d),
      topic: d.topic,
      targetConcepts,
      recommendedLesson: lessonNeeded
        ? { needed: true, topic: d.topic, conceptId: d.conceptId }
        : { needed: false },
      recommendedQuiz: {
        needed: true,
        difficulty: d.difficulty,
        questionCount,
        targetConcepts,
        purpose: d.blueprint ? 'adaptive-followup' : 'practice',
      },
      revision,
      recommendedFlashcards: { needed: flashcardConcepts.length > 0, concepts: flashcardConcepts },
      estimatedMinutes,
      expectedOutcome: `Measurable improvement on ${humanize(d.conceptId)} and any linked concepts.`,
      completionCriteria: `Complete the adaptive quiz; objective is met when ${humanize(d.conceptId)} mastery rises without the confident-but-wrong pattern.`,
      nextPlannerDecision: `After this session, re-evaluate ${humanize(d.conceptId)} and pick the next weakest concept or advance.`,
      reasonCodes: d.reasonCodes,
      generatedAt: new Date(),
    };
  }

  if (input.concepts.length > 0) {
    const weakest = [...input.concepts].sort((a, b) => a.mastery - b.mastery)[0];
    return {
      status: PlanStatus.ACTIVE,
      currentGoal: input.currentGoal,
      objective: `Keep practicing ${humanize(weakest.conceptId)} to lock in what you've learned`,
      topic: null,
      targetConcepts: [weakest.conceptId],
      recommendedLesson: { needed: false },
      recommendedQuiz: { needed: true, difficulty: 'intermediate', questionCount: 5, targetConcepts: [weakest.conceptId], purpose: 'practice' },
      revision,
      recommendedFlashcards: { needed: revision.reinforce.length > 0, concepts: revision.reinforce.slice(0, 5) },
      estimatedMinutes: 8,
      expectedOutcome: `Reinforced retention on ${humanize(weakest.conceptId)}.`,
      completionCriteria: 'Complete a short practice quiz.',
      nextPlannerDecision: 'Continue accumulating evidence, then target the next weak concept.',
      reasonCodes: ['no_pending_decision', 'practice_weakest'],
      generatedAt: new Date(),
    };
  }

  // No history at all — the learner starts by choosing a topic (diagnostic).
  return {
    status: PlanStatus.AWAITING_TOPIC,
    currentGoal: input.currentGoal,
    objective: 'Choose a topic to begin — GenLearn will plan every session after your first quiz',
    topic: null,
    targetConcepts: [],
    recommendedLesson: { needed: false },
    recommendedQuiz: { needed: false },
    revision,
    recommendedFlashcards: { needed: false, concepts: [] },
    estimatedMinutes: 10,
    expectedOutcome: 'An initial diagnostic that seeds your learner profile.',
    completionCriteria: 'Generate and complete a diagnostic quiz on your chosen topic.',
    nextPlannerDecision: 'After the diagnostic, autonomous planning takes over.',
    reasonCodes: ['no_history', 'awaiting_topic'],
    generatedAt: new Date(),
  };
}
