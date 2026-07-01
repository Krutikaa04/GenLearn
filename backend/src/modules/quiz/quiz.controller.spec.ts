import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

const mockQuiz = {
  quizId: 'quiz-1',
  studentId: 'student-1',
  topic: 'Data Structures',
  status: 'ready',
  questions: [
    { questionId: 'q1', text: 'What is a stack?', options: ['LIFO', 'FIFO', 'Queue', 'Tree'], correctIndex: 0 },
  ],
};

const mockResult = {
  quizId: 'quiz-1',
  score: 80,
  totalQuestions: 10,
  correctAnswers: 8,
  topicBreakdown: [{ topic: 'Data Structures', correct: 8, total: 10 }],
};

describe('QuizController', () => {
  let controller: QuizController;
  let service: jest.Mocked<QuizService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        {
          provide: QuizService,
          useValue: {
            generate: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            getStatus: jest.fn(),
            review: jest.fn(),
            submit: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(QuizController);
    service = module.get(QuizService) as jest.Mocked<QuizService>;
  });

  describe('generate', () => {
    it('returns generated quiz wrapped in data', async () => {
      service.generate.mockResolvedValue(mockQuiz as any);
      const dto = { topic: 'Data Structures', numQuestions: 10, difficulty: 'intermediate' };
      const result = await controller.generate(jwtPayload as any, dto as any);
      expect(result).toEqual({ data: mockQuiz });
      expect(service.generate).toHaveBeenCalledWith('student-1', dto);
    });

    it('forwards challenge mode dto fields to service', async () => {
      service.generate.mockResolvedValue(mockQuiz as any);
      const dto = {
        topic: 'Algorithms',
        numQuestions: 20,
        difficulty: 'advanced',
        challengeMode: true,
        timeLimitMinutes: 30,
      };
      await controller.generate(jwtPayload as any, dto as any);
      expect(service.generate).toHaveBeenCalledWith('student-1', dto);
    });
  });

  describe('findAll', () => {
    it('delegates to service with pagination', async () => {
      const page = { data: [mockQuiz], total: 1, meta: {} };
      service.findAll.mockResolvedValue(page as any);
      const result = await controller.findAll(jwtPayload as any, 1, 20);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 20);
      expect(result).toBe(page);
    });

    it('caps pageSize at 50', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0, meta: {} } as any);
      await controller.findAll(jwtPayload as any, 1, 999);
      expect(service.findAll).toHaveBeenCalledWith('student-1', 1, 50);
    });
  });

  describe('getStatus', () => {
    it('returns status wrapped in data', async () => {
      const status = { quizId: 'quiz-1', status: 'generating' };
      service.getStatus.mockResolvedValue(status as any);
      const result = await controller.getStatus(jwtPayload as any, 'quiz-1');
      expect(result).toEqual({ data: status });
      expect(service.getStatus).toHaveBeenCalledWith('quiz-1', 'student-1');
    });
  });

  describe('findOne', () => {
    it('returns quiz without answers', async () => {
      service.findOne.mockResolvedValue(mockQuiz as any);
      const result = await controller.findOne(jwtPayload as any, 'quiz-1');
      expect(result).toEqual({ data: mockQuiz });
      expect(service.findOne).toHaveBeenCalledWith('quiz-1', 'student-1');
    });

    it('propagates NotFoundException when quiz not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(jwtPayload as any, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    it('returns evaluation result wrapped in data', async () => {
      service.submit.mockResolvedValue(mockResult as any);
      const dto = { answers: [{ questionId: 'q1', selectedIndex: 0 }] };
      const result = await controller.submit(jwtPayload as any, 'quiz-1', dto as any);
      expect(result).toEqual({ data: mockResult });
      expect(service.submit).toHaveBeenCalledWith('quiz-1', 'student-1', dto);
    });

    it('propagates error when quiz already submitted', async () => {
      service.submit.mockRejectedValue(new BadRequestException('Quiz already submitted'));
      const dto = { answers: [] };
      await expect(
        controller.submit(jwtPayload as any, 'quiz-1', dto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('review', () => {
    it('returns answer breakdown wrapped in data', async () => {
      const breakdown = { quizId: 'quiz-1', answers: [{ questionId: 'q1', correct: true }] };
      service.review.mockResolvedValue(breakdown as any);
      const result = await controller.review(jwtPayload as any, 'quiz-1');
      expect(result).toEqual({ data: breakdown });
      expect(service.review).toHaveBeenCalledWith('quiz-1', 'student-1');
    });
  });

  describe('delete', () => {
    it('calls service delete and returns void', async () => {
      service.delete.mockResolvedValue(undefined);
      const result = await controller.delete(jwtPayload as any, 'quiz-1');
      expect(service.delete).toHaveBeenCalledWith('quiz-1', 'student-1');
      expect(result).toBeUndefined();
    });
  });
});
