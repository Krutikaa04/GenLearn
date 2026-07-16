import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { LearnerModelRepository } from './learner-model.repository';
import { Quiz, QuizDocument, QuizStatus } from '../quiz/schemas/quiz.schema';
import {
  QuestionBehaviorSignal,
  topicToConceptId,
  updateConceptEvidence,
} from './mastery-update';
import { ConceptSnapshot, decideNextActivity, PolicyDecision } from './pedagogical-policy';
import { buildQuizBlueprint, QuizBlueprint } from './quiz-blueprint';
import { DecisionStatus, DecisionTrigger } from './schemas/pedagogical-decision.schema';
import { BehaviorFeatures, BehaviorFeaturesDocument } from '../telemetry/schemas/behavior-features.schema';
import { LearnerProfileService, ConceptChange } from './learner-profile.service';
import { AutonomousPlannerService } from './autonomous-planner.service';
import { computeConceptTrend, computeReviewPriority } from './learner-intelligence';

export interface SessionBehaviorInput {
  perQuestion: {
    questionId: string;
    answerChanges: number;
    timeToFirstAnswerMs: number | null;
    idleMs: number;
    answeredAfterTabSwitch?: boolean;
  }[];
}

@Injectable()
export class LearnerModelService {
  private readonly logger = new Logger(LearnerModelService.name);

