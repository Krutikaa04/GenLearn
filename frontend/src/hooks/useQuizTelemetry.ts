import { useEffect, useRef } from 'react';
import { featureFlags } from '../lib/featureFlags';
import { TelemetrySession } from '../lib/telemetry';

interface QuizForTelemetry {
  quizId: string;
  questions?: { questionId: string }[];
  challengeMode?: boolean;
  timeLimitMinutes?: number | null;
}

interface QuizTelemetryArgs {
  quiz: QuizForTelemetry | undefined;
  current: number;
  answers: Record<string, number>;
  timeLeft: number | null;
  result: unknown;
}

/**
 * Observes the QuizTaker's existing state transitions and emits behavior
 * events — no quiz handler is wrapped or modified. When the telemetry flag
 * is off this hook does nothing at all.
 */
export function useQuizTelemetry({ quiz, current, answers, timeLeft, result }: QuizTelemetryArgs) {
  const enabled = featureFlags.behaviorTelemetry;

  const session = useRef<TelemetrySession | null>(null);
  const prevAnswers = useRef<Record<string, number>>({});
  const prevIndex = useRef(0);
  const questionViewTs = useRef(Date.now());
  const submitted = useRef(false);

  // QUIZ_STARTED + first QUESTION_VIEWED once the quiz data arrives
  useEffect(() => {
    if (!enabled || !quiz?.quizId || session.current) return;
    session.current = new TelemetrySession(quiz.quizId);
    session.current.emit('QUIZ_STARTED', {
      data: { questionCount: quiz.questions?.length ?? 0, challengeMode: !!quiz.challengeMode },
    });
    questionViewTs.current = Date.now();
    session.current.emit('QUESTION_VIEWED', {
      questionId: quiz.questions?.[0]?.questionId,
      data: { index: 0 },
    });
  }, [enabled, quiz]);

  // NAVIGATION + QUESTION_VIEWED on question-index changes
  useEffect(() => {
    const s = session.current;
    if (!s || current === prevIndex.current) return;
    s.emit('NAVIGATION', { data: { from: prevIndex.current, to: current } });
    s.emit('QUESTION_VIEWED', {
      questionId: quiz?.questions?.[current]?.questionId,
      data: { index: current },
    });
    prevIndex.current = current;
    questionViewTs.current = Date.now();
  }, [current, quiz]);

  // ANSWER_SELECTED / ANSWER_CHANGED by diffing the answers map — catches
  // both the click path and the keyboard path without touching either.
  useEffect(() => {
    const s = session.current;
    if (!s) return;
    for (const [questionId, selectedIndex] of Object.entries(answers)) {
      const prev = prevAnswers.current[questionId];
      if (prev === selectedIndex) continue;
      if (prev === undefined) {
        s.emit('ANSWER_SELECTED', {
          questionId,
          data: { selectedIndex, msSinceQuestionView: Date.now() - questionViewTs.current },
        });
      } else {
        s.emit('ANSWER_CHANGED', { questionId, data: { fromIndex: prev, toIndex: selectedIndex } });
      }
      if (quiz?.challengeMode && quiz.timeLimitMinutes && timeLeft !== null) {
        const limitSeconds = quiz.timeLimitMinutes * 60;
        if (timeLeft < limitSeconds * 0.2) {
          s.emit('TIMER_PRESSURE', { questionId, data: { timeLeftSeconds: timeLeft } });
        }
      }
    }
    prevAnswers.current = { ...answers };
  }, [answers, quiz, timeLeft]);

  // QUIZ_SUBMITTED when the result state appears (covers manual submit,
  // keyboard submit, and challenge-mode auto-submit alike)
  useEffect(() => {
    const s = session.current;
    if (!s || !result || submitted.current) return;
    submitted.current = true;
    s.emit('QUIZ_SUBMITTED', {});
    s.flush();
  }, [result]);

  // Tab-switch integrity signals + flush when the tab hides;
  // QUIZ_ABANDONED + final flush on unmount. Leaving the tab mid-question
  // (e.g. to look up the answer) is a key trust signal for the learner model.
  const hiddenAt = useRef<number | null>(null);
  const quizRef = useRef(quiz);
  quizRef.current = quiz;
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      const s = session.current;
      const questionId = quizRef.current?.questions?.[prevIndex.current]?.questionId;
      if (document.visibilityState === 'hidden') {
        if (s && !submitted.current) {
          hiddenAt.current = Date.now();
          s.emit('TAB_HIDDEN', { questionId, data: { index: prevIndex.current } });
        }
        s?.flush();
      } else if (hiddenAt.current !== null) {
        s?.emit('TAB_RETURNED', {
          questionId,
          data: { index: prevIndex.current, hiddenMs: Date.now() - hiddenAt.current },
        });
        hiddenAt.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      const s = session.current;
      if (s) {
        if (!submitted.current) {
          s.emit('QUIZ_ABANDONED', { data: { lastQuestionIndex: prevIndex.current } });
        }
        s.flush();
      }
    };
  }, [enabled]);
}
