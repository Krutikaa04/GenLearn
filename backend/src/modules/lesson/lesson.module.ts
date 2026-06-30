import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { LessonRepository } from './lesson.repository';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { LessonGeneratorWorker, LESSON_GENERATION_QUEUE } from './workers/lesson-generator.processor';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]),
    BullModule.registerQueue({ name: LESSON_GENERATION_QUEUE }),
    AiGatewayModule,
  ],
  controllers: [LessonController],
  providers: [LessonRepository, LessonService, LessonGeneratorWorker],
  exports: [LessonService],
})
export class LessonModule {}