  constructor(
    private readonly repository: LearnerModelRepository,
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    @InjectModel(BehaviorFeatures.name)
    private readonly behaviorModel: Model<BehaviorFeaturesDocument>,
    private readonly learnerProfile: LearnerProfileService,
    private readonly planner: AutonomousPlannerService,
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

  /** The pending adaptive plan (decision + persisted blueprint), or null. */
  async getNextQuizPlan(studentId: string): Promise<{
    decisionId: string;
    topic: string;
    conceptId: string;
    difficulty: string;
    blueprint: QuizBlueprint | null;
    sourceQuizId: string | null;
  } | null> {
    const decision = await this.repository.findPendingDecision(studentId);
    if (!decision) return null;
    return {
      decisionId: decision.decisionId,
      topic: decision.topic,
      conceptId: decision.conceptId,
      difficulty: decision.difficulty,
      blueprint: (decision.blueprint as unknown as QuizBlueprint) ?? null,
      sourceQuizId: decision.sourceQuizId,
    };
  }

  async markDecisionGenerated(decisionId: string, quizId: string): Promise<void> {
    await this.repository.markGenerated(decisionId, quizId);
  }

  /**
   * Per-question behavioral breakdown of the most recent submitted quiz on each
   * topic — for the Progress report. Joins stored correctness with behavior
   * features (time, answer changes) and turns each into a plain-language label.
   * Degrades gracefully when telemetry is absent (label from correctness only).
   */
  async getRecentQuestionAnalysis(studentId: string) {
    const quizzes = await this.quizModel
      .find({ studentId, status: QuizStatus.SUBMITTED, submittedAt: { $ne: null } })
      .sort({ submittedAt: -1 })
      .limit(60)
      .exec();

    const seenTopics = new Set<string>();
    const perTopic: unknown[] = [];

    for (const quiz of quizzes) {
      if (seenTopics.has(quiz.topic) || !quiz.answers?.length) continue;
      seenTopics.add(quiz.topic);

      const behavior = await this.behaviorModel.findOne({ quizId: quiz.quizId }).exec();
      const featByQuestion = new Map((behavior?.perQuestion ?? []).map((q) => [q.questionId, q]));
      const questionById = new Map(quiz.questions.map((q) => [q.questionId, q]));

      const correct = quiz.answers.filter((a) => a.isCorrect).length;
      const questions = quiz.answers.map((a, i) => {
        const q = questionById.get(a.questionId);
        const f = featByQuestion.get(a.questionId);
        const timeMs = f?.timeToFirstAnswerMs ?? f?.dwellMs ?? null;
        const answerChanges = f?.answerChanges ?? 0;
        return {
          index: i + 1,
          text: q?.text ?? `Question ${i + 1}`,
          concept: (q?.primaryConceptId ?? '').replace(/-/g, ' ') || null,
          isCorrect: a.isCorrect,
          timeMs,
          answerChanges,
          label: this.questionLabel(a.isCorrect, timeMs, answerChanges),
        };
      });

      perTopic.push({
        topic: quiz.topic,
        quizId: quiz.quizId,
        submittedAt: quiz.submittedAt,
        scorePercent: Math.round((correct / quiz.answers.length) * 100),
        questions,
      });

      if (perTopic.length >= 12) break;
    }

    return perTopic;
  }

  /** Plain-language read of one answer from correctness + timing + volatility. */
  private questionLabel(isCorrect: boolean, timeMs: number | null, answerChanges: number): string {
    const fast = timeMs != null && timeMs < 6000;
    const slow = timeMs != null && timeMs > 45000;
    if (isCorrect) {
      if (answerChanges === 0 && fast) return 'Confident';
      if (answerChanges >= 2 || slow) return 'Correct but unsure';
      return 'Correct';
    }
    if (fast && answerChanges === 0) return 'Likely guess';
    if (slow) return 'Productive struggle';
    if (answerChanges >= 2) return 'Uncertain';
    return 'Incorrect';
  }

  /**
   * Assembles the student-facing "Quiz Intelligence Report" for one submitted
   * quiz: performance, concept mastery bands, behavioral observations, possible
   * misconceptions, and what the next adaptive quiz will do. Every section is
   * evidence-gated — absent (not faked) when the data isn't there yet. Returns
   * `{ status: 'processing' }` while the async learner-model pipeline catches up.
   */
  async getQuizAnalysis(studentId: string, quizId: string) {
    const quiz = await this.quizModel.findOne({ quizId, studentId }).exec();
    if (!quiz || !quiz.answers?.length) return { status: 'processing' as const };

    const humanize = (id: string) => id.replace(/-/g, ' ');

    // Concepts this quiz actually touched (metadata, else topic bridge).
    const touchedConceptIds = new Set<string>();
    for (const q of quiz.questions) {
      const primary = q.primaryConceptId ?? topicToConceptId(q.topic ?? quiz.topic);
      touchedConceptIds.add(primary);
      for (const c of q.conceptIds ?? []) touchedConceptIds.add(c);
    }

    const allMastery = await this.repository.findByStudent(studentId);
    const relevant = allMastery.filter((m) => touchedConceptIds.has(m.conceptId));
    const masteryPool = relevant.length ? relevant : allMastery;

    const band = (min: number, max: number) =>
      masteryPool
        .filter((m) => m.mastery >= min && m.mastery < max)
        .sort((a, b) => a.mastery - b.mastery)
        .map((m) => ({
          conceptId: m.conceptId,
          label: humanize(m.conceptId),
          mastery: Math.round(m.mastery),
          confidence: Math.round(m.confidence * 100) / 100,
          // Guard against false precision on thin evidence.
          uncertain: m.evidenceCount < 3 || m.confidence < 0.4,
        }));

    const conceptMastery = {
      strong: band(80, 101),
      developing: band(50, 80),
      needsAttention: band(0, 50),
    };

    // Behavior features for this quiz's session (may be absent when telemetry off).
    const behavior = await this.behaviorModel.findOne({ quizId }).exec();
    const behavioralObservations = this.deriveObservations(behavior, quiz.answers.length);

    // Possible misconceptions: only surfaced when a concept was actually flagged
    // this quiz (confidently-wrong evidence) — never inferred from a single miss.
    const possibleMisconceptions = allMastery
      .filter((m) => (m.misconceptionFlags ?? []).some((f) => f.quizId === quizId))
      .map((m) => `You may be applying "${humanize(m.conceptId)}" incorrectly — the confident-but-wrong pattern suggests a misunderstanding rather than a slip.`);

    // Performance summary + improvement vs the previous quiz on this topic.
    const correct = quiz.answers.filter((a) => a.isCorrect).length;
    const total = quiz.answers.length;
    const scorePercent = Math.round((correct / total) * 100);
    const previous = await this.quizModel
      .findOne({ studentId, topic: quiz.topic, status: QuizStatus.SUBMITTED, quizId: { $ne: quizId }, score: { $ne: null } })
      .sort({ submittedAt: -1 })
      .exec();
    const prevPercent =
      previous && previous.score != null && previous.questionCount
        ? Math.round((previous.score / previous.questionCount) * 100)
        : null;

    const performance = {
      score: correct,
      correct,
      incorrect: total - correct,
      totalQuestions: total,
      scorePercent,
      difficulty: quiz.difficulty,
      completionTimeMs: behavior?.session?.totalDurationMs ?? null,
      previousScorePercent: prevPercent,
      improvement: prevPercent == null ? null : scorePercent - prevPercent,
    };

    const strengths = conceptMastery.strong.map((c) => `Consistently correct on ${c.label} (${c.mastery}% estimated mastery)`);
    const weaknesses = conceptMastery.needsAttention.map((c) => `Repeated errors on ${c.label} (${c.mastery}% estimated mastery)`);

    // What GenLearn will do next — read from the persisted blueprint/decision.
    const nextPlan = await this.buildNextPlanSummary(studentId, humanize);

    return {
      status: 'ready' as const,
      performance,
      conceptMastery,
      strengths,
      weaknesses,
      behavioralObservations,
      possibleMisconceptions,
      nextPlan,
    };
  }

  /** Turn engineered behavior features into student-friendly observations. */
  private deriveObservations(
    behavior: BehaviorFeaturesDocument | null,
    questionCount: number,
  ): string[] {
    if (!behavior?.session) return [];
    const s = behavior.session;
    const out: string[] = [];

    if (s.totalAnswerChanges >= 3) {
      out.push(`You changed your answer on several questions, which suggests some uncertainty while deciding.`);
    }
    const fastAndConfident = (behavior.perQuestion ?? []).filter(
      (q) => q.answerChanges === 0 && q.timeToFirstAnswerMs != null && q.timeToFirstAnswerMs < 8000,
    ).length;
    if (fastAndConfident >= Math.ceil(questionCount / 2)) {
      out.push(`You answered most questions quickly and without second-guessing — a sign of fluent recall.`);
    }
    if (s.avgDwellMs > 45000) {
      out.push(`You spent longer than a typical pace on each question, taking time to reason it through.`);
    }
    if (s.totalTabSwitches > 0) {
      out.push(`You left the quiz tab ${s.totalTabSwitches} time${s.totalTabSwitches > 1 ? 's' : ''} — answers given right after are weighted more cautiously by the model.`);
    }
    if (s.abandoned) {
      out.push(`The quiz was left before completion, so this evidence is treated as partial.`);
    }
    return out;
  }

  /** Human-readable "next quiz will…" bullets from the pending blueprint. */
  private async buildNextPlanSummary(studentId: string, humanize: (id: string) => string) {
    const plan = await this.getNextQuizPlan(studentId);
    if (!plan || !plan.blueprint) return { available: false as const, bullets: [] as string[] };

    const bp = plan.blueprint;
    const bullets: string[] = [];
    const focus = Object.entries(bp.targetConceptDistribution ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => humanize(c));
    if (focus.length) bullets.push(`focus more on ${focus.slice(0, 3).join(', ')}`);
    if (bp.misconceptionsToProbe?.length) {
      bullets.push(`directly probe the ${bp.misconceptionsToProbe.map(humanize).join(', ')} misconception`);
    }
    if (bp.conceptsToReduce?.length) {
      bullets.push(`reduce questions on ${bp.conceptsToReduce.map(humanize).slice(0, 3).join(', ')}, which you've already shown strongly`);
    }
    bullets.push(`stay near ${bp.difficulty} difficulty until the weak areas are resolved`);

    return {
      available: true as const,
      purpose: bp.purpose,
      difficulty: bp.difficulty,
      focusConcepts: focus.slice(0, 3),
      bullets,
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
        {
          answerChanges: q.answerChanges,
          timeToFirstAnswerMs: q.timeToFirstAnswerMs,
          idleMs: q.idleMs,
          answeredAfterTabSwitch: q.answeredAfterTabSwitch === true,
        },
      ]),
    );
    const questionById = new Map(quiz.questions.map((q) => [q.questionId, q]));

