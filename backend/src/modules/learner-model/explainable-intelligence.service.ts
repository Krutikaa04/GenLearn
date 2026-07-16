import { Injectable, Logger } from '@nestjs/common';
import { LearnerModelRepository } from './learner-model.repository';
import { LearnerProfileService } from './learner-profile.service';
import {
  buildExplanation,
  Explanation,
  InterventionEvidence,
  InterventionType,
  selectIntervention,
} from './intervention-engine';

export interface ExplainedRecommendation {
  intervention: InterventionType;
  reasonCodes: string[];
  explanation: Explanation;
}

/**
 * The single Explainability + Intervention authority (Sprint 4). Reads existing
 * intelligence only — the pending pedagogical decision, the concept's mastery
 * state, and the persistent profile's intervention-effectiveness history — and
 * returns one explained, evidence-based recommendation. Business modules and
 * the UI consume this; none of them select interventions or write explanations
 * themselves.
 */
@Injectable()
export class ExplainableIntelligenceService {
  private readonly logger = new Logger(ExplainableIntelligenceService.name);

  constructor(
    private readonly learnerRepo: LearnerModelRepository,
    private readonly profileService: LearnerProfileService,
  ) {}

  /**
   * The explained recommendation for the learner's pending decision, or null
   * when there is nothing pending. Defensive: profile gaps degrade to neutral
   * evidence rather than blocking the recommendation.
   */
  async getExplainedRecommendation(studentId: string): Promise<ExplainedRecommendation | null> {
    const pending = await this.learnerRepo.findPendingDecision(studentId);
    if (!pending) return null;

    const [concept, profile] = await Promise.all([
      this.learnerRepo.findOrCreate(studentId, pending.conceptId),
      this.profileService.getProfile(studentId).catch(() => null),
    ]);

    const evidence: InterventionEvidence = {
      conceptId: pending.conceptId,
      topic: pending.topic,
      trigger: pending.trigger,
      defaultAction: pending.action,
      mastery: concept.mastery,
      confidence: concept.confidence,
      evidenceCount: concept.evidenceCount,
      trend: concept.trend ?? 'new',
      effectiveness:
        (profile?.interventionEffectiveness as unknown as InterventionEvidence['effectiveness']) ?? {},
      supportScore: Number((profile?.supportDependency as Record<string, unknown>)?.score ?? 0),
    };

    const selected = selectIntervention(evidence);
    const explanation = buildExplanation(evidence, selected);

    // Persist the selection so effectiveness measurement credits the actual
    // intervention type (Task 4 loop closure). Best-effort, idempotent.
    if (pending.selectedIntervention !== selected.type) {
      await this.learnerRepo
        .markInterventionSelected(pending.decisionId, selected.type)
        .catch(() => undefined);
    }

    this.logger.log(
      `Explained recommendation for ${studentId}: ${selected.type} on "${pending.conceptId}" ` +
        `(${explanation.confidence} confidence; ${selected.reasonCodes.join(',')})`,
    );

    return { intervention: selected.type, reasonCodes: selected.reasonCodes, explanation };
  }

  /** Compact bundle for the Cognitive Engine's learner context (Task 8). */
  async getRecommendationSummary(studentId: string): Promise<Record<string, unknown> | null> {
    const rec = await this.getExplainedRecommendation(studentId);
    if (!rec) return null;
    return {
      intervention: rec.intervention,
      recommendation: rec.explanation.recommendation,
      expectedOutcome: rec.explanation.expectedOutcome,
      confidence: rec.explanation.confidence,
      reasonCodes: rec.reasonCodes,
    };
  }
}
