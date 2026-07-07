import { API_BASE_URL } from './axios';
import { useAuthStore } from '../store/auth.store';

export type TelemetryEventType =
  | 'QUIZ_STARTED'
  | 'QUESTION_VIEWED'
  | 'ANSWER_SELECTED'
  | 'ANSWER_CHANGED'
  | 'NAVIGATION'
  | 'IDLE_GAP'
  | 'TIMER_PRESSURE'
  | 'TAB_HIDDEN'
  | 'TAB_RETURNED'
  | 'QUIZ_SUBMITTED'
  | 'QUIZ_ABANDONED';

interface BufferedEvent {
  type: TelemetryEventType;
  ts: number;
  questionId?: string;
  data?: Record<string, unknown>;
}

const FLUSH_AFTER_EVENTS = 10;
const FLUSH_AFTER_MS = 15_000;
const IDLE_GAP_MS = 15_000;

/**
 * Fire-and-forget behavior-event buffer for one quiz attempt. Nothing in here
 * ever throws or blocks the UI: sends use fetch with keepalive (so a final
 * flush survives tab close) and all failures are silently dropped.
 */
export class TelemetrySession {
  readonly sessionId: string =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  private events: BufferedEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastEmitTs = Date.now();
  private readonly quizId: string;

  constructor(quizId: string) {
    this.quizId = quizId;
  }

  emit(type: TelemetryEventType, extra: { questionId?: string; data?: Record<string, unknown> } = {}) {
    try {
      const now = Date.now();
      const gap = now - this.lastEmitTs;
      // A long gap ending in TAB_RETURNED is tab-away time, not on-question
      // idling — the hidden duration is reported by the event itself.
      if (gap > IDLE_GAP_MS && type !== 'QUIZ_STARTED' && type !== 'TAB_RETURNED') {
        this.events.push({ type: 'IDLE_GAP', ts: now, questionId: extra.questionId, data: { gapMs: gap } });
      }
      this.lastEmitTs = now;
      this.events.push({ type, ts: now, questionId: extra.questionId, data: extra.data });

      if (this.events.length >= FLUSH_AFTER_EVENTS) this.flush();
      else this.schedule();
    } catch {
      // telemetry must never disturb the quiz
    }
  }

  flush() {
    try {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      if (this.events.length === 0) return;

      const token = useAuthStore.getState().accessToken;
      if (!token) {
        this.events = [];
        return;
      }

      const body = JSON.stringify({
        sessionId: this.sessionId,
        quizId: this.quizId,
        events: this.events.splice(0),
      });

      // keepalive lets the final flush complete during unload; plain fetch
      // (not the axios instance) so telemetry failures never trigger the
      // shared error toasts or token-refresh logic.
      void fetch(`${API_BASE_URL}/telemetry/events`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body,
      }).catch(() => {});
    } catch {
      // drop silently
    }
  }

  private schedule() {
    if (this.timer !== null) return;
    this.timer = setTimeout(() => this.flush(), FLUSH_AFTER_MS);
  }
}