    // Post-update snapshot per touched concept — the policy's input.
    const touched = new Map<string, ConceptSnapshot>();
    // Concept mastery *before* this session, captured on first sight, so the
    // profile can record trends and per-concept improvement/decline.
    const conceptBefore = new Map<string, number>();
    const now = new Date();

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
        if (!conceptBefore.has(conceptId)) conceptBefore.set(conceptId, current.mastery);
        const result = updateConceptEvidence(
          { mastery: current.mastery, confidence: current.confidence, evidenceCount: current.evidenceCount },
          {
            correct: answer.isCorrect,
            isPrimary,
            behavior: signal,
            expectedTimeMs: question.expectedSeconds != null ? question.expectedSeconds * 1000 : null,
          },
        );
        const flagged = result.misconception && isPrimary;
        // Concept-level intelligence: trend vs. the mastery at session start,
        // review priority for future retention scheduling, freshly-practiced stamp.
        const trend = computeConceptTrend(conceptBefore.get(conceptId) ?? current.mastery, result.mastery);
        const reviewPriority = computeReviewPriority(result.mastery, result.confidence, now, now);
        await this.repository.applyEvidence(
          studentId,
          conceptId,
          { mastery: result.mastery, confidence: result.confidence, evidenceCount: result.evidenceCount },
          flagged ? { quizId, questionId: answer.questionId, flaggedAt: new Date() } : null,
          { trend, lastPracticedAt: now, reviewPriority, masterySample: { mastery: result.mastery, at: now } },
        );

