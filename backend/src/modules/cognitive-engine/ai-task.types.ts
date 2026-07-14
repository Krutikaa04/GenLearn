/**
 * Universal AI request/response vocabulary for the GenLearn Cognitive Engine.
 *
 * Every AI workflow in the platform (quiz, adaptive quiz, lesson, flashcards,
 * tutor, RAG, study plan, document processing) is described by an AiTaskType and
 * flows through the same execution pipeline. Feature modules pass structured
 * data; the engine assembles context, calls the provider, validates, and returns
 * a normalized result. Business modules never see a raw LLM response.
 */

export enum AiTaskType {
  QUIZ = 'quiz',
  ADAPTIVE_QUIZ = 'adaptive_quiz',
  LESSON = 'lesson',
  FLASHCARDS = 'flashcards',
  TUTOR = 'tutor',
  RAG_QUERY = 'rag_query',
  STUDY_PLAN = 'study_plan',
  DOCUMENT_PROCESS = 'document_process',
}

/** One concept's standing in the learner model, trimmed for prompt context. */
export interface ConceptStanding {
  conceptId: string;
  mastery: number;
  confidence: number;
}

/**
 * The single structured learner-context object every AI request is built with.
 * Assembled centrally by LearnerContextBuilder — features no longer hand-roll
 * their own context. Empty (not absent) when the learner has no evidence yet.
 */
export interface LearnerContext {
  studentId: string;
  weakConcepts: ConceptStanding[];
  strongConcepts: ConceptStanding[];
  masteryByConcept: Record<string, number>;
  evidenceCount: number;
  hasHistory: boolean;
  assembledAt: string;
  /**
   * Persistent Learner Intelligence bundle (Sprint 2): learning identity/stage,
   * velocity, trends, support dependency, inferred preferences, intervention
   * effectiveness, and the most recent reflection. Null until a profile exists.
   * This is the single learner-intelligence object every AI task receives.
   */
  profile: Record<string, unknown> | null;

  /**
   * The learner's single active Learning Plan (Sprint 3): current objective,
   * target concepts, and revision needs. The Cognitive Engine surfaces the
   * planner's decision to every generation task so sequencing is owned by the
   * planner, not the business modules. Null until a plan exists.
   */
  plan: Record<string, unknown> | null;
}

/** Execution metadata captured for every AI call — the basis of central logging. */
export interface AiExecutionMeta {
  taskType: AiTaskType;
  feature: string;
  provider: string;
  correlationId: string;
  executionMs: number;
  validated: boolean;
  success: boolean;
}

/**
 * Standardized envelope returned by the engine's generic runner. Facade methods
 * unwrap `.data` for backward compatibility with existing callers; future
 * capabilities can consume the full envelope (meta) directly.
 */
export interface AiResponse<T> {
  data: T;
  meta: AiExecutionMeta;
}
