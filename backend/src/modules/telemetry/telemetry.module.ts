import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { LearningEvent, LearningEventSchema } from './schemas/learning-event.schema';
import { BehaviorFeatures, BehaviorFeaturesSchema } from './schemas/behavior-features.schema';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryIngestionWorker, TELEMETRY_INGESTION_QUEUE } from './workers/telemetry-ingestion.processor';
import { FeatureEngineeringWorker, FEATURE_ENGINEERING_QUEUE } from './workers/feature-engineering.processor';
import { LearnerModelModule } from '../learner-model/learner-model.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearningEvent.name, schema: LearningEventSchema },
      { name: BehaviorFeatures.name, schema: BehaviorFeaturesSchema },
    ]),
    BullModule.registerQueue({ name: TELEMETRY_INGESTION_QUEUE }),
    BullModule.registerQueue({ name: FEATURE_ENGINEERING_QUEUE }),
    LearnerModelModule,
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryIngestionWorker, FeatureEngineeringWorker],
  exports: [TelemetryService],
})
export class TelemetryModule {}
