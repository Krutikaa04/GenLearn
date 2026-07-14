import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LessonRepository } from '../lesson.repository';
import { CognitiveEngineService } from '../../cognitive-engine/cognitive-engine.service';
import { LearnerProfileService } from '../../learner-model/learner-profile.service';
import { TimelineEventType } from '../../learner-model/schemas/learner-timeline-event.schema';
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
    private readonly cognitive: CognitiveEngineService,
    private readonly learnerProfile: LearnerProfileService,
  ) {
    super();
  }

  async process(job: Job<LessonGenerationJob>): Promise<void> {
    const { lessonId, studentId, topic, difficulty, documentIds } = job.data;
    this.logger.log(`Generating lesson ${lessonId}: "${topic}" (${difficulty})`);

    try {
      await this.lessonRepository.updateStatus(lessonId, LessonStatus.GENERATING);

      const result = await this.cognitive.generateLesson({
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

      // Persistent Learner Intelligence: record the lesson on the learner's
      // timeline so intervention effectiveness can later credit it. Best-effort.
      await this.learnerProfile
        .recordTimelineEvent(studentId, TimelineEventType.LESSON_COMPLETED, {
          topic,
          summary: `Lesson generated: ${result.title}`,
          data: { lessonId, difficulty },
        })
        .catch(() => undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      this.logger.error(`Lesson ${lessonId} generation failed: ${message}`);

      await this.lessonRepository.updateStatus(lessonId, LessonStatus.FAILED, {
        generationError: message,
      });
    }
  }
}
