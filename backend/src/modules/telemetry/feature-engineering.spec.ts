import { computeBehaviorFeatures, RawLearningEvent } from './feature-engineering';

const T0 = 1_751_500_000_000;

function ev(type: string, offsetMs: number, questionId?: string, data?: Record<string, unknown>): RawLearningEvent {
  return { type, questionId: questionId ?? null, clientTs: new Date(T0 + offsetMs), data: data ?? null };
}

describe('computeBehaviorFeatures', () => {
  it('computes dwell per question from view transitions and closes it on submit', () => {
    const { perQuestion, session } = computeBehaviorFeatures([
      ev('QUIZ_STARTED', 0, undefined, { questionCount: 2, challengeMode: false }),
      ev('QUESTION_VIEWED', 0, 'q1', { index: 0 }),
      ev('ANSWER_SELECTED', 5_000, 'q1', { selectedIndex: 1, msSinceQuestionView: 5_000 }),
      ev('NAVIGATION', 6_000, undefined, { from: 0, to: 1 }),
      ev('QUESTION_VIEWED', 6_000, 'q2', { index: 1 }),
      ev('ANSWER_SELECTED', 10_000, 'q2', { selectedIndex: 0, msSinceQuestionView: 4_000 }),
      ev('QUIZ_SUBMITTED', 11_000),
    ]);

    const q1 = perQuestion.find((q) => q.questionId === 'q1')!;
    const q2 = perQuestion.find((q) => q.questionId === 'q2')!;
    expect(q1.dwellMs).toBe(6_000);
    expect(q2.dwellMs).toBe(5_000);
    expect(q1.timeToFirstAnswerMs).toBe(5_000);
    expect(session.answeredCount).toBe(2);
    expect(session.questionCount).toBe(2);
    expect(session.abandoned).toBe(false);
    expect(session.totalDurationMs).toBe(11_000);
  });

  it('accumulates dwell across revisits (back navigation)', () => {
    const { perQuestion } = computeBehaviorFeatures([
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('QUESTION_VIEWED', 4_000, 'q2'),
      ev('QUESTION_VIEWED', 7_000, 'q1'), // revisit q1
      ev('QUIZ_SUBMITTED', 9_000),
    ]);

    expect(perQuestion.find((q) => q.questionId === 'q1')!.dwellMs).toBe(4_000 + 2_000);
    expect(perQuestion.find((q) => q.questionId === 'q2')!.dwellMs).toBe(3_000);
  });

  it('counts answer changes per question', () => {
    const { perQuestion, session } = computeBehaviorFeatures([
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('ANSWER_SELECTED', 1_000, 'q1', { selectedIndex: 0, msSinceQuestionView: 1_000 }),
      ev('ANSWER_CHANGED', 2_000, 'q1', { fromIndex: 0, toIndex: 2 }),
      ev('ANSWER_CHANGED', 3_000, 'q1', { fromIndex: 2, toIndex: 1 }),
      ev('QUIZ_SUBMITTED', 4_000),
    ]);

    expect(perQuestion[0].answerChanges).toBe(2);
    expect(session.totalAnswerChanges).toBe(2);
    // timeToFirstAnswer is the FIRST selection, unaffected by later changes
    expect(perQuestion[0].timeToFirstAnswerMs).toBe(1_000);
  });

  it('attributes questionId-less idle gaps to the question on screen', () => {
    const { perQuestion, session } = computeBehaviorFeatures([
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('IDLE_GAP', 20_000, undefined, { gapMs: 20_000 }),
      ev('IDLE_GAP', 45_000, 'q1', { gapMs: 18_000 }),
      ev('QUIZ_SUBMITTED', 50_000),
    ]);

    expect(perQuestion[0].idleMs).toBe(38_000);
    expect(session.totalIdleMs).toBe(38_000);
  });

  it('flags abandonment only when there is no submission', () => {
    const abandonedRun = computeBehaviorFeatures([
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('QUIZ_ABANDONED', 5_000, undefined, { lastQuestionIndex: 0 }),
    ]);
    expect(abandonedRun.session.abandoned).toBe(true);

    // An ABANDONED emitted after submit (e.g. duplicate cleanup) must not count
    const submittedRun = computeBehaviorFeatures([
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('QUIZ_SUBMITTED', 5_000),
      ev('QUIZ_ABANDONED', 5_100),
    ]);
    expect(submittedRun.session.abandoned).toBe(false);
  });

  it('records timer pressure and challenge mode', () => {
    const { perQuestion, session } = computeBehaviorFeatures([
      ev('QUIZ_STARTED', 0, undefined, { questionCount: 1, challengeMode: true }),
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('ANSWER_SELECTED', 2_000, 'q1', { selectedIndex: 0, msSinceQuestionView: 2_000 }),
      ev('TIMER_PRESSURE', 2_000, 'q1', { timeLeftSeconds: 30 }),
      ev('QUIZ_SUBMITTED', 3_000),
    ]);

    expect(perQuestion[0].underTimerPressure).toBe(true);
    expect(session.challengeMode).toBe(true);
  });

  it('computes median dwell for an even question count', () => {
    const { session } = computeBehaviorFeatures([
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('QUESTION_VIEWED', 2_000, 'q2'),
      ev('QUESTION_VIEWED', 8_000, 'q3'),
      ev('QUESTION_VIEWED', 12_000, 'q4'),
      ev('QUIZ_SUBMITTED', 20_000),
    ]);

    // dwells: q1=2000, q2=6000, q3=4000, q4=8000 → sorted [2000,4000,6000,8000] → median 5000
    expect(session.medianDwellMs).toBe(5_000);
    expect(session.avgDwellMs).toBe(5_000);
  });

  it('handles out-of-order event delivery by sorting on clientTs', () => {
    const { perQuestion } = computeBehaviorFeatures([
      ev('QUIZ_SUBMITTED', 10_000),
      ev('QUESTION_VIEWED', 0, 'q1'),
      ev('ANSWER_SELECTED', 3_000, 'q1', { selectedIndex: 1, msSinceQuestionView: 3_000 }),
    ]);

    expect(perQuestion[0].dwellMs).toBe(10_000);
    expect(perQuestion[0].timeToFirstAnswerMs).toBe(3_000);
  });

  it('returns safe zeroed output for an empty event list', () => {
    const { perQuestion, session } = computeBehaviorFeatures([]);

    expect(perQuestion).toEqual([]);
    expect(session).toMatchObject({ totalDurationMs: 0, answeredCount: 0, abandoned: false, medianDwellMs: 0, totalTabSwitches: 0, tabSwitchAnswerRate: 0 });
  });

  describe('tab-switch integrity signals', () => {
    it('counts tab switches and hidden time per question', () => {
      const { perQuestion, session } = computeBehaviorFeatures([
        ev('QUESTION_VIEWED', 0, 'q1'),
        ev('TAB_HIDDEN', 3_000, 'q1'),
        ev('TAB_RETURNED', 20_000, 'q1', { hiddenMs: 17_000 }),
        ev('ANSWER_SELECTED', 22_000, 'q1', { selectedIndex: 1, msSinceQuestionView: 22_000 }),
        ev('QUIZ_SUBMITTED', 23_000),
      ]);

      expect(perQuestion[0].tabSwitches).toBe(1);
      expect(perQuestion[0].hiddenMs).toBe(17_000);
      expect(session.totalTabSwitches).toBe(1);
    });

    it('flags answeredAfterTabSwitch when the first answer follows a tab-away', () => {
      const { perQuestion, session } = computeBehaviorFeatures([
        ev('QUESTION_VIEWED', 0, 'q1'),
        ev('TAB_HIDDEN', 2_000, 'q1'),
        ev('TAB_RETURNED', 10_000, 'q1', { hiddenMs: 8_000 }),
        ev('ANSWER_SELECTED', 11_000, 'q1', { selectedIndex: 0, msSinceQuestionView: 11_000 }),
        ev('QUESTION_VIEWED', 12_000, 'q2'),
        ev('ANSWER_SELECTED', 16_000, 'q2', { selectedIndex: 2, msSinceQuestionView: 4_000 }),
        ev('QUIZ_SUBMITTED', 17_000),
      ]);

      expect(perQuestion.find((q) => q.questionId === 'q1')!.answeredAfterTabSwitch).toBe(true);
      expect(perQuestion.find((q) => q.questionId === 'q2')!.answeredAfterTabSwitch).toBe(false);
      expect(session.tabSwitchAnswerRate).toBe(0.5);
    });

    it('does not flag a tab-away that happens after the question was already answered', () => {
      const { perQuestion } = computeBehaviorFeatures([
        ev('QUESTION_VIEWED', 0, 'q1'),
        ev('ANSWER_SELECTED', 4_000, 'q1', { selectedIndex: 0, msSinceQuestionView: 4_000 }),
        ev('TAB_HIDDEN', 6_000, 'q1'),
        ev('TAB_RETURNED', 12_000, 'q1', { hiddenMs: 6_000 }),
        ev('QUIZ_SUBMITTED', 13_000),
      ]);

      expect(perQuestion[0].answeredAfterTabSwitch).toBe(false);
      expect(perQuestion[0].tabSwitches).toBe(1);
    });
  });
});
