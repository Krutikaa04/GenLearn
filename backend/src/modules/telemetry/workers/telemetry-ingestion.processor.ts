import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job, Queue } from 'bullmq';
import { Model } from 'mongoose';
import { LearningEvent, LearningEventDocument } from '../schemas/learning-event.schema';
import { FEATURE_ENGINEERING_QUEUE, FeatureEngineeringJob } from './feature-engineering.processor';

export const TELEMETRY_INGESTION_QUEUE = 'telemetry-ingestion';

/** Delay before computing features so trailing event batches can land first. */
const FEATURE_JOB_DELAY_MS = 10_000;

const SESSION_TERMINAL_EVENTS = new Set(['QUIZ_SUBMITTED', 'QUIZ_ABANDONED']);

export interface TelemetryIngestionJob {
  studentId: string;
  sessionId: string;
  quizId: string | null;
  events: { type: string; ts: number; questionId?: string; data?: Record<string, unknown> }[];
}

@Processor(TELEMETRY_INGESTION_QUEUE)
export class TelemetryIngestionWorker extends WorkerHost {
  private readonly logger = new Logger(TelemetryIngestionWorker.name);

  constructor(
    @InjectModel(LearningEvent.name)
    private readonly eventModel: Model<LearningEventDocument>,
    @InjectQueue(FEATURE_ENGINEERING_QUEUE)
    private readonly featureQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<TelemetryIngestionJob>): Promise<void> {
    const { studentId, sessionId, quizId, events } = job.data;
    try {
      await this.eventModel.insertMany(
        events.map((e) => ({
          studentId,
          sessionId,
          quizId: quizId ?? null,
          type: e.type,
          questionId: e.questionId ?? null,
          data: e.data ?? null,
          clientTs: new Date(e.ts),
        })),
        { ordered: false },
      );
    } catch (err) {
      // Telemetry is best-effort evidence — log and move on, never crash the worker
      this.logger.warn(`Failed to persist ${events.length} events for session ${sessionId}: ${(err as Error).message}`);
      return;
    }

    // A terminal event means the session is (about to be) complete — schedule
    // feature engineering after a short delay so trailing batches land first.
    // The session-scoped jobId dedupes repeated triggers for the same session.
    if (events.some((e) => SESSION_TERMINAL_EVENTS.has(e.type))) {
      const featureJob: FeatureEngineeringJob = { studentId, sessionId, quizId: quizId ?? null };
      try {
        await this.featureQueue.add('compute', featureJob, {
          jobId: `features-${sessionId}`,
          delay: FEATURE_JOB_DELAY_MS,
          attempts: 2,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 500,
          removeOnFail: 500,
        });
      } catch (err) {
        this.logger.warn(`Failed to schedule feature engineering for session ${sessionId}: ${(err as Error).message}`);
      }
    }
  }
}
