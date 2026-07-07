import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConceptMastery, ConceptMasteryDocument, MisconceptionFlag } from './schemas/concept-mastery.schema';

@Injectable()
export class LearnerModelRepository {
  constructor(
    @InjectModel(ConceptMastery.name)
    private readonly masteryModel: Model<ConceptMasteryDocument>,
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
  ): Promise<void> {
    await this.masteryModel
      .updateOne(
        { studentId, conceptId },
        {
          $set: { ...update, lastEvidenceAt: new Date() },
          ...(misconceptionFlag ? { $push: { misconceptionFlags: { $each: [misconceptionFlag], $slice: -20 } } } : {}),
        },
        { upsert: true },
      )
      .exec();
  }
}
