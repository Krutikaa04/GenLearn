import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonStatus } from './schemas/lesson.schema';

describe('LessonService', () => {
  let service: LessonService;
  let repository: {
    create: jest.Mock;
    findByStudentId: jest.Mock;
    findById: jest.Mock;
    softDelete: jest.Mock;
  };
  let analytics: { recordActivity: jest.Mock };
  let queue: { add: jest.Mock };

  const makeLesson = (overrides: Partial<any> = {}) => ({
    lessonId: 'lesson-1',
    studentId: 'student-1',
    topic: 'Binary Trees',
    difficulty: 'beginner',
    status: LessonStatus.READY,
    title: 'Binary Trees Explained',
    summary: 'An overview of binary trees.',
    sections: [{ heading: 'Introduction', content: 'A tree is...' }],
    keyTakeaways: ['Balance matters'],
    estimatedReadMinutes: 8,
    documentIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByStudentId: jest.fn(),
      findById: jest.fn(),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    analytics = { recordActivity: jest.fn().mockResolvedValue(undefined) };
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    service = new LessonService(repository as any, analytics as any, queue as any);
  });

  // ─── generate ────────────────────────────────────────────────────────────────

  describe('generate', () => {
    it('creates a pending lesson and enqueues a generation job', async () => {
      const dto = { topic: 'Binary Trees', difficulty: 'beginner', documentIds: [] };
      const created = makeLesson({ status: LessonStatus.PENDING });
      repository.create.mockResolvedValue(created);

      const result = await service.generate('student-1', dto as any);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        studentId: 'student-1',
        topic: 'Binary Trees',
        status: LessonStatus.PENDING,
      }));
      expect(queue.add).toHaveBeenCalledWith(
        'generate',
        expect.objectContaining({ studentId: 'student-1', topic: 'Binary Trees' }),
        expect.any(Object),
      );
      expect(result.status).toBe(LessonStatus.PENDING);
      expect(result.pollUrl).toMatch(/^\/api\/v1\/lessons\/.+\/status$/);
    });

    it('fires analytics.recordActivity without awaiting (fire-and-forget)', async () => {
      const dto = { topic: 'Binary Trees', difficulty: 'beginner', documentIds: [] };
      repository.create.mockResolvedValue(makeLesson({ status: LessonStatus.PENDING }));

      await service.generate('student-1', dto as any);
      await Promise.resolve();

      expect(analytics.recordActivity).toHaveBeenCalledWith('student-1', 'lesson');
    });
  });

  // ─── getStatus ────────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns status, title and generationError for the lesson', async () => {
      repository.findById.mockResolvedValue(makeLesson({ status: LessonStatus.GENERATING }));

      const result = await service.getStatus('lesson-1', 'student-1');

      expect(result).toMatchObject({ lessonId: 'lesson-1', status: LessonStatus.GENERATING });
    });

    it('throws ForbiddenException when the lesson belongs to another student', async () => {
      repository.findById.mockResolvedValue(makeLesson({ studentId: 'other-student' }));

      await expect(service.getStatus('lesson-1', 'student-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the lesson does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getStatus('lesson-1', 'student-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a lesson with sections when ready', async () => {
      repository.findById.mockResolvedValue(makeLesson());

      const result = await service.findOne('lesson-1', 'student-1');

      expect(result.sections).toBeDefined();
      expect(result.keyTakeaways).toBeDefined();
    });

    it('throws UnprocessableEntityException when lesson is still generating', async () => {
      repository.findById.mockResolvedValue(makeLesson({ status: LessonStatus.GENERATING }));

      await expect(service.findOne('lesson-1', 'student-1')).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException with LESSON_GENERATION_FAILED code for failed lessons', async () => {
      repository.findById.mockResolvedValue(makeLesson({ status: LessonStatus.FAILED }));

      await expect(service.findOne('lesson-1', 'student-1'))
        .rejects.toMatchObject({ response: { code: 'LESSON_GENERATION_FAILED' } });
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated lessons without sections', async () => {
      const lesson = makeLesson();
      repository.findByStudentId.mockResolvedValue({ items: [lesson], total: 1 });

      const result = await service.findAll('student-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].sections).toBeUndefined();
      expect(result.meta).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('calls softDelete with the lesson id', async () => {
      repository.findById.mockResolvedValue(makeLesson());

      await service.delete('lesson-1', 'student-1');

      expect(repository.softDelete).toHaveBeenCalledWith('lesson-1');
    });

    it('throws ForbiddenException when deleting another student\'s lesson', async () => {
      repository.findById.mockResolvedValue(makeLesson({ studentId: 'other-student' }));

      await expect(service.delete('lesson-1', 'student-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
