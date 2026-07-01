import { Test, TestingModule } from '@nestjs/testing';
import { StudyPlanController } from './studyplan.controller';
import { StudyPlanService } from './studyplan.service';

const jwtPayload = { userId: 'student-1', email: 'student@test.com', role: 'student' };

const mockPlan = {
  planId: 'plan-1',
  studentId: 'student-1',
  goal: 'Learn React in 2 weeks',
  targetDate: '2026-07-14',
  plan: [
    {
      day: 1,
      date: '2026-07-01',
      tasks: [
        { type: 'lesson', topic: 'React Fundamentals', durationMinutes: 30, priority: 'high', rationale: 'Core concept' },
      ],
    },
    {
      day: 2,
      date: '2026-07-02',
      tasks: [
        { type: 'quiz', topic: 'React Hooks', durationMinutes: 20, priority: 'medium', rationale: 'Practice' },
      ],
    },
  ],
};

describe('StudyPlanController', () => {
  let controller: StudyPlanController;
  let service: jest.Mocked<StudyPlanService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyPlanController],
      providers: [
        {
          provide: StudyPlanService,
          useValue: {
            generate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(StudyPlanController);
    service = module.get(StudyPlanService) as jest.Mocked<StudyPlanService>;
  });

  describe('generate', () => {
    it('returns plan wrapped in data', async () => {
      service.generate.mockResolvedValue(mockPlan as any);
      const dto = {
        goal: 'Learn React in 2 weeks',
        targetDate: '2026-07-14',
        topics: ['React Fundamentals', 'React Hooks'],
        hoursPerDay: 2,
      };
      const result = await controller.generate(jwtPayload as any, dto as any);
      expect(result).toEqual({ data: mockPlan });
      expect(service.generate).toHaveBeenCalledWith('student-1', dto);
    });

    it('uses userId from JWT for per-student plan isolation', async () => {
      service.generate.mockResolvedValue(mockPlan as any);
      const otherUser = { userId: 'student-42', email: 'y@test.com', role: 'student' };
      const dto = { goal: 'Master TypeScript', targetDate: '2026-07-15', topics: ['TypeScript'], hoursPerDay: 1 };
      await controller.generate(otherUser as any, dto as any);
      expect(service.generate).toHaveBeenCalledWith('student-42', dto);
    });

    it('forwards all dto fields (topics, hoursPerDay) to service', async () => {
      service.generate.mockResolvedValue(mockPlan as any);
      const dto = {
        goal: 'Ace the interview',
        targetDate: '2026-07-30',
        topics: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming'],
        hoursPerDay: 4,
      };
      await controller.generate(jwtPayload as any, dto as any);
      expect(service.generate).toHaveBeenCalledWith('student-1', dto);
    });

    it('plan response includes day-by-day schedule', async () => {
      service.generate.mockResolvedValue(mockPlan as any);
      const dto = { goal: 'Test', targetDate: '2026-07-10', topics: ['Test'], hoursPerDay: 1 };
      const result = await controller.generate(jwtPayload as any, dto as any);
      expect(result.data.plan).toHaveLength(2);
      expect(result.data.plan[0].tasks[0].type).toBe('lesson');
    });
  });
});
