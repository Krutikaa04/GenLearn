import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LearnerProfile, LearnerProfileDocument } from './schemas/learner-profile.schema';
import {
  LearnerTimelineEvent,
  LearnerTimelineEventDocument,
} from './schemas/learner-timeline-event.schema';

const MAX_REFLECTIONS = 20;

@Injectable()
export class LearnerProfileRepository {
  constructor(
    @InjectModel(LearnerProfile.name)
    private readonly profileModel: Model<LearnerProfileDocument>,
    @InjectModel(LearnerTimelineEvent.name)
    private readonly timelineModel: Model<LearnerTimelineEventDocument>,
  ) {}

  /** The single profile per learner, created lazily on first access. Never recreated. */
  async findOrCreate(studentId: string): Promise<LearnerProfileDocument> {
    return this.profileModel
      .findOneAndUpdate(
        { studentId },
        { $setOnInsert: { studentId } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec() as Promise<LearnerProfileDocument>;
  }

  async find(studentId: string): Promise<LearnerProfileDocument | null> {
    return this.profileModel.findOne({ studentId }).lean<LearnerProfileDocument>().exec();
  }

  /**
   * Merge a computed intelligence snapshot into the profile ($set only — the
   * document evolves, it is never replaced). A new reflection is pushed onto the
   * capped reflections array in the same write.
   */
  async applySnapshot(
    studentId: string,
    snapshot: Partial<LearnerProfile>,
    reflection?: LearnerProfile['reflections'][number] | null,
  ): Promise<void> {
    const update: Record<string, unknown> = { $set: { ...snapshot } };
    if (reflection) {
      update.$push = { reflections: { $each: [reflection], $slice: -MAX_REFLECTIONS } };
    }
    await this.profileModel.updateOne({ studentId }, update, { upsert: true }).exec();
  }

  async appendTimelineEvents(events: LearnerTimelineEvent[]): Promise<void> {
    if (!events.length) return;
    await this.timelineModel.insertMany(events, { ordered: false }).catch(() => undefined);
  }

  async listTimeline(studentId: string, limit = 50): Promise<LearnerTimelineEventDocument[]> {
    return this.timelineModel
      .find({ studentId })
      .sort({ occurredAt: -1 })
      .limit(limit)
      .lean<LearnerTimelineEventDocument[]>()
      .exec();
  }
}
