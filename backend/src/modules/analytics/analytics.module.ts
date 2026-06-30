import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentProgress, StudentProgressSchema } from './schemas/progress.schema';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StudentProgress.name, schema: StudentProgressSchema }]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsRepository, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
