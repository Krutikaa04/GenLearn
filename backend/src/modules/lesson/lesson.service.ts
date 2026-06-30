import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { LessonRepository } from './lesson.repository';
import { LessonStatus } from './schemas/lesson.schema';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import {
  LESSON_GENERATION_QUEUE,
  LessonGenerationJob,
} from './workers/lesson-generator.processor';

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name);

  constructor(
    private readonly lessonRepository: LessonRepository,
    @InjectQueue(LESSON_GENERATION_QUEUE) private readonly generationQueue: Queue,
  ) {}

  async generate(studentId: string, dto: GenerateLessonDto) {
    const lessonId = uuidv4();

    const lesson = await this.lessonRepository.create({
      lessonId,
      studentId,
      topic: dto.topic,
      difficulty: dto.difficulty,
      documentIds: dto.documentIds ?? [],
      status: LessonStatus.PENDING,
    });

    const jobData: LessonGenerationJob = {
      lessonId,
      studentId,
      topic: dto.topic,
      difficulty: dto.difficulty,
      documentIds: dto.documentIds ?? [],
    };

    await this.generationQueue.add('generate', jobData, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.logger.log(`Lesson ${lessonId} queued for generation`);

    return {
      lessonId: lesson.lessonId,
      status: lesson.status,
      topic: lesson.topic,
      difficulty: lesson.difficulty,
      pollUrl: `/api/v1/lessons/${lessonId}/status`,
    };
  }

  async findAll(studentId: string, page = 1, pageSize = 20) {
    const { items, total } = await this.lessonRepository.findByStudentId(studentId, page, pageSize);
    return {
      data: items.map((l) => this.serializeLesson(l, false)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(lessonId: string, studentId: string) {
    const lesson = await this.findAndVerifyOwnership(lessonId, studentId);
    return this.serializeLesson(lesson, true);
  }

  async getStatus(lessonId: string, studentId: string) {
    const lesson = await this.findAndCheckOwnership(lessonId, studentId);
    return {
      lessonId: lesson.lessonId,
      status: lesson.status,
      title: lesson.title,
      generationError: lesson.generationError,
    };
  }

  async delete(lessonId: string, studentId: string): Promise<void> {
    await this.findAndCheckOwnership(lessonId, studentId);
    await this.lessonRepository.softDelete(lessonId);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findAndCheckOwnership(lessonId: string, studentId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Lesson not found' });
    }
    if (lesson.studentId !== studentId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return lesson;
  }

  private async findAndVerifyOwnership(lessonId: string, studentId: string) {
    const lesson = await this.findAndCheckOwnership(lessonId, studentId);
    if (lesson.status !== LessonStatus.READY) {
      throw new UnprocessableEntityException({
        code: lesson.status === LessonStatus.FAILED ? 'LESSON_GENERATION_FAILED' : 'LESSON_NOT_READY',
        message: lesson.status === LessonStatus.FAILED
          ? 'Lesson generation failed'
          : 'Lesson is still being generated',
      });
    }
    return lesson;
  }

  private serializeLesson(lesson: any, includeSections: boolean) {
    return {
      lessonId: lesson.lessonId,
      topic: lesson.topic,
      difficulty: lesson.difficulty,
      status: lesson.status,
      title: lesson.title,
      summary: lesson.summary,
      ...(includeSections ? { sections: lesson.sections, keyTakeaways: lesson.keyTakeaways } : {}),
      estimatedReadMinutes: lesson.estimatedReadMinutes,
      documentIds: lesson.documentIds,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }
}
