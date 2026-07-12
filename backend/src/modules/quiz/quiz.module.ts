import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { QuizRepository } from './quiz.repository';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { QuizGeneratorWorker, QUIZ_GENERATION_QUEUE } from './workers/quiz-generator.processor';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LearnerModelModule } from '../learner-model/learner-model.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
    BullModule.registerQueue({ name: QUIZ_GENERATION_QUEUE }),
    AiGatewayModule,
    AnalyticsModule,
    LearnerModelModule,
  ],
  controllers: [QuizController],
  providers: [QuizRepository, QuizService, QuizGeneratorWorker],
  exports: [QuizService],
})
export class QuizModule {}
