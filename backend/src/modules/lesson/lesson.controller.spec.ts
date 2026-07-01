import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

const mockLesson = {
  lessonId: 'lesson-1',
  studentId: 'student-1',
  topic: 'Binary Trees',
  difficulty: 'intermediate',
  status: 'ready',
  title: 'Introduction to Binary Trees',
  sections: [{ heading: 'Overview', content: 'A binary tree is...', keyPoints: [] }],
  keyTakeaways: ['Nodes have at most 2 children'],
  estimatedReadMinutes: 8,
};

describe('LessonController', () => {
  let controller: LessonController;
  let service: jest.Mocked<LessonService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonController],
      providers: [
        {
          provide: LessonService,
          useValue: {
            generate: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            getStatus: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(LessonController);
    service = module.get(LessonService) as jest.Mocked<LessonService>;
  });

  describe('generate', () => {
    it('returns lesson wrapped in data', async () => {
      service.generate.mockResolvedValue(mockLesson as any);
      const dto = { topic: 'Binary Trees', difficulty: 'intermediate' };
      const result = await controller.generate(jwtPayload as any, dto as any);
      expect(result).toEqual({ data: mockLesson });
      expect(service.generate).toHaveBeenCalledWith('student-1', dto);
    });
  });

  describe('findAll', () => {
    it('delegates to service with pagination', async () => {
      const page = { data: [mockLesson], total: 1, meta: {} };
      service.findAll.mockResolvedValue(page as any);
      const result = await controller.findAll(jwtPayload as any, 1, 20);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 20);
      expect(result).toBe(page);
    });

    it('caps pageSize at 50', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0, meta: {} } as any);
      await controller.findAll(jwtPayload as any, 1, 100);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 50);
    });
  });

  describe('getStatus', () => {
    it('returns status wrapped in data', async () => {
      const status = { lessonId: 'lesson-1', status: 'generating' };
      service.getStatus.mockResolvedValue(status as any);
      const result = await controller.getStatus(jwtPayload as any, 'lesson-1');
      expect(result).toEqual({ data: status });
      expect(service.getStatus).toHaveBeenCalledWith('lesson-1', 'student-1');
    });
  });

  describe('findOne', () => {
    it('returns full lesson content', async () => {
      service.findOne.mockResolvedValue(mockLesson as any);
      const result = await controller.findOne(jwtPayload as any, 'lesson-1');
      expect(result).toEqual({ data: mockLesson });
      expect(service.findOne).toHaveBeenCalledWith('lesson-1', 'student-1');
    });

    it('propagates NotFoundException when lesson not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(jwtPayload as any, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('enforces ownership — passes userId to service', async () => {
      const otherUser = { userId: 'student-99', email: 'x@test.com', role: 'student' };
      service.findOne.mockResolvedValue(mockLesson as any);
      await controller.findOne(otherUser as any, 'lesson-1');
      expect(service.findOne).toHaveBeenCalledWith('lesson-1', 'student-99');
    });
  });

  describe('delete', () => {
    it('calls service delete and returns void', async () => {
      service.delete.mockResolvedValue(undefined);
      const result = await controller.delete(jwtPayload as any, 'lesson-1');
      expect(service.delete).toHaveBeenCalledWith('lesson-1', 'student-1');
      expect(result).toBeUndefined();
    });

    it('propagates NotFoundException when lesson not found', async () => {
      service.delete.mockRejectedValue(new NotFoundException());
      await expect(controller.delete(jwtPayload as any, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
