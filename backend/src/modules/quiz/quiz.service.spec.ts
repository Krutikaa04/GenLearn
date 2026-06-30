import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizStatus } from './schemas/quiz.schema';

describe('QuizService', () => {
  let service: QuizService;
  let repository: {
    create: jest.Mock;
    findByStudentId: jest.Mock;
    findById: jest.Mock;
    findByIdWithAnswers: jest.Mock;
    submitAnswers: jest.Mock;
    softDelete: jest.Mock;
  };
  let analytics: { recordQuizResult: jest.Mock };
  let queue: { add: jest.Mock };

  const makeQuiz = (overrides: Partial<any> = {}) => ({
    quizId: 'quiz-1',
    studentId: 'student-1',
    topic: 'Recursion',
    difficulty: 'beginner',
    questionCount: 2,
    status: QuizStatus.READY,
    challengeMode: false,
    timeLimitMinutes: null,
    title: 'Recursion Quiz',
    questions: [
      { questionId: 'q1', text: 'What is base case?', options: ['A', 'B', 'C', 'D'] },
      { questionId: 'q2', text: 'What is recursion?', options: ['W', 'X', 'Y', 'Z'] },
    ],
    score: null,
    totalQuestions: null,
    submittedAt: null,
    documentIds: [],
    challengeTopics: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeQuizWithAnswers = (overrides: Partial<any> = {}) => ({
    ...makeQuiz(overrides),
    questions: [
      { questionId: 'q1', text: 'What is base case?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'A is correct' },
      { questionId: 'q2', text: 'What is recursion?', options: ['W', 'X', 'Y', 'Z'], correctIndex: 2, explanation: 'Y is correct' },
    ],
  });

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByStudentId: jest.fn(),
      findById: jest.fn(),
      findByIdWithAnswers: jest.fn(),
      submitAnswers: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    analytics = { recordQuizResult: jest.fn().mockResolvedValue(undefined) };
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    service = new QuizService(repository as any, analytics as any, queue as any);
  });

  // ─── generate ────────────────────────────────────────────────────────────────

  describe('generate', () => {
    it('creates a pending quiz and enqueues a generation job', async () => {
      const dto = { topic: 'Recursion', difficulty: 'beginner', questionCount: 5, documentIds: [] };
      const created = makeQuiz({ status: QuizStatus.PENDING });
      repository.create.mockResolvedValue(created);

      const result = await service.generate('student-1', dto as any);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        studentId: 'student-1',
        topic: 'Recursion',
        status: QuizStatus.PENDING,
        questionCount: 5,
      }));
      expect(queue.add).toHaveBeenCalledWith('generate', expect.objectContaining({ studentId: 'student-1' }), expect.any(Object));
      expect(result.status).toBe(QuizStatus.PENDING);
    });

    it('uses challengeTopics joined as topic when in challenge mode', async () => {
      const dto = {
        topic: 'General',
        difficulty: 'intermediate',
        questionCount: 10,
        challengeMode: true,
        challengeTopics: ['Recursion', 'Trees'],
        timeLimitMinutes: 15,
        documentIds: [],
      };
      const created = makeQuiz({ status: QuizStatus.PENDING, topic: 'Recursion, Trees' });
      repository.create.mockResolvedValue(created);

      await service.generate('student-1', dto as any);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        topic: 'Recursion, Trees',
        challengeMode: true,
        timeLimitMinutes: 15,
      }));
    });
  });

  // ─── getStatus ────────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns the quiz status fields', async () => {
      repository.findById.mockResolvedValue(makeQuiz({ status: QuizStatus.GENERATING }));

      const result = await service.getStatus('quiz-1', 'student-1');

      expect(result).toMatchObject({ quizId: 'quiz-1', status: QuizStatus.GENERATING });
    });

    it('throws ForbiddenException when the quiz belongs to a different student', async () => {
      repository.findById.mockResolvedValue(makeQuiz({ studentId: 'other-student' }));

      await expect(service.getStatus('quiz-1', 'student-1')).rejects.toThrow('Access denied');
    });
  });

  // ─── submit ───────────────────────────────────────────────────────────────────

  describe('submit', () => {
    const twoAnswers = [
      { questionId: 'q1', selectedIndex: 0 }, // correct
      { questionId: 'q2', selectedIndex: 1 }, // wrong (correct is 2)
    ];

    it('evaluates answers and returns correct score', async () => {
      repository.findById.mockResolvedValue(makeQuiz());
      repository.findByIdWithAnswers.mockResolvedValue(makeQuizWithAnswers());

      const result = await service.submit('quiz-1', 'student-1', { answers: twoAnswers } as any);

      expect(result.score).toBe(1);
      expect(result.totalQuestions).toBe(2);
      expect(result.scorePercent).toBe(50);
    });

    it('marks each answer isCorrect accurately', async () => {
      repository.findById.mockResolvedValue(makeQuiz());
      repository.findByIdWithAnswers.mockResolvedValue(makeQuizWithAnswers());

      const result = await service.submit('quiz-1', 'student-1', { answers: twoAnswers } as any);

      expect(result.answers[0].isCorrect).toBe(true);
      expect(result.answers[1].isCorrect).toBe(false);
    });

    it('includes questionText, explanation and correctIndex in answer objects', async () => {
      repository.findById.mockResolvedValue(makeQuiz());
      repository.findByIdWithAnswers.mockResolvedValue(makeQuizWithAnswers());

      const result = await service.submit('quiz-1', 'student-1', { answers: twoAnswers } as any);

      expect(result.answers[0].questionText).toBe('What is base case?');
      expect(result.answers[1].explanation).toBe('Y is correct');
      expect(result.answers[1].correctIndex).toBe(2);
    });

    it('throws ConflictException when the quiz has already been submitted', async () => {
      repository.findById.mockResolvedValue(makeQuiz({ status: QuizStatus.SUBMITTED }));

      await expect(service.submit('quiz-1', 'student-1', { answers: twoAnswers } as any))
        .rejects.toThrow(ConflictException);
    });

    it('throws UnprocessableEntityException when answer count does not match', async () => {
      repository.findById.mockResolvedValue(makeQuiz());
      repository.findByIdWithAnswers.mockResolvedValue(makeQuizWithAnswers());

      await expect(service.submit('quiz-1', 'student-1', { answers: [twoAnswers[0]] } as any))
        .rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException for an unrecognised questionId', async () => {
      repository.findById.mockResolvedValue(makeQuiz());
      repository.findByIdWithAnswers.mockResolvedValue(makeQuizWithAnswers());
      const badAnswers = [
        { questionId: 'q1', selectedIndex: 0 },
        { questionId: 'q-does-not-exist', selectedIndex: 1 },
      ];

      await expect(service.submit('quiz-1', 'student-1', { answers: badAnswers } as any))
        .rejects.toThrow(UnprocessableEntityException);
    });

    it('throws NotFoundException when quiz-with-answers record is missing', async () => {
      repository.findById.mockResolvedValue(makeQuiz());
      repository.findByIdWithAnswers.mockResolvedValue(null);

      await expect(service.submit('quiz-1', 'student-1', { answers: twoAnswers } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('calls analytics.recordQuizResult after a successful submission', async () => {
      repository.findById.mockResolvedValue(makeQuiz());
      repository.findByIdWithAnswers.mockResolvedValue(makeQuizWithAnswers());

      await service.submit('quiz-1', 'student-1', { answers: twoAnswers } as any);

      // Give the fire-and-forget microtask time to settle
      await Promise.resolve();
      expect(analytics.recordQuizResult).toHaveBeenCalledWith('student-1', 'Recursion', 50);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('calls softDelete with the quiz id', async () => {
      repository.findById.mockResolvedValue(makeQuiz());

      await service.delete('quiz-1', 'student-1');

      expect(repository.softDelete).toHaveBeenCalledWith('quiz-1');
    });

    it('throws ForbiddenException when deleting someone else\'s quiz', async () => {
      repository.findById.mockResolvedValue(makeQuiz({ studentId: 'other-student' }));

      await expect(service.delete('quiz-1', 'student-1')).rejects.toThrow('Access denied');
    });
  });
});
