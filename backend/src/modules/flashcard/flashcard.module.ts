import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { FlashcardSet, FlashcardSetSchema } from './schemas/flashcard.schema';
import { FlashcardRepository } from './flashcard.repository';
import { FlashcardService } from './flashcard.service';
import { FlashcardController } from './flashcard.controller';
import { FlashcardGeneratorWorker, FLASHCARD_GENERATION_QUEUE } from './workers/flashcard-generator.processor';
import { CognitiveEngineModule } from '../cognitive-engine/cognitive-engine.module';
import { LearnerModelModule } from '../learner-model/learner-model.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FlashcardSet.name, schema: FlashcardSetSchema }]),
    BullModule.registerQueue({ name: FLASHCARD_GENERATION_QUEUE }),
    CognitiveEngineModule,
    LearnerModelModule,
    AnalyticsModule,
  ],
  controllers: [FlashcardController],
  providers: [FlashcardRepository, FlashcardService, FlashcardGeneratorWorker],
  exports: [FlashcardService],
})
export class FlashcardModule {}
