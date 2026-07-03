import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { LearningEvent, LearningEventSchema } from './schemas/learning-event.schema';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryIngestionWorker, TELEMETRY_INGESTION_QUEUE } from './workers/telemetry-ingestion.processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LearningEvent.name, schema: LearningEventSchema }]),
    BullModule.registerQueue({ name: TELEMETRY_INGESTION_QUEUE }),
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryIngestionWorker],
  exports: [TelemetryService],
})
export class TelemetryModule {}
