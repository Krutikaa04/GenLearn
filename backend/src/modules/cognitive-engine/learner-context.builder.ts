import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ConceptMastery,
  ConceptMasteryDocument,
} from '../learner-model/schemas/concept-mastery.schema';
import { LearnerProfileService } from '../learner-model/learner-profile.service';
import { AutonomousPlannerService } from '../learner-model/autonomous-planner.service';
import { ConceptStanding, LearnerContext } from './ai-task.types';

const WEAK_MAX = 50;
const STRONG_MIN = 80;
const MAX_CONCEPTS_PER_BAND = 8;

/**
 * The single place learner context is assembled for AI requests. Reads the
 * concept-mastery model directly (no coupling to LearnerModelService) and
 * distils it into weak/strong bands the prompt layer can use. Defensive by
 * design: any failure yields an empty-but-valid context so an AI workflow is
 * never blocked by a context-assembly problem.
 */
@Injectable()
export class LearnerContextBuilder {
  private readonly logger = new Logger(LearnerContextBuilder.name);

  constructor(
    @InjectModel(ConceptMastery.name)
    private readonly masteryModel: Model<ConceptMasteryDocument>,
    private readonly profileService: LearnerProfileService,
    private readonly planner: AutonomousPlannerService,
  ) {}

  async build(studentId: string): Promise<LearnerContext> {
    const empty = this.emptyContext(studentId);
    if (!studentId) return empty;

    // Persistent Learner Intelligence + the active Learning Plan. Both are
    // read-only here and defensive (null on failure) so context assembly never
    // blocks a generation task.
    const [profile, plan] = await Promise.all([
      this.profileService.buildIntelligenceContext(studentId).catch((err) => {
        this.logger.warn(`Profile context failed for ${studentId}: ${(err as Error).message}`);
        return null;
      }),
      this.planner.getPlanSummary(studentId).catch((err) => {
        this.logger.warn(`Plan context failed for ${studentId}: ${(err as Error).message}`);
        return null;
      }),
    ]);

    let rows: ConceptMasteryDocument[] = [];
    try {
      rows = await this.masteryModel.find({ studentId }).lean<ConceptMasteryDocument[]>().exec();
    } catch (err) {
      this.logger.warn(`Context assembly failed for ${studentId}: ${(err as Error).message}`);
      return { ...empty, profile, plan };
    }

    if (!rows.length) return { ...empty, profile, plan };

    const standing = (m: ConceptMasteryDocument): ConceptStanding => ({
      conceptId: m.conceptId,
      mastery: Math.round(m.mastery),
      confidence: Math.round(m.confidence * 100) / 100,
    });

    const weakConcepts = rows
      .filter((m) => m.mastery < WEAK_MAX)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, MAX_CONCEPTS_PER_BAND)
      .map(standing);

    const strongConcepts = rows
      .filter((m) => m.mastery >= STRONG_MIN)
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, MAX_CONCEPTS_PER_BAND)
      .map(standing);

    const masteryByConcept: Record<string, number> = {};
    let evidenceCount = 0;
    for (const m of rows) {
      masteryByConcept[m.conceptId] = Math.round(m.mastery);
      evidenceCount += m.evidenceCount ?? 0;
    }

    return {
      studentId,
      weakConcepts,
      strongConcepts,
      masteryByConcept,
      evidenceCount,
      hasHistory: true,
      assembledAt: new Date().toISOString(),
      profile,
      plan,
    };
  }

  private emptyContext(studentId: string): LearnerContext {
    return {
      studentId,
      weakConcepts: [],
      strongConcepts: [],
      masteryByConcept: {},
      evidenceCount: 0,
      hasHistory: false,
      assembledAt: new Date().toISOString(),
      profile: null,
      plan: null,
    };
  }
}
