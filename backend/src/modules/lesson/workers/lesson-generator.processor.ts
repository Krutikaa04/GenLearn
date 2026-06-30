import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LessonRepository } from '../lesson.repository';
import { AiGatewayService } from '../../ai-gateway/ai-gateway.service';
import { LessonStatus, DifficultyLevel } from '../schemas/lesson.schema';

export const LESSON_GENERATION_QUEUE = 'lesson-generation';

export interface LessonGenerationJob {
  lessonId: string;
  studentId: string;
  topic: string;
  difficulty: DifficultyLevel;
  documentIds: string[];
}

@Processor(LESSON_GENERATION_QUEUE)
export class LessonGeneratorWorker extends WorkerHost {
  private readonly logger = new Logger(LessonGeneratorWorker.name);

  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly aiGateway: AiGatewayService,
  ) {
    super();
  }

  async process(job: Job<LessonGenerationJob>): Promise<void> {
    const { lessonId, studentId, topic, difficulty, documentIds } = job.data;
    this.logger.log(`Generating lesson ${lessonId}: "${topic}" (${difficulty})`);

    try {
      await this.lessonRepository.updateStatus(lessonId, LessonStatus.GENERATING);

      const result = await this.aiGateway.generateLesson({
        lessonId,
        studentId,
        topic,
        difficulty,
        documentIds,
      });

      await this.lessonRepository.updateStatus(lessonId, LessonStatus.READY, {
        title: result.title,
        summary: result.summary,
        sections: result.sections,
        keyTakeaways: result.keyTakeaways,
        estimatedReadMinutes: result.estimatedReadMinutes,
      });

      this.logger.log(`Lesson ${lessonId} generated: "${result.title}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      this.logger.error(`Lesson ${lessonId} generation failed: ${message}`);

      await this.lessonRepository.updateStatus(lessonId, LessonStatus.FAILED, {
        generationError: message,
      });
    }
  }
}