        const prev = touched.get(conceptId);
        touched.set(conceptId, {
          conceptId,
          topic,
          mastery: result.mastery,
          confidence: result.confidence,
          hasRecentMisconception: (prev?.hasRecentMisconception ?? false) || flagged,
          integritySuspect: (prev?.integritySuspect ?? false) || result.integritySuspect,
        });
      }
    }

    this.logger.log(`Learner model updated from quiz ${quizId} (${quiz.answers.length} answers)`);

    const assessedIntervention = await this.measureInterventionEffectiveness(studentId, quizId, touched);
    const decision = await this.recordDecision(studentId, quizId, [...touched.values()]);

    // Fold this session into the persistent learner profile (Sprint 2).
    // Best-effort: a profile failure must never break the learner-model update.
    try {
      const correct = quiz.answers.filter((a) => a.isCorrect).length;
      const scorePercent = Math.round((correct / quiz.answers.length) * 100);
      const conceptChanges: ConceptChange[] = [...touched.values()].map((snap) => {
        const before = conceptBefore.get(snap.conceptId) ?? snap.mastery;
        return {
          conceptId: snap.conceptId,
          topic: snap.topic,
          before,
          after: snap.mastery,
          trend: computeConceptTrend(before, snap.mastery),
          misconception: snap.hasRecentMisconception,
        };
      });
      const answerChanges = (behavior?.perQuestion ?? []).reduce((s, q) => s + (q.answerChanges ?? 0), 0);
      const tabSwitches = (behavior?.perQuestion ?? []).filter((q) => q.answeredAfterTabSwitch === true).length;

      await this.learnerProfile.updateAfterQuiz(studentId, {
        quizId,
        topic: quiz.topic,
        adaptive: quiz.adaptive === true,
        scorePercent,
        conceptChanges,
        behavior: { answerChanges, tabSwitches },
        assessedIntervention,
        nextRecommendation: decision
          ? `${decision.trigger} → ${decision.action} on ${decision.conceptId} (${decision.difficulty})`
          : null,
      });
    } catch (err) {
      this.logger.warn(`Profile update failed for quiz ${quizId}: ${(err as Error).message}`);
    }

    // Autonomous Learning Planner: regenerate the single active plan so the
    // "Continue Learning" action always has the next session ready (Sprint 3).
    // Best-effort — never let planning break the learner-model update.
    try {
      await this.planner.regenerate(studentId);
    } catch (err) {
      this.logger.warn(`Planner regeneration failed for ${studentId}: ${(err as Error).message}`);
    }
  }

  /**
   * Closes the effectiveness loop: if fresh quiz evidence (from a different
   * quiz than the one that triggered it) touched the pending recommendation's
   * concept, the intervention is considered assessed — record mastery-after
   * so the before/after delta measures whether it actually helped.
   */
  private async measureInterventionEffectiveness(
    studentId: string,
    quizId: string,
    touched: Map<string, ConceptSnapshot>,
  ): Promise<{ type: string; masteryDelta: number } | null> {
    const pending = await this.repository.findPendingDecision(studentId);
    if (!pending || pending.sourceQuizId === quizId) return null;

    const snapshot = touched.get(pending.conceptId);
    if (!snapshot) return null;

    await this.repository.completeDecision(pending.decisionId, snapshot.mastery);
    const masteryDelta = snapshot.mastery - pending.masteryBefore;
    this.logger.log(
      `Intervention assessed for ${studentId}: "${pending.conceptId}" ${pending.masteryBefore} → ${snapshot.mastery} ` +
      `(${pending.trigger}/${pending.action}, Δ${masteryDelta})`,
    );
    // Feeds the profile's per-intervention-type effectiveness rollup. Credits
    // the EIIE's actual selection when present; legacy decisions fall back to
    // the coarse lesson/quiz action.
    return { type: pending.selectedIntervention ?? pending.action, masteryDelta };
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
  ): Promise<PolicyDecision | null> {
    const decision = decideNextActivity(touched);
    if (!decision) return null;

    const pending = await this.repository.findPendingDecision(studentId);
    if (pending) {
      const supersede =
        decision.trigger === DecisionTrigger.MISCONCEPTION && pending.trigger !== DecisionTrigger.MISCONCEPTION;
      if (!supersede) return null;
      await this.repository.dismissDecision(pending.decisionId);
    }

    // Derive the structured blueprint now so it's persisted alongside the
    // decision — the next adaptive quiz is generated from this, and the UI
    // explains "what GenLearn will do next" from its reason codes.
    const blueprint = buildQuizBlueprint(decision, touched);

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
      blueprint: blueprint as unknown as Record<string, unknown>,
      reasonCodes: blueprint.reasonCodes,
    });

    this.logger.log(
      `Pedagogical decision for ${studentId}: ${decision.trigger} → ${decision.action} on "${decision.conceptId}" (${decision.difficulty})`,
    );
    return decision;
  }
}
