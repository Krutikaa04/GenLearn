import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConceptMastery, ConceptMasteryDocument, MisconceptionFlag } from './schemas/concept-mastery.schema';
import {
  DecisionStatus,
  PedagogicalDecision,
  PedagogicalDecisionDocument,
} from './schemas/pedagogical-decision.schema';

@Injectable()
export class LearnerModelRepository {
  constructor(
    @InjectModel(ConceptMastery.name)
    private readonly masteryModel: Model<ConceptMasteryDocument>,
    @InjectModel(PedagogicalDecision.name)
    private readonly decisionModel: Model<PedagogicalDecisionDocument>,
  ) {}

  async findOrCreate(studentId: string, conceptId: string): Promise<ConceptMasteryDocument> {
    return this.masteryModel
      .findOneAndUpdate(
        { studentId, conceptId },
        { $setOnInsert: { mastery: 0, confidence: 0, evidenceCount: 0, lastEvidenceAt: null, misconceptionFlags: [] } },
        { upsert: true, new: true },
      )
      .exec() as Promise<ConceptMasteryDocument>;
  }

  async findByStudent(studentId: string): Promise<ConceptMasteryDocument[]> {
    return this.masteryModel.find({ studentId }).sort({ mastery: 1 }).exec();
  }

  async applyEvidence(
    studentId: string,
    conceptId: string,
    update: { mastery: number; confidence: number; evidenceCount: number },
    misconceptionFlag: MisconceptionFlag | null,
    intelligence?: {
      trend: 'new' | 'improving' | 'declining' | 'stable';
      lastPracticedAt: Date;
      reviewPriority: number;
      masterySample: { mastery: number; at: Date };
    },
  ): Promise<void> {
    // masteryHistory (capped) and misconceptionFlags (capped) can both be
    // pushed in one write; merge them into a single $push so Mongo accepts it.
    const push: Record<string, unknown> = {};
    if (misconceptionFlag) push.misconceptionFlags = { $each: [misconceptionFlag], $slice: -20 };
    if (intelligence) push.masteryHistory = { $each: [intelligence.masterySample], $slice: -30 };

    await this.masteryModel
      .updateOne(
        { studentId, conceptId },
        {
          $set: {
            ...update,
            lastEvidenceAt: new Date(),
            ...(intelligence
              ? {
                  trend: intelligence.trend,
                  lastPracticedAt: intelligence.lastPracticedAt,
                  reviewPriority: intelligence.reviewPriority,
                }
              : {}),
          },
          ...(Object.keys(push).length ? { $push: push } : {}),
        },
        { upsert: true },
      )
      .exec();
  }

  async findPendingDecision(studentId: string): Promise<PedagogicalDecisionDocument | null> {
    return this.decisionModel
      .findOne({ studentId, status: DecisionStatus.PENDING })
      .sort({ createdAt: -1 })
      .exec();
  }

  async createDecision(decision: Partial<PedagogicalDecision>): Promise<PedagogicalDecisionDocument> {
    return this.decisionModel.create(decision);
  }

  async dismissDecision(decisionId: string): Promise<void> {
    await this.decisionModel
      .updateOne({ decisionId }, { $set: { status: DecisionStatus.DISMISSED } })
      .exec();
  }

  async completeDecision(decisionId: string, masteryAfter: number): Promise<void> {
    await this.decisionModel
      .updateOne({ decisionId }, { $set: { status: DecisionStatus.COMPLETED, masteryAfter } })
      .exec();
  }

  /** Link a generated adaptive quiz back to the decision that produced it. */
  async markGenerated(decisionId: string, generatedActivityId: string): Promise<void> {
    await this.decisionModel
      .updateOne({ decisionId }, { $set: { generatedActivityId } })
      .exec();
  }

  /** Record the EIIE's selected intervention so effectiveness credits it. */
  async markInterventionSelected(decisionId: string, selectedIntervention: string): Promise<void> {
    await this.decisionModel
      .updateOne({ decisionId }, { $set: { selectedIntervention } })
      .exec();
  }
}
