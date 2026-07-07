import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { LearnerModelRepository } from './learner-model.repository';
import { Quiz, QuizDocument } from '../quiz/schemas/quiz.schema';
import {
  QuestionBehaviorSignal,
  topicToConceptId,
  updateConceptEvidence,
} from './mastery-update';
import { ConceptSnapshot, decideNextActivity } from './pedagogical-policy';
import { DecisionStatus, DecisionTrigger } from './schemas/pedagogical-decision.schema';

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

  /** The student's current pending recommendation, shaped for the dashboard card. */
  async getRecommendation(studentId: string) {
    const decision = await this.repository.findPendingDecision(studentId);
    if (!decision) return null;

    const conceptLabel = decision.conceptId.replace(/-/g, ' ');
    const messages: Record<DecisionTrigger, string> = {
      [DecisionTrigger.MISCONCEPTION]: `You answered confidently but incorrectly on "${conceptLabel}" — a short lesson should clear it up.`,
      [DecisionTrigger.WEAK_CONCEPT]: `"${conceptLabel}" looks shaky — a quick ${decision.difficulty} quiz will build it up.`,
      [DecisionTrigger.PRACTICE]: `You're making progress on "${conceptLabel}" — targeted practice will lock it in.`,
      [DecisionTrigger.ADVANCE]: `You've mastered the basics of "${conceptLabel}" — time to level up.`,
    };

    return {
      decisionId: decision.decisionId,
      conceptId: decision.conceptId,
      topic: decision.topic,
      trigger: decision.trigger,
      action: decision.action,
      difficulty: decision.difficulty,
      message: messages[decision.trigger],
    };
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

    // Post-update snapshot per touched concept — the policy's input.
    const touched = new Map<string, ConceptSnapshot>();

    for (const answer of quiz.answers) {
      const question = questionById.get(answer.questionId);
      if (!question) continue;

      // Concept resolution with legacy bridge: metadata when present,
      // otherwise the per-question topic, otherwise the quiz topic.
      const primary = question.primaryConceptId ?? topicToConceptId(question.topic ?? quiz.topic);
      const secondaries = (question.conceptIds ?? []).filter((c) => c !== primary);
      const signal = behaviorByQuestion.get(answer.questionId) ?? null;
      const topic = question.topic ?? quiz.topic;

      for (const [conceptId, isPrimary] of [
        [primary, true] as const,
        ...secondaries.map((c) => [c, false] as const),
      ]) {
        const current = await this.repository.findOrCreate(studentId, conceptId);
        const result = updateConceptEvidence(
          { mastery: current.mastery, confidence: current.confidence, evidenceCount: current.evidenceCount },
          { correct: answer.isCorrect, isPrimary, behavior: signal },
        );
        const flagged = result.misconception && isPrimary;
        await this.repository.applyEvidence(
          studentId,
          conceptId,
          { mastery: result.mastery, confidence: result.confidence, evidenceCount: result.evidenceCount },
          flagged ? { quizId, questionId: answer.questionId, flaggedAt: new Date() } : null,
        );

        const prev = touched.get(conceptId);
        touched.set(conceptId, {
          conceptId,
          topic,
          mastery: result.mastery,
          confidence: result.confidence,
          hasRecentMisconception: (prev?.hasRecentMisconception ?? false) || flagged,
        });
      }
    }

    this.logger.log(`Learner model updated from quiz ${quizId} (${quiz.answers.length} answers)`);

    await this.recordDecision(studentId, quizId, [...touched.values()]);
  }

  /**
   * Runs the pedagogical policy over the concepts a quiz just touched and
   * persists at most one PENDING decision per student. A fresh misconception
   * supersedes a lower-priority pending recommendation; anything else defers
   * to the existing one so the "next activity" doesn't churn on every quiz.
   */
  private async recordDecision(
    studentId: string,
    sourceQuizId: string,
    touched: ConceptSnapshot[],
  ): Promise<void> {
    const decision = decideNextActivity(touched);
    if (!decision) return;

    const pending = await this.repository.findPendingDecision(studentId);
    if (pending) {
      const supersede =
        decision.trigger === DecisionTrigger.MISCONCEPTION && pending.trigger !== DecisionTrigger.MISCONCEPTION;
      if (!supersede) return;
      await this.repository.dismissDecision(pending.decisionId);
    }

    await this.repository.createDecision({
      decisionId: uuidv4(),
      studentId,
      conceptId: decision.conceptId,
      topic: decision.topic,
      trigger: decision.trigger,
      action: decision.action,
      difficulty: decision.difficulty,
      status: DecisionStatus.PENDING,
      masteryBefore: decision.masteryBefore,
      masteryAfter: null,
      sourceQuizId,
      generatedActivityId: null,
    });

    this.logger.log(
      `Pedagogical decision for ${studentId}: ${decision.trigger} → ${decision.action} on "${decision.conceptId}" (${decision.difficulty})`,
    );
  }
}
