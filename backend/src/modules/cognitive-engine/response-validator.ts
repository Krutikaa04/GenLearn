import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  GenerateQuizResult,
  GenerateLessonResult,
  GenerateFlashcardsResult,
  TutorChatResult,
  RagQueryResult,
  GenerateStudyPlanResult,
  ProcessDocumentResult,
} from '../ai-gateway/ai-gateway.service';

/**
 * Central gate every AI response passes through before reaching a business
 * module. Validators check essential structure only (required fields, correct
 * shapes, index bounds) and are lenient about optional fields, so well-formed
 * responses pass through unchanged (same object reference — callers relying on
 * identity are unaffected). Malformed output is rejected with a consistent
 * AI_RESPONSE_INVALID error rather than corrupting downstream state.
 */
@Injectable()
export class ResponseValidator {
  private reject(message: string): never {
    throw new UnprocessableEntityException({ code: 'AI_RESPONSE_INVALID', message });
  }

  private isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0;
  }

  validateQuiz(r: GenerateQuizResult): GenerateQuizResult {
    if (!r || !this.isNonEmptyString(r.title)) this.reject('Quiz missing title');
    if (!Array.isArray(r.questions) || r.questions.length === 0) this.reject('Quiz has no questions');
    for (const q of r.questions) {
      if (!this.isNonEmptyString(q?.text)) this.reject('Quiz question missing text');
      if (!Array.isArray(q.options) || q.options.length < 2) this.reject('Quiz question needs at least 2 options');
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        this.reject('Quiz question correctIndex out of range');
      }
    }
    return r;
  }

  validateLesson(r: GenerateLessonResult): GenerateLessonResult {
    if (!r || !this.isNonEmptyString(r.title)) this.reject('Lesson missing title');
    if (!Array.isArray(r.sections) || r.sections.length === 0) this.reject('Lesson has no sections');
    return r;
  }

  validateFlashcards(r: GenerateFlashcardsResult): GenerateFlashcardsResult {
    if (!r || !Array.isArray(r.cards) || r.cards.length === 0) this.reject('Flashcard set has no cards');
    for (const c of r.cards) {
      if (!this.isNonEmptyString(c?.front) || !this.isNonEmptyString(c?.back)) {
        this.reject('Flashcard missing front or back');
      }
    }
    return r;
  }

  validateTutor(r: TutorChatResult): TutorChatResult {
    if (!r || !this.isNonEmptyString(r.reply)) this.reject('Tutor response missing reply');
    return r;
  }

  validateRag(r: RagQueryResult): RagQueryResult {
    if (!r || typeof r.answer !== 'string') this.reject('RAG response missing answer');
    return r;
  }

  validateStudyPlan(r: GenerateStudyPlanResult): GenerateStudyPlanResult {
    if (!r || !this.isNonEmptyString(r.title)) this.reject('Study plan missing title');
    if (!Array.isArray(r.plan)) this.reject('Study plan missing plan');
    return r;
  }

  validateDocument(r: ProcessDocumentResult): ProcessDocumentResult {
    if (!r || typeof r.chunkCount !== 'number') this.reject('Document processing returned no chunk count');
    return r;
  }
}
