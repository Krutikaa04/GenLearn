import { Logger, Module } from '@nestjs/common';
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
import { ClassroomModule } from './modules/classroom/classroom.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('DATABASE_URL'),
        // A transient blip (PaaS cold start, Atlas maintenance) shouldn't need
        // a full process restart to recover from — give the driver a real window
        // to retry server selection before giving up, and retry writes/reads that
        // land during a replica set election.
        serverSelectionTimeoutMS: 10_000,
        retryWrites: true,
        retryReads: true,
        // Surface DB connectivity in the Render logs. A silent Mongo failure is
        // the hardest thing to diagnose from the dashboard — with this, the logs
        // say plainly whether the database connected, errored, or dropped.
        connectionFactory: (connection: any) => {
          const log = new Logger('Mongoose');
          connection.on('connected', () => log.log('MongoDB connected'));
          connection.on('error', (err: Error) => log.error(`MongoDB connection error: ${err.message}`));
          connection.on('disconnected', () => log.warn('MongoDB disconnected'));
          return connection;
        },
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
            username: url.username || undefined,
            password: url.password || undefined,
            // Managed Redis providers (Upstash, Render Key Value, Redis Cloud)
            // require TLS and use a rediss:// URL. Without enabling tls here the
            // socket handshake fails and every queue worker (lesson, quiz,
            // document, flashcard generation) silently never connects, leaving
            // jobs stuck "pending" forever. Enable it whenever the URL is rediss.
            tls: url.protocol === 'rediss:' ? {} : undefined,
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
    ClassroomModule,
    AiGatewayModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
