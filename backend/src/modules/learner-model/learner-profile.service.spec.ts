import { LearnerProfileService, ProfileUpdateSession } from './learner-profile.service';

describe('LearnerProfileService', () => {
  let service: LearnerProfileService;
  let profileRepo: {
    find: jest.Mock;
    findOrCreate: jest.Mock;
    applySnapshot: jest.Mock;
    appendTimelineEvents: jest.Mock;
    listTimeline: jest.Mock;
  };
  let learnerRepo: { findByStudent: jest.Mock };

  const session: ProfileUpdateSession = {
    quizId: 'quiz-1',
    topic: 'Recursion',
    adaptive: false,
    scorePercent: 80,
    conceptChanges: [
      { conceptId: 'recursion-base-case', topic: 'Recursion', before: 50, after: 62, trend: 'improving', misconception: false },
      { conceptId: 'recursion-depth', topic: 'Recursion', before: 60, after: 48, trend: 'declining', misconception: false },
    ],
    behavior: { answerChanges: 2, tabSwitches: 1 },
    assessedIntervention: { type: 'lesson', masteryDelta: 12 },
    nextRecommendation: 'weak_concept → quiz on recursion-depth (beginner)',
  };

  beforeEach(() => {
    profileRepo = {
      find: jest.fn().mockResolvedValue(null),
      findOrCreate: jest.fn().mockResolvedValue({ studentId: 'student-1' }),
      applySnapshot: jest.fn().mockResolvedValue(undefined),
      appendTimelineEvents: jest.fn().mockResolvedValue(undefined),
      listTimeline: jest.fn().mockResolvedValue([]),
    };
    learnerRepo = {
      findByStudent: jest.fn().mockResolvedValue([
        { conceptId: 'recursion-base-case', mastery: 62, confidence: 0.6, evidenceCount: 6, trend: 'improving', lastPracticedAt: new Date() },
        { conceptId: 'recursion-depth', mastery: 48, confidence: 0.4, evidenceCount: 4, trend: 'declining', lastPracticedAt: new Date() },
      ]),
    };
    service = new LearnerProfileService(profileRepo as any, learnerRepo as any);
  });

  it('rolls up concept states into a persisted profile snapshot', async () => {
    await service.updateAfterQuiz('student-1', session);

    expect(profileRepo.findOrCreate).toHaveBeenCalledWith('student-1');
    expect(profileRepo.applySnapshot).toHaveBeenCalledTimes(1);
    const [studentId, snapshot, reflection] = profileRepo.applySnapshot.mock.calls[0];
    expect(studentId).toBe('student-1');
    expect(snapshot.conceptsTracked).toBe(2);
    expect((snapshot.velocity as any).avgMastery).toBe(55);
    expect(snapshot.sessionsCount).toBe(1);
    // Reflection captures what improved vs struggled.
    expect(reflection.improved).toContain('recursion-base-case');
    expect(reflection.struggled).toContain('recursion-depth');
  });

  it('folds the assessed intervention into effectiveness and infers a preference', async () => {
    await service.updateAfterQuiz('student-1', session);
    const snapshot = profileRepo.applySnapshot.mock.calls[0][1];
    expect(snapshot.interventionEffectiveness.lesson).toEqual({ count: 1, avgMasteryDelta: 12 });
    expect((snapshot.preferences as any).preferredIntervention).toBe('lesson');
  });

  it('appends a semantic timeline including the quiz and concept movements', async () => {
    await service.updateAfterQuiz('student-1', session);
    const events = profileRepo.appendTimelineEvents.mock.calls[0][0];
    const types = events.map((e: any) => e.type);
    expect(types).toContain('quiz_attempted');
    expect(types).toContain('concept_improved');
    expect(types).toContain('concept_declined');
    expect(types).toContain('intervention_assessed');
    expect(types).toContain('reflection');
  });

  it('accumulates support-dependency counters across sessions', async () => {
    profileRepo.find.mockResolvedValue({
      sessionsCount: 2,
      consistency: { totalAnswerChanges: 10, totalTabSwitches: 4 },
      interventionEffectiveness: {},
      activeTopics: [],
    });
    await service.updateAfterQuiz('student-1', session);
    const snapshot = profileRepo.applySnapshot.mock.calls[0][1];
    expect(snapshot.sessionsCount).toBe(3);
    expect((snapshot.consistency as any).totalAnswerChanges).toBe(12);
    expect((snapshot.consistency as any).totalTabSwitches).toBe(5);
  });

  it('returns null intelligence context when no profile exists yet', async () => {
    profileRepo.find.mockResolvedValue(null);
    expect(await service.buildIntelligenceContext('student-1')).toBeNull();
  });
});
