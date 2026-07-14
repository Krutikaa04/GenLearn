import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LearnerProfileRepository } from './learner-profile.repository';
import { LearnerModelRepository } from './learner-model.repository';
import {
  LearnerProfile,
  LearnerReflection,
} from './schemas/learner-profile.schema';
import {
  LearnerTimelineEvent,
  TimelineEventType,
} from './schemas/learner-timeline-event.schema';
import {
  ConceptState,
  computeVelocity,
  computeSupportDependency,
  deriveIdentity,
  deriveLearningStage,
  foldInterventionOutcome,
  inferPreferences,
  summariseTrends,
  InterventionEffectMap,
} from './learner-intelligence';

/** One concept's before/after movement in a completed session. */
export interface ConceptChange {
  conceptId: string;
  topic: string | null;
  before: number;
  after: number;
  trend: 'new' | 'improving' | 'declining' | 'stable';
  misconception: boolean;
}

/** Everything a completed quiz session contributes to the persistent profile. */
export interface ProfileUpdateSession {
  quizId: string;
  topic: string;
  adaptive: boolean;
  scorePercent: number;
  conceptChanges: ConceptChange[];
  behavior: { answerChanges: number; tabSwitches: number } | null;
  /** Set when this session assessed a prior recommendation (type = its action). */
  assessedIntervention?: { type: string; masteryDelta: number } | null;
  /** The forward-looking recommendation produced by this session, if any. */
  nextRecommendation?: string | null;
}

/**
 * Owns the persistent learner profile — the single evolving cognitive record
 * per learner. It never recreates the profile; each activity folds new evidence
 * into the existing document. Concept-level truth is read back from
 * ConceptMastery so the profile is always a faithful rollup, not a divergent copy.
 */
@Injectable()
export class LearnerProfileService {
  private readonly logger = new Logger(LearnerProfileService.name);

  constructor(
    private readonly profileRepo: LearnerProfileRepository,
    private readonly learnerRepo: LearnerModelRepository,
  ) {}

  async getProfile(studentId: string) {
    return this.profileRepo.find(studentId);
  }

  async getTimeline(studentId: string, limit = 50) {
    return this.profileRepo.listTimeline(studentId, limit);
  }

  /**
   * Compact intelligence bundle the Cognitive Engine attaches to every AI task.
   * Read-only and defensive — returns null when the learner has no profile yet.
   */
  async buildIntelligenceContext(studentId: string): Promise<Record<string, unknown> | null> {
    const profile = await this.profileRepo.find(studentId);
    if (!profile) return null;
    return {
      learningIdentity: profile.learningIdentity,
      learningStage: profile.learningStage,
      currentGoal: profile.currentGoal,
      velocity: profile.velocity,
      trends: profile.trends,
      supportDependency: profile.supportDependency,
      preferences: profile.preferences,
      interventionEffectiveness: profile.interventionEffectiveness,
      recentReflection: profile.reflections?.[profile.reflections.length - 1] ?? null,
      activeTopics: (profile.activeTopics ?? []).map((t) => t.topic),
    };
  }

  /**
   * Folds a completed quiz session into the persistent profile: recomputes
   * velocity/trends/support/preferences from current concept states, updates
   * intervention effectiveness, appends the learning timeline, and stores a
   * reflection. Best-effort by contract — the caller must not let a profile
   * failure break quiz submission.
   */
  async updateAfterQuiz(studentId: string, session: ProfileUpdateSession): Promise<void> {
    const now = new Date();

    const masteryRows = await this.learnerRepo.findByStudent(studentId);
    const concepts: ConceptState[] = masteryRows.map((m) => ({
      conceptId: m.conceptId,
      mastery: m.mastery,
      confidence: m.confidence,
      evidenceCount: m.evidenceCount,
      trend: m.trend,
      lastPracticedAt: m.lastPracticedAt,
    }));

    const existing = await this.profileRepo.find(studentId);

    const velocity = computeVelocity(concepts);
    const trends = summariseTrends(concepts);

    // ── Support dependency: accumulate session behaviour + count assistance ──
    const priorConsistency = (existing?.consistency ?? {}) as Record<string, number>;
    const totalAnswerChanges = (priorConsistency.totalAnswerChanges ?? 0) + (session.behavior?.answerChanges ?? 0);
    const totalTabSwitches = (priorConsistency.totalTabSwitches ?? 0) + (session.behavior?.tabSwitches ?? 0);
    const sessionsCount = (existing?.sessionsCount ?? 0) + 1;
    // Assistance reliance is counted from the learner's own timeline history.
    const timeline = await this.profileRepo.listTimeline(studentId, 200);
    const supportDependency = computeSupportDependency({
      answerChanges: totalAnswerChanges,
      tabSwitches: totalTabSwitches,
      tutorSessions: timeline.filter((e) => e.type === TimelineEventType.TUTOR_SESSION).length,
      flashcardSessions: timeline.filter((e) => e.type === TimelineEventType.FLASHCARDS_GENERATED).length,
      quizzes: sessionsCount,
    });

    // ── Intervention effectiveness (Task 5) ──
    const effectiveness: InterventionEffectMap = {
      ...(existing?.interventionEffectiveness as unknown as InterventionEffectMap),
    };
    if (session.assessedIntervention) {
      const { type, masteryDelta } = session.assessedIntervention;
      effectiveness[type] = foldInterventionOutcome(effectiveness[type], masteryDelta);
    }
    const preferences = inferPreferences(effectiveness);

    const stage = deriveLearningStage(velocity.conceptsTracked, velocity.avgMastery);
    const identity = deriveIdentity(velocity, trends, supportDependency);

    // ── Active topics: bump the topic this session touched ──
    const activeTopics = this.mergeActiveTopic(
      (existing?.activeTopics ?? []) as LearnerProfile['activeTopics'],
      session.topic,
      concepts.filter((c) => (c.topic ?? null) === session.topic).length,
      now,
    );

    const reflection = this.buildReflection(session, now);

    const snapshot: Partial<LearnerProfile> = {
      learningIdentity: identity,
      learningStage: stage,
      activeTopics,
      velocity: velocity as unknown as Record<string, unknown>,
      trends: trends as unknown as Record<string, unknown>,
      supportDependency: supportDependency as unknown as Record<string, unknown>,
      preferences: preferences as unknown as Record<string, unknown>,
      interventionEffectiveness: effectiveness as unknown as LearnerProfile['interventionEffectiveness'],
      consistency: {
        sessionsCount,
        totalAnswerChanges,
        totalTabSwitches,
        lastActivityAt: now,
      } as unknown as Record<string, unknown>,
      conceptsTracked: velocity.conceptsTracked,
      totalEvidence: concepts.reduce((s, c) => s + c.evidenceCount, 0),
      sessionsCount,
      lastActivityAt: now,
    };

    await this.profileRepo.findOrCreate(studentId);
    await this.profileRepo.applySnapshot(studentId, snapshot, reflection);
    await this.profileRepo.appendTimelineEvents(this.buildTimeline(studentId, session, now));

    this.logger.log(
      `Profile updated for ${studentId}: stage=${stage}, identity=${identity}, ` +
        `concepts=${velocity.conceptsTracked}, avgMastery=${velocity.avgMastery}`,
    );
  }

