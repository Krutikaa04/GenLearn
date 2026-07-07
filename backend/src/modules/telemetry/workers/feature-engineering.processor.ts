import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { LearningEvent, LearningEventDocument } from '../schemas/learning-event.schema';
import { BehaviorFeatures, BehaviorFeaturesDocument } from '../schemas/behavior-features.schema';
import { computeBehaviorFeatures } from '../feature-engineering';
import { isFeatureEnabled } from '../../../common/feature-flags';
import { LearnerModelService } from '../../learner-model/learner-model.service';

export const FEATURE_ENGINEERING_QUEUE = 'feature-engineering';

export interface FeatureEngineeringJob {
  studentId: string;
  sessionId: string;
  quizId: string | null;
}

@Processor(FEATURE_ENGINEERING_QUEUE)
export class FeatureEngineeringWorker extends WorkerHost {
  private readonly logger = new Logger(FeatureEngineeringWorker.name);

  constructor(
    @InjectModel(LearningEvent.name)
    private readonly eventModel: Model<LearningEventDocument>,
    @InjectModel(BehaviorFeatures.name)
    private readonly featuresModel: Model<BehaviorFeaturesDocument>,
    private readonly configService: ConfigService,
    private readonly learnerModel: LearnerModelService,
  ) {
    super();
  }

  async process(job: Job<FeatureEngineeringJob>): Promise<void> {
    const { studentId, sessionId, quizId } = job.data;

    const events = await this.eventModel
      .find({ studentId, sessionId })
      .select('type questionId clientTs data')
      .lean()
      .exec();

    if (events.length === 0) {
      this.logger.warn(`No events found for session ${sessionId} — skipping feature computation`);
      return;
    }

    const features = computeBehaviorFeatures(events);

    // Upsert keyed by session so re-runs (trailing batches, retries) are idempotent
    await this.featuresModel.updateOne(
      { sessionId },
      { $set: { studentId, quizId: quizId ?? null, perQuestion: features.perQuestion, session: features.session } },
      { upsert: true },
    ).exec();

    this.logger.log(
      `Behavior features computed for session ${sessionId}: ${features.perQuestion.length} questions, ` +
      `${features.session.totalAnswerChanges} answer changes, abandoned=${features.session.abandoned}`,
    );

    // Feed the learner model once behavior evidence is ready. Flag-gated and
    // best-effort: a learner-model failure never fails feature computation.
    if (
      quizId &&
      !features.session.abandoned &&
      isFeatureEnabled(this.configService, 'ADAPTIVE_LEARNING_ENABLED')
    ) {
      try {
        await this.learnerModel.updateFromQuizSubmission(studentId, quizId, features);
      } catch (err) {
        this.logger.warn(`Learner-model update failed for quiz ${quizId}: ${(err as Error).message}`);
      }
    }
  }
}
