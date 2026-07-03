/**
 * Pure feature-engineering over a session's raw learning events.
 * Turns the event stream into per-question and per-session behavior signals
 * consumed later by the learner model. No I/O — fully unit-testable.
 */

export interface RawLearningEvent {
  type: string;
  questionId?: string | null;
  clientTs: Date;
  data?: Record<string, unknown> | null;
}

export interface QuestionFeatures {
  questionId: string;
  /** Total visible time across all visits to this question. */
  dwellMs: number;
  /** Client-measured time from first view to first answer, if answered. */
  timeToFirstAnswerMs: number | null;
  /** Number of times the student switched away from a previously chosen option. */
  answerChanges: number;
  /** Total idle time attributed to this question. */
  idleMs: number;
  /** Whether any answer landed under challenge-mode time pressure. */
  underTimerPressure: boolean;
}

export interface SessionFeatures {
  totalDurationMs: number;
  questionCount: number;
  answeredCount: number;
  avgDwellMs: number;
  medianDwellMs: number;
  totalAnswerChanges: number;
  totalIdleMs: number;
  abandoned: boolean;
  challengeMode: boolean;
}

export interface BehaviorFeatureSet {
  perQuestion: QuestionFeatures[];
  session: SessionFeatures;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function computeBehaviorFeatures(events: RawLearningEvent[]): BehaviorFeatureSet {
  const sorted = [...events].sort((a, b) => a.clientTs.getTime() - b.clientTs.getTime());

  const questions = new Map<string, QuestionFeatures>();
  const getQuestion = (questionId: string): QuestionFeatures => {
    let q = questions.get(questionId);
    if (!q) {
      q = { questionId, dwellMs: 0, timeToFirstAnswerMs: null, answerChanges: 0, idleMs: 0, underTimerPressure: false };
      questions.set(questionId, q);
    }
    return q;
  };

  let currentQuestionId: string | null = null;
  let currentViewTs: number | null = null;
  let questionCount = 0;
  let challengeMode = false;
  let submitted = false;
  let abandoned = false;
  const answeredIds = new Set<string>();

  const closeDwell = (untilTs: number) => {
    if (currentQuestionId !== null && currentViewTs !== null) {
      getQuestion(currentQuestionId).dwellMs += Math.max(0, untilTs - currentViewTs);
    }
    currentViewTs = null;
  };

  for (const event of sorted) {
    const ts = event.clientTs.getTime();
    const data = event.data ?? {};

    switch (event.type) {
      case 'QUIZ_STARTED':
        questionCount = Math.max(questionCount, num(data.questionCount));
        challengeMode = challengeMode || data.challengeMode === true;
        break;

      case 'QUESTION_VIEWED':
        closeDwell(ts);
        currentQuestionId = typeof event.questionId === 'string' ? event.questionId : null;
        currentViewTs = ts;
        break;

      case 'ANSWER_SELECTED':
        if (typeof event.questionId === 'string') {
          answeredIds.add(event.questionId);
          const q = getQuestion(event.questionId);
          if (q.timeToFirstAnswerMs === null) {
            const msSinceView = data.msSinceQuestionView;
            q.timeToFirstAnswerMs = typeof msSinceView === 'number' && Number.isFinite(msSinceView) ? msSinceView : null;
          }
        }
        break;

      case 'ANSWER_CHANGED':
        if (typeof event.questionId === 'string') {
          getQuestion(event.questionId).answerChanges += 1;
        }
        break;

      case 'IDLE_GAP': {
        // Idle gaps sometimes arrive without a questionId — attribute them
        // to whichever question was on screen at the time.
        const target = typeof event.questionId === 'string' ? event.questionId : currentQuestionId;
        if (target !== null) getQuestion(target).idleMs += num(data.gapMs);
        break;
      }

      case 'TIMER_PRESSURE':
        if (typeof event.questionId === 'string') {
          getQuestion(event.questionId).underTimerPressure = true;
        }
        break;

      case 'QUIZ_SUBMITTED':
        submitted = true;
        closeDwell(ts);
        break;

      case 'QUIZ_ABANDONED':
        abandoned = true;
        closeDwell(ts);
        break;
    }
  }

  const perQuestion = [...questions.values()];
  const dwells = perQuestion.map((q) => q.dwellMs).sort((a, b) => a - b);
  const medianDwellMs = dwells.length
    ? dwells.length % 2 === 1
      ? dwells[(dwells.length - 1) / 2]
      : Math.round((dwells[dwells.length / 2 - 1] + dwells[dwells.length / 2]) / 2)
    : 0;
  const avgDwellMs = dwells.length ? Math.round(dwells.reduce((s, d) => s + d, 0) / dwells.length) : 0;

  const firstTs = sorted.length ? sorted[0].clientTs.getTime() : 0;
  const lastTs = sorted.length ? sorted[sorted.length - 1].clientTs.getTime() : 0;

  return {
    perQuestion,
    session: {
      totalDurationMs: Math.max(0, lastTs - firstTs),
      questionCount,
      answeredCount: answeredIds.size,
      avgDwellMs,
      medianDwellMs,
      totalAnswerChanges: perQuestion.reduce((s, q) => s + q.answerChanges, 0),
      totalIdleMs: perQuestion.reduce((s, q) => s + q.idleMs, 0),
      abandoned: abandoned && !submitted,
      challengeMode,
    },
  };
}
