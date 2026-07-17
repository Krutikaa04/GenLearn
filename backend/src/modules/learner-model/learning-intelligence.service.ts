import { Injectable, Logger } from '@nestjs/common';
import { LearnerModelRepository } from './learner-model.repository';
import { LearnerProfileRepository } from './learner-profile.repository';
import { LearnerProfileService } from './learner-profile.service';
import {
  buildCoachSummary,
  buildWeeklySummary,
  ConceptSignal,
  forecastRevision,
  generateInsights,
  predictFutureLearning,
} from './learning-prediction';

/**
 * Learning Intelligence & Prediction System (LIPS) — the single read/compose
 * layer that turns already-stored learner data into concept progress, a
 * timeline, revision forecasts, next-milestone predictions, AI coaching,
 * weekly summaries, and evidence-based insights. It owns no storage: every
 * output is derived from ConceptMastery, the persistent profile, and the
 * learning timeline via the pure functions in learning-prediction.ts.
 */
@Injectable()
export class LearningIntelligenceService {
  private readonly logger = new Logger(LearningIntelligenceService.name);

  constructor(
    private readonly learnerRepo: LearnerModelRepository,
    private readonly profileRepo: LearnerProfileRepository,
    private readonly profileService: LearnerProfileService,
  ) {}

  private async loadConcepts(studentId: string): Promise<ConceptSignal[]> {
    const rows = await this.learnerRepo.findByStudent(studentId);
    return rows.map((m) => ({
      conceptId: m.conceptId,
      topic: null,
      mastery: m.mastery,
      confidence: m.confidence,
      evidenceCount: m.evidenceCount,
      trend: m.trend ?? 'new',
      lastPracticedAt: m.lastPracticedAt ?? m.lastEvidenceAt ?? null,
      reviewPriority: m.reviewPriority ?? 0,
    }));
  }

  /** Task 1: concept-level progress view (mastery/confidence/trend/last-practiced/priority). */
  async getConceptProgress(studentId: string) {
    const rows = await this.learnerRepo.findByStudent(studentId);
    return rows
      .map((m) => ({
        conceptId: m.conceptId,
        label: m.conceptId.replace(/-/g, ' '),
        mastery: Math.round(m.mastery),
        confidence: Math.round(m.confidence * 100) / 100,
        trend: m.trend ?? 'new',
        evidenceCount: m.evidenceCount,
        lastPracticedAt: m.lastPracticedAt ?? m.lastEvidenceAt ?? null,
        reviewPriority: m.reviewPriority ?? 0,
      }))
      .sort((a, b) => a.mastery - b.mastery);
  }

  /** Task 2: chronological learning timeline (reuses the stored timeline). */
  async getTimeline(studentId: string, limit = 50) {
    const events = await this.profileRepo.listTimeline(studentId, limit);
    return events.map((e) => ({
      type: e.type,
      topic: e.topic,
      conceptIds: e.conceptIds,
      summary: e.summary,
      occurredAt: e.occurredAt,
    }));
  }

  /** Task 3: revision forecast (immediate / soon / safe). */
  async getRevisionForecast(studentId: string) {
    const concepts = await this.loadConcepts(studentId);
    return forecastRevision(concepts);
  }

  /** Task 7: future learning prediction. */
  async getPrediction(studentId: string) {
    const concepts = await this.loadConcepts(studentId);
    return predictFutureLearning(concepts);
  }

  /** Task 6: evidence-based insights. */
  async getInsights(studentId: string) {
    const [concepts, profile] = await Promise.all([
      this.loadConcepts(studentId),
      this.profileService.getProfile(studentId).catch(() => null),
    ]);
    return generateInsights({
      concepts,
      preferredIntervention: (profile?.preferences as { preferredIntervention?: string })?.preferredIntervention ?? null,
      supportScore: Number((profile?.supportDependency as Record<string, unknown>)?.score ?? 0),
    });
  }

  /** Task 4: concise AI coach summary. */
  async getCoachSummary(studentId: string) {
    const concepts = await this.loadConcepts(studentId);
    const revision = forecastRevision(concepts);
    const prediction = predictFutureLearning(concepts);
    return buildCoachSummary(concepts, revision, prediction);
  }

  /** Task 5: weekly learning summary. */
  async getWeeklySummary(studentId: string) {
    const [concepts, events] = await Promise.all([
      this.loadConcepts(studentId),
      this.profileRepo.listTimeline(studentId, 300),
    ]);
    const revision = forecastRevision(concepts);
    return buildWeeklySummary(events, concepts, revision);
  }

  /**
   * Task 9: compact prediction + coaching bundle the Cognitive Engine attaches
   * to learner context so future plan generation is prediction-aware. Read-only
   * and defensive; null when the learner has no concept history yet.
   */
  async getPredictionSummary(studentId: string): Promise<Record<string, unknown> | null> {
    const concepts = await this.loadConcepts(studentId);
    if (!concepts.length) return null;
    const revision = forecastRevision(concepts);
    const prediction = predictFutureLearning(concepts);
    return {
      nextMilestone: prediction.nextMilestone,
      nextConcept: prediction.nextConcept,
      readyToAdvance: prediction.readyToAdvance,
      likelyToForget: prediction.likelyToForget,
      revisionDue: revision.immediate.length + revision.soon.length,
    };
  }
}