  /** Append a single semantic timeline event from any learning activity. */
  async recordTimelineEvent(
    studentId: string,
    type: TimelineEventType,
    fields: { topic?: string | null; conceptIds?: string[]; summary?: string | null; data?: Record<string, unknown> } = {},
  ): Promise<void> {
    await this.profileRepo.appendTimelineEvents([
      {
        eventId: uuidv4(),
        studentId,
        type,
        topic: fields.topic ?? null,
        conceptIds: fields.conceptIds ?? [],
        summary: fields.summary ?? null,
        data: fields.data ?? {},
        occurredAt: new Date(),
      },
    ]);
  }

  // ── helpers ──

  private mergeActiveTopic(
    existing: LearnerProfile['activeTopics'],
    topic: string,
    conceptCount: number,
    now: Date,
  ): LearnerProfile['activeTopics'] {
    const others = existing.filter((t) => t.topic !== topic);
    return [...others, { topic, conceptCount, lastActiveAt: now }].slice(-30);
  }

  private buildReflection(session: ProfileUpdateSession, now: Date): LearnerReflection {
    const improved = session.conceptChanges.filter((c) => c.after > c.before).map((c) => c.conceptId);
    const struggled = session.conceptChanges
      .filter((c) => c.after < c.before || c.misconception)
      .map((c) => c.conceptId);
    const behaviorSummary = session.behavior
      ? `${session.behavior.answerChanges} answer change(s), ${session.behavior.tabSwitches} tab switch(es); scored ${session.scorePercent}%`
      : `scored ${session.scorePercent}%`;
    return {
      sessionAt: now,
      improved,
      struggled,
      behaviorSummary,
      nextRecommendation: session.nextRecommendation ?? null,
    };
  }

  private buildTimeline(studentId: string, session: ProfileUpdateSession, now: Date): LearnerTimelineEvent[] {
    const events: LearnerTimelineEvent[] = [];
    const base = (type: TimelineEventType, extra: Partial<LearnerTimelineEvent>): LearnerTimelineEvent => ({
      eventId: uuidv4(),
      studentId,
      type,
      topic: session.topic,
      conceptIds: [],
      summary: null,
      data: {},
      occurredAt: now,
      ...extra,
    });

    events.push(
      base(session.adaptive ? TimelineEventType.ADAPTIVE_QUIZ : TimelineEventType.QUIZ_ATTEMPTED, {
        conceptIds: session.conceptChanges.map((c) => c.conceptId),
        summary: `Quiz on ${session.topic} — ${session.scorePercent}%`,
        data: { quizId: session.quizId, scorePercent: session.scorePercent },
      }),
    );

    for (const c of session.conceptChanges) {
      if (c.misconception) {
        events.push(base(TimelineEventType.MISCONCEPTION_DETECTED, { conceptIds: [c.conceptId], summary: `Possible misconception on ${c.conceptId}` }));
      } else if (c.after > c.before) {
        events.push(base(TimelineEventType.CONCEPT_IMPROVED, { conceptIds: [c.conceptId], summary: `${c.conceptId}: ${c.before}→${c.after}`, data: { before: c.before, after: c.after } }));
      } else if (c.after < c.before) {
        events.push(base(TimelineEventType.CONCEPT_DECLINED, { conceptIds: [c.conceptId], summary: `${c.conceptId}: ${c.before}→${c.after}`, data: { before: c.before, after: c.after } }));
      }
    }

    if (session.assessedIntervention) {
      events.push(base(TimelineEventType.INTERVENTION_ASSESSED, { summary: `${session.assessedIntervention.type} intervention Δ${session.assessedIntervention.masteryDelta}`, data: { ...session.assessedIntervention } }));
    }

    events.push(base(TimelineEventType.REFLECTION, { summary: session.nextRecommendation ?? 'Session reflected', data: { scorePercent: session.scorePercent } }));

    return events;
  }
}
