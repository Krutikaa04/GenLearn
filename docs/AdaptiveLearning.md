# Adaptive Learning

GenLearn's adaptive systems live in the backend `learner-model` module and are
driven by quiz activity. This document describes the implemented cycle.

## Data model

| Collection | Role |
| --- | --- |
| `learner_profiles` | Durable per-learner profile: learning stage, active topics, velocity/consistency/support-dependency, trends, retention, intervention effectiveness, reflections |
| `concept_mastery` | Per-concept mastery (0–100), confidence (0–1), evidence count, misconception flags, trend, mastery history, review priority |
| `learning_plans` | The current planned next session (one per learner) |
| `pedagogical_decisions` | An audit log of adaptive decisions (trigger, action, difficulty, mastery before/after, reason codes) |
| `learner_timeline` | Chronological learning events per learner |

Full field lists: [Database](Database.md).

## Adaptive learning cycle

On quiz submission (`learner-model.service.ts → updateFromQuizSubmission`):

1. **Score & attribute** answers to concepts (`primaryConceptId` / `conceptIds`
   on each question).
2. **Update concept mastery** — adjust mastery, confidence and trend per concept,
   append to mastery history, raise/clear misconception flags, recompute review
   priority.
3. **Measure intervention effectiveness** — if this quiz followed a prior
   decision, record the mastery delta it produced.
4. **Record a pedagogical decision** capturing the trigger, chosen action, target
   concept, difficulty, and reason codes.
5. **Update the learner profile & timeline** with the session outcome.
6. **Regenerate the learning plan** (autonomous planner).

## Autonomous Learning Planner

`autonomous-planner.service.ts` produces/refreshes the learner's
`learning_plans` document:

- `status` — `awaiting_topic` or `active`
- `objective`, `topic`, `targetConcepts`
- `recommendedLesson` / `recommendedQuiz` / `recommendedFlashcards` (each with a
  `needed` flag)
- `estimatedMinutes`, `expectedOutcome`, `completionCriteria`
- `reasonCodes`

The dashboard "Continue Learning" card reads this via `GET /adaptive/plan`, and
"Continue learning" triggers an adaptive quiz (`POST /quizzes/adaptive/next`).

## Recommendation generation (Explainable Intelligence)

`explainable-intelligence.service.ts` builds an explainable recommendation from
concept mastery and recent decisions:

- `recommendation` (what to do next),
- `why[]` (rationale),
- `evidence[]` (data points),
- `expectedOutcome`,
- `confidence` (`high | medium | low`).

Exposed via `GET /adaptive/recommendation` and rendered in the dashboard
"Recommended next" card.

## Learning Intelligence & Prediction (LIPS)

`learning-intelligence.service.ts` derives insights over the learner model,
exposed under `/lips`:

| Endpoint | Output |
| --- | --- |
| `GET /lips/concept-progress` | Per-concept progress summary |
| `GET /lips/timeline` | Recent learning timeline events |
| `GET /lips/revision-forecast` | What is due for revision (retention-based) |
| `GET /lips/prediction` | Mastery/retention predictions |
| `GET /lips/insights` | Aggregated insights |
| `GET /lips/coach` | Concise AI-coach summary (today's focus, next milestone, revision) |
| `GET /lips/weekly-summary` | Weekly progress summary |

## Feature flags

The adaptive stack is gated so it can be rolled out incrementally (all default
`false`):

- `BEHAVIOR_TELEMETRY_ENABLED`
- `ADAPTIVE_LEARNING_ENABLED`
- `RAG_GENERATION_ENABLED`
- `ADAPTIVE_QUIZ_GENERATION_ENABLED`
- `ADAPTIVE_LESSON_GENERATION_ENABLED`

## Behavioral telemetry

The `telemetry` module ingests client-side quiz behavior (dwell time, answer
changes, idle time, tab switches, timer pressure) into `learning_events`, then a
feature-engineering worker aggregates it into `behavior_features` used as
additional signal for the learner model.

## Related documents
- [AI Architecture](AIArchitecture.md)
- [Database](Database.md)
- [API Reference](API.md)
