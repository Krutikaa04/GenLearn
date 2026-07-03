import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { LearningEvent, LearningEventDocument } from '../schemas/learning-event.schema';

export const TELEMETRY_INGESTION_QUEUE = 'telemetry-ingestion';

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
    }
  }
}
