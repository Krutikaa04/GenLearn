import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AiGatewayService,
  GenerateQuizPayload,
  GenerateQuizResult,
  GenerateLessonPayload,
  GenerateLessonResult,
  GenerateFlashcardsPayload,
  GenerateFlashcardsResult,
  TutorChatPayload,
  TutorChatResult,
  RagQueryPayload,
  RagQueryResult,
  GenerateStudyPlanPayload,
  GenerateStudyPlanResult,
  ProcessDocumentPayload,
  ProcessDocumentResult,
} from '../ai-gateway/ai-gateway.service';
import { LearnerContextBuilder } from './learner-context.builder';
import { PromptBuilder } from './prompt-builder';
import { ResponseValidator } from './response-validator';
import { AiResponse, AiTaskType, LearnerContext } from './ai-task.types';

const PROVIDER_NAME = 'gemini';

/**
 * The GenLearn Cognitive Engine — the single orchestration layer for every AI
 * workflow in the platform. Feature modules (quiz, lesson, flashcards, tutor,
 * documents, study plan) call the engine instead of the provider directly.
 *
 * One pipeline for all tasks:
 *   learner context → prompt/payload assembly → provider → validation →
 *   standardized response, with correlation-scoped logging around every call.
 *
 * The engine owns orchestration only; business modules keep owning lifecycle,
 * persistence, and validation of their own domain state. The AI provider
 * (AiGatewayService) is reachable *only* through here.
 */
@Injectable()
export class CognitiveEngineService {
  private readonly logger = new Logger('CognitiveEngine');

  constructor(
    private readonly provider: AiGatewayService,
    private readonly contextBuilder: LearnerContextBuilder,
    private readonly prompts: PromptBuilder,
    private readonly validator: ResponseValidator,
  ) {}

  // ── Task facades (same signatures the feature modules already relied on) ──

  async generateQuiz(payload: GenerateQuizPayload): Promise<GenerateQuizResult> {
    const taskType = payload.adaptiveFocus ? AiTaskType.ADAPTIVE_QUIZ : AiTaskType.QUIZ;
    const res = await this.execute<GenerateQuizResult>(
      taskType,
      'quiz',
      payload.studentId,
      () => this.provider.generateQuiz(payload),
      (r) => this.validator.validateQuiz(r),
    );
    return res.data;
  }

  async generateLesson(payload: GenerateLessonPayload): Promise<GenerateLessonResult> {
    const res = await this.execute<GenerateLessonResult>(
      AiTaskType.LESSON,
      'lesson',
      payload.studentId,
      () => this.provider.generateLesson(payload),
      (r) => this.validator.validateLesson(r),
    );
    return res.data;
  }

  async generateFlashcards(payload: GenerateFlashcardsPayload): Promise<GenerateFlashcardsResult> {
    const res = await this.execute<GenerateFlashcardsResult>(
      AiTaskType.FLASHCARDS,
      'flashcards',
      payload.studentId,
      () => this.provider.generateFlashcards(payload),
      (r) => this.validator.validateFlashcards(r),
    );
    return res.data;
  }

  async tutorChat(payload: TutorChatPayload): Promise<TutorChatResult> {
    const res = await this.execute<TutorChatResult>(
      AiTaskType.TUTOR,
      'tutor',
      payload.studentId,
      (ctx) => this.provider.tutorChat(this.prompts.buildTutorPayload(payload, ctx)),
      (r) => this.validator.validateTutor(r),
    );
    return res.data;
  }

  async ragQuery(payload: RagQueryPayload): Promise<RagQueryResult> {
    const res = await this.execute<RagQueryResult>(
      AiTaskType.RAG_QUERY,
      'rag',
      payload.studentId,
      () => this.provider.ragQuery(payload),
      (r) => this.validator.validateRag(r),
    );
    return res.data;
  }

  async generateStudyPlan(payload: GenerateStudyPlanPayload): Promise<GenerateStudyPlanResult> {
    const res = await this.execute<GenerateStudyPlanResult>(
      AiTaskType.STUDY_PLAN,
      'studyplan',
      payload.userId,
      () => this.provider.generateStudyPlan(payload),
      (r) => this.validator.validateStudyPlan(r),
    );
    return res.data;
  }

  async processDocument(payload: ProcessDocumentPayload): Promise<ProcessDocumentResult> {
    // No learner context: document parsing is content-only, not learner-adaptive.
    const res = await this.execute<ProcessDocumentResult>(
      AiTaskType.DOCUMENT_PROCESS,
      'document',
      null,
      () => this.provider.processDocument(payload),
      (r) => this.validator.validateDocument(r),
    );
    return res.data;
  }

  // ── The one execution pipeline every task runs through ──

  /**
   * Assembles learner context, invokes the provider, validates the response,
   * and emits correlation-scoped logging. `studentId` null skips context
   * assembly (content-only tasks). Context assembly never blocks a call — a
   * failure degrades to null context, logged by the builder. Provider and
   * validation failures propagate unchanged so existing error handling (worker
   * retries, HTTP error mapping) behaves exactly as before.
   */
  private async execute<T>(
    taskType: AiTaskType,
    feature: string,
    studentId: string | null,
    providerCall: (context: LearnerContext | null) => Promise<T>,
    validate: (raw: T) => T,
  ): Promise<AiResponse<T>> {
    const correlationId = uuidv4();
    const startedAt = Date.now();

    const context = studentId ? await this.contextBuilder.build(studentId) : null;

    try {
      const raw = await providerCall(context);
      const data = validate(raw);
      const executionMs = Date.now() - startedAt;
      this.logger.log(
        `[${correlationId}] ${feature}/${taskType} via ${PROVIDER_NAME} ok in ${executionMs}ms (validated)`,
      );
      return {
        data,
        meta: {
          taskType,
          feature,
          provider: PROVIDER_NAME,
          correlationId,
          executionMs,
          validated: true,
          success: true,
        },
      };
    } catch (err) {
      const executionMs = Date.now() - startedAt;
      // Message only — never log payloads, keys, or learner data.
      this.logger.error(
        `[${correlationId}] ${feature}/${taskType} via ${PROVIDER_NAME} failed in ${executionMs}ms: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
