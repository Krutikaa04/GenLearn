import { Injectable } from '@nestjs/common';
import { TutorChatPayload } from '../ai-gateway/ai-gateway.service';
import { LearnerContext } from './ai-task.types';

/**
 * Central mapping from structured feature data + learner context to the exact
 * payload the AI provider receives. Feature modules pass structured data only;
 * how that becomes an AI request lives here.
 *
 * Prompt *strings* live in the AI service (provider-side templates); this
 * backend-side builder owns the structured inputs those templates consume. Most
 * task payloads are already provider-shaped and pass straight through — the
 * meaningful work today is grounding the tutor in learner context. New task
 * types add their builder method here rather than assembling context ad hoc in
 * a feature module.
 */
@Injectable()
export class PromptBuilder {
  /**
   * Enriches the tutor payload with a compact learner-context summary via the
   * provider's existing `studentContext` channel. Strictly additive: existing
   * keys are preserved, a caller-supplied `learnerContext` is never overwritten,
   * and an empty context leaves the payload untouched — so behaviour is
   * unchanged for learners without history.
   */
  buildTutorPayload(payload: TutorChatPayload, context: LearnerContext | null): TutorChatPayload {
    if (!context || (!context.weakConcepts.length && !context.strongConcepts.length)) {
      return payload;
    }
    const base = payload.studentContext ?? {};
    if ('learnerContext' in base) return payload;

    return {
      ...payload,
      studentContext: {
        ...base,
        learnerContext: {
          weakConcepts: context.weakConcepts.map((c) => c.conceptId),
          strongConcepts: context.strongConcepts.map((c) => c.conceptId),
        },
      },
    };
  }
}
