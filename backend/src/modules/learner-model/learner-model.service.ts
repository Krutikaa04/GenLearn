import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LearnerModelRepository } from './learner-model.repository';
import { Quiz, QuizDocument } from '../quiz/schemas/quiz.schema';
import {
  QuestionBehaviorSignal,
  topicToConceptId,
  updateConceptEvidence,
} from './mastery-update';

export interface SessionBehaviorInput {
  perQuestion: {
    questionId: string;
    answerChanges: number;
    timeToFirstAnswerMs: number | null;
    idleMs: number;
  }[];
}

@Injectable()
export class LearnerModelService {
  private readonly logger = new Logger(LearnerModelService.name);

  constructor(
    private readonly repository: LearnerModelRepository,
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
  ) {}

  async getConceptMastery(studentId: string) {
    return this.repository.findByStudent(studentId);
  }

  /**
   * Ingests one submitted quiz as learner-model evidence. Correctness comes
   * from the stored answers; behavior signals (dwell/volatility/hesitation)
   * scale each mastery step. Quizzes without concept metadata bridge through
   * their topic string, so legacy content still feeds the model.
   */
  async updateFromQuizSubmission(
    studentId: string,
    quizId: string,
    behavior: SessionBehaviorInput | null,
  ): Promise<void> {
    const quiz = await this.quizModel.findOne({ quizId, studentId }).exec();
    if (!quiz || !quiz.answers?.length) {
      this.logger.warn(`Quiz ${quizId} missing or unanswered — skipping learner-model update`);
      return;
    }

    const behaviorByQuestion = new Map<string, QuestionBehaviorSignal>(
      (behavior?.perQuestion ?? []).map((q) => [
        q.questionId,
        { answerChanges: q.answerChanges, timeToFirstAnswerMs: q.timeToFirstAnswerMs, idleMs: q.idleMs },
      ]),
    );
    const questionById = new Map(quiz.questions.map((q) => [q.questionId, q]));

    for (const answer of quiz.answers) {
      const question = questionById.get(answer.questionId);
      if (!question) continue;

      // Concept resolution with legacy bridge: metadata when present,
      // otherwise the per-question topic, otherwise the quiz topic.
      const primary = question.primaryConceptId ?? topicToConceptId(question.topic ?? quiz.topic);
      const secondaries = (question.conceptIds ?? []).filter((c) => c !== primary);
      const signal = behaviorByQuestion.get(answer.questionId) ?? null;

      for (const [conceptId, isPrimary] of [
        [primary, true] as const,
        ...secondaries.map((c) => [c, false] as const),
      ]) {
        const current = await this.repository.findOrCreate(studentId, conceptId);
        const result = updateConceptEvidence(
          { mastery: current.mastery, confidence: current.confidence, evidenceCount: current.evidenceCount },
          { correct: answer.isCorrect, isPrimary, behavior: signal },
        );
        await this.repository.applyEvidence(
          studentId,
          conceptId,
          { mastery: result.mastery, confidence: result.confidence, evidenceCount: result.evidenceCount },
          result.misconception && isPrimary
            ? { quizId, questionId: answer.questionId, flaggedAt: new Date() }
            : null,
        );
      }
    }

    this.logger.log(`Learner model updated from quiz ${quizId} (${quiz.answers.length} answers)`);
  }
}
