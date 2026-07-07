import { LearnerModelService } from './learner-model.service';

describe('LearnerModelService', () => {
  let service: LearnerModelService;
  let repository: { findOrCreate: jest.Mock; applyEvidence: jest.Mock; findByStudent: jest.Mock };
  let quizModel: { findOne: jest.Mock };

  const makeQuiz = (overrides: Partial<any> = {}) => ({
    quizId: 'quiz-1',
    studentId: 'student-1',
    topic: 'Recursion',
    questions: [
      {
        questionId: 'q1',
        topic: 'Recursion',
        conceptIds: ['recursion-base-case', 'recursion'],
        primaryConceptId: 'recursion-base-case',
        cognitiveLevel: 'understand',
      },
    ],
    answers: [{ questionId: 'q1', selectedIndex: 0, isCorrect: true }],
    ...overrides,
  });

  const behavior = {
    perQuestion: [{ questionId: 'q1', answerChanges: 0, timeToFirstAnswerMs: 8_000, idleMs: 0 }],
  };

  beforeEach(() => {
    repository = {
      findOrCreate: jest.fn().mockResolvedValue({ mastery: 50, confidence: 0.5, evidenceCount: 5 }),
      applyEvidence: jest.fn().mockResolvedValue(undefined),
      findByStudent: jest.fn().mockResolvedValue([]),
    };
    quizModel = { findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(makeQuiz()) }) };
    service = new LearnerModelService(repository as any, quizModel as any);
  });

  it('updates the primary concept with a full step and secondaries with half steps', async () => {
    await service.updateFromQuizSubmission('student-1', 'quiz-1', behavior);

    expect(repository.applyEvidence).toHaveBeenCalledTimes(2);
    const [primaryCall, secondaryCall] = repository.applyEvidence.mock.calls;
    expect(primaryCall[1]).toBe('recursion-base-case');
    expect(primaryCall[2].mastery).toBe(58);
    expect(secondaryCall[1]).toBe('recursion');
    expect(secondaryCall[2].mastery).toBe(54);
  });

  it('bridges legacy questions without concept metadata through the topic string', async () => {
    quizModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(
        makeQuiz({
          questions: [{ questionId: 'q1', topic: null, conceptIds: [], primaryConceptId: null }],
        }),
      ),
    });

    await service.updateFromQuizSubmission('student-1', 'quiz-1', behavior);

    expect(repository.applyEvidence).toHaveBeenCalledTimes(1);
    expect(repository.applyEvidence.mock.calls[0][1]).toBe('recursion');
  });

  it('attaches a misconception flag only on the primary concept', async () => {
    quizModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(
        makeQuiz({ answers: [{ questionId: 'q1', selectedIndex: 3, isCorrect: false }] }),
      ),
    });
    const snapBehavior = {
      perQuestion: [{ questionId: 'q1', answerChanges: 0, timeToFirstAnswerMs: 1_000, idleMs: 0 }],
    };

    await service.updateFromQuizSubmission('student-1', 'quiz-1', snapBehavior);

    const [primaryCall, secondaryCall] = repository.applyEvidence.mock.calls;
    expect(primaryCall[3]).toEqual(expect.objectContaining({ quizId: 'quiz-1', questionId: 'q1' }));
    expect(secondaryCall[3]).toBeNull();
  });

  it('works without behavior features (telemetry off) and skips missing quizzes silently', async () => {
    await service.updateFromQuizSubmission('student-1', 'quiz-1', null);
    expect(repository.applyEvidence).toHaveBeenCalled();

    repository.applyEvidence.mockClear();
    quizModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await service.updateFromQuizSubmission('student-1', 'missing-quiz', null);
    expect(repository.applyEvidence).not.toHaveBeenCalled();
  });
});
