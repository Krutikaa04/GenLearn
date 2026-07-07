import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { isFeatureEnabled } from '../../common/feature-flags';
import { IngestEventsDto } from './dto/ingest-events.dto';
import { TELEMETRY_INGESTION_QUEUE, TelemetryIngestionJob } from './workers/telemetry-ingestion.processor';

/** Redis-down protection: BullMQ queues commands indefinitely during a
 * reconnect, so an unguarded add() would hang the request instead of
 * degrading. Past this deadline the batch is dropped (client never retries). */
const ENQUEUE_TIMEOUT_MS = 2_000;

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(TELEMETRY_INGESTION_QUEUE) private readonly ingestionQueue: Queue,
  ) {}

  /**
   * Accepts a batch of behavior events. Never throws: telemetry failures must
   * never surface to the learner. Returns the number of events accepted
   * (0 when the flag is off or enqueueing fails — the client doesn't retry).
   */
  async ingest(studentId: string, dto: IngestEventsDto): Promise<number> {
    if (!isFeatureEnabled(this.configService, 'BEHAVIOR_TELEMETRY_ENABLED')) {
      return 0;
    }

    const jobData: TelemetryIngestionJob = {
      studentId,
      sessionId: dto.sessionId,
      quizId: dto.quizId ?? null,
      events: dto.events,
    };

    try {
      const enqueue = this.ingestionQueue.add('ingest', jobData, {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 500,
        removeOnFail: 500,
      });
      const timeout = new Promise<never>((_, reject) => {
        const t = setTimeout(() => reject(new Error('enqueue timed out')), ENQUEUE_TIMEOUT_MS);
        // don't hold the event loop open for the timer alone
        if (typeof t === 'object' && 'unref' in t) t.unref();
      });
      await Promise.race([enqueue, timeout]);
      return dto.events.length;
    } catch (err) {
      this.logger.warn(`Telemetry enqueue failed for student ${studentId}: ${(err as Error).message}`);
      return 0;
    }
  }
}
