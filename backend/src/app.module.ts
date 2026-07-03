import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentModule } from './modules/document/document.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { FlashcardModule } from './modules/flashcard/flashcard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { TutorModule } from './modules/tutor/tutor.module';
import { StudyPlanModule } from './modules/studyplan/studyplan.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('DATABASE_URL'),
        // A transient blip (Railway cold start, Atlas maintenance) shouldn't need
        // a full process restart to recover from — give the driver a real window
        // to retry server selection before giving up, and retry writes/reads that
        // land during a replica set election.
        serverSelectionTimeoutMS: 10_000,
        retryWrites: true,
        retryReads: true,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = new URL(configService.get<string>('REDIS_URL', 'redis://localhost:6379'));
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
            password: url.password || undefined,
            // BullMQ's recommendation: let ioredis queue commands indefinitely
            // during a reconnect instead of failing them after a fixed retry
            // count, and keep attempting to reconnect with capped backoff
            // rather than giving up after ioredis's default retry limit.
            maxRetriesPerRequest: null,
            retryStrategy: (times: number) => Math.min(times * 200, 5000),
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TerminusModule,
    AuthModule,
    DocumentModule,
    LessonModule,
    QuizModule,
    FlashcardModule,
    AnalyticsModule,
    AdminModule,
    TutorModule,
    StudyPlanModule,
    ConversationModule,
    TelemetryModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
