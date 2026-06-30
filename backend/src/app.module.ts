import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('DATABASE_URL'),
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
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
