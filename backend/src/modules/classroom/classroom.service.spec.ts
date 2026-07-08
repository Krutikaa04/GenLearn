import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClassroomService } from './classroom.service';

describe('ClassroomService', () => {
  let service: ClassroomService;
  let repository: {
    create: jest.Mock;
    findByClassroomId: jest.Mock;
    findByTeacher: jest.Mock;
    findByJoinCode: jest.Mock;
    findByMember: jest.Mock;
    addMember: jest.Mock;
    removeMember: jest.Mock;
    softDelete: jest.Mock;
  };
  let analytics: { getProgress: jest.Mock; getWeakTopics: jest.Mock };
  let quizService: { findAll: jest.Mock };
  let userModel: { find: jest.Mock };

  const makeClassroom = (overrides: Partial<any> = {}) => ({
    classroomId: 'class-1',
    teacherId: 'teacher-1',
    name: 'Physics 11A',
    description: '',
    joinCode: 'ABCD-2345',
    memberIds: ['student-1'],
    deletedAt: null,
    createdAt: new Date('2026-07-01'),
    ...overrides,
  });

  const userFindMock = (users: any[]) => ({
    select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(users) }),
  });

  beforeEach(() => {
    repository = {
      create: jest.fn().mockImplementation(async (data) => makeClassroom(data)),
      findByClassroomId: jest.fn().mockResolvedValue(makeClassroom()),
      findByTeacher: jest.fn().mockResolvedValue([makeClassroom()]),
      findByJoinCode: jest.fn().mockResolvedValue(makeClassroom()),
      findByMember: jest.fn().mockResolvedValue([makeClassroom()]),
      addMember: jest.fn().mockResolvedValue(undefined),
      removeMember: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    analytics = {
      getProgress: jest.fn().mockResolvedValue({
        overallMasteryScore: 60,
        currentStreak: 3,
        totalQuizzesTaken: 7,
        xpTotal: 220,
        level: 2,
        lastActiveDate: new Date('2026-07-07'),
      }),
      getWeakTopics: jest.fn().mockResolvedValue([
        { topic: 'Optics', masteryScore: 40 },
        { topic: 'Waves', masteryScore: 45 },
        { topic: 'Thermo', masteryScore: 50 },
        { topic: 'Extra', masteryScore: 55 },
      ]),
    };
    quizService = {
      findAll: jest.fn().mockResolvedValue({ data: [{ quizId: 'q-1', score: 7 }], meta: { total: 1 } }),
    };
    userModel = {
      find: jest.fn().mockReturnValue(
        userFindMock([{ userId: 'student-1', email: 's1@test.com', firstName: 'Sam', lastName: 'One' }]),
      ),
    };
    service = new ClassroomService(repository as any, analytics as any, quizService as any, userModel as any);
  });

  describe('create', () => {
    it('creates a classroom with a canonical XXXX-XXXX join code', async () => {
      const result = await service.create('teacher-1', 'Physics 11A');

      const created = repository.create.mock.calls[0][0];
      expect(created.joinCode).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
      expect(created.teacherId).toBe('teacher-1');
      expect(result.name).toBe('Physics 11A');
    });

    it('retries on a join-code collision', async () => {
      repository.create
        .mockRejectedValueOnce({ code: 11000 })
        .mockImplementationOnce(async (data: any) => makeClassroom(data));

      await service.create('teacher-1', 'Physics 11A');

      expect(repository.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('teacher authorization', () => {
    it('rejects dashboard access for a classroom the teacher does not own', async () => {
      repository.findByClassroomId.mockResolvedValue(makeClassroom({ teacherId: 'someone-else' }));

      await expect(service.getDashboard('teacher-1', 'class-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a student report for a non-member student', async () => {
      await expect(
        service.getStudentReport('teacher-1', 'class-1', 'intruder-student'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('404s on a missing classroom', async () => {
      repository.findByClassroomId.mockResolvedValue(null);

      await expect(service.getDashboard('teacher-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getDashboard', () => {
    it('aggregates per-member progress and caps weak topics at 3', async () => {
      const result = await service.getDashboard('teacher-1', 'class-1');

      expect(result.classroom).toMatchObject({ classroomId: 'class-1', joinCode: 'ABCD-2345', memberCount: 1 });
      expect(result.students).toHaveLength(1);
      expect(result.students[0]).toMatchObject({
        userId: 'student-1',
        firstName: 'Sam',
        progress: { overallMasteryScore: 60, totalQuizzesTaken: 7, level: 2 },
      });
      expect(result.students[0].weakTopics).toHaveLength(3);
      expect(analytics.getProgress).toHaveBeenCalledWith('student-1');
    });
  });

  describe('getStudentReport', () => {
    it('returns progress, weak topics, and quiz history for a member', async () => {
      const result = await service.getStudentReport('teacher-1', 'class-1', 'student-1');

      expect(result.progress.overallMasteryScore).toBe(60);
      expect(result.quizzes.data).toHaveLength(1);
      expect(quizService.findAll).toHaveBeenCalledWith('student-1', 1, 20);
    });
  });

  describe('join', () => {
    it('normalizes messy join-code input to canonical form', async () => {
      await service.join('student-2', ' abcd2345 ');

      expect(repository.findByJoinCode).toHaveBeenCalledWith('ABCD-2345');
      expect(repository.addMember).toHaveBeenCalledWith('class-1', 'student-2');
    });

    it('404s on an unknown join code', async () => {
      repository.findByJoinCode.mockResolvedValue(null);

      await expect(service.join('student-2', 'ZZZZ-9999')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listJoined', () => {
    it('joins teacher names onto the classroom list', async () => {
      userModel.find.mockReturnValue(
        userFindMock([{ userId: 'teacher-1', firstName: 'Priya', lastName: 'Shah' }]),
      );

      const result = await service.listJoined('student-1');

      expect(result[0]).toMatchObject({ classroomId: 'class-1', teacherName: 'Priya Shah' });
    });
  });
});
