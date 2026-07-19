# API Reference

All backend endpoints are served under the `/api/v1` prefix (e.g.
`https://<host>/api/v1/auth/login`). The `/health` probe is the only route
outside the prefix.

## Conventions

- **Auth**: unless marked **Public**, every endpoint requires
  `Authorization: Bearer <accessToken>`. The global guard rejects missing/invalid
  tokens with `401 UNAUTHORIZED`. Some endpoints additionally require a role
  (`admin`, `teacher`, or `student`) and return `403 FORBIDDEN` otherwise.
- **Success envelope**: `{ "data": ... }`.
- **Error envelope**: `{ "error": { "code", "message", "statusCode" } }`.
  Shared codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401),
  `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409),
  `RATE_LIMIT_EXCEEDED` (429), `INTERNAL_SERVER_ERROR` (500). These are omitted
  per-endpoint below and apply globally.
- **Async resources** (documents, lessons, quizzes, flashcards) are created with
  a `generating`/`processing` status; poll the matching `.../:id/status`
  endpoint until `ready`.

Interactive request/response schemas are also browsable via Swagger at
`/api/docs` when running in non-production.

---

## Health

### `GET /health` — Public
Liveness/readiness probe (outside `/api/v1`). Returns service status and MongoDB
health for platform probes.

---

## Auth — `/auth`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/register` | Public | Create an account (student/teacher); sends a verification email |
| `POST /auth/login` | Public | Authenticate; returns an access token and sets the refresh cookie |
| `POST /auth/logout` | Bearer | Invalidate the session/refresh cookie |
| `POST /auth/refresh` | Public (refresh cookie) | Issue a new access token |
| `GET /auth/verify-email` | Public | Verify email via token |
| `POST /auth/resend-verification` | Public | Resend the verification email |
| `POST /auth/forgot-password` | Public | Send a password-reset link |
| `POST /auth/reset-password` | Public | Reset the password using a token |
| `GET /auth/me` | Bearer | Current user profile |
| `PATCH /auth/me` | Bearer | Update profile |
| `DELETE /auth/me` | Bearer | Delete the account |
| `PATCH /auth/me/email` | Bearer | Request an email change (confirmation sent) |
| `GET /auth/confirm-email-change` | Public | Confirm an email change via token |

**Login — request**
```json
{ "email": "user@example.com", "password": "••••••••" }
```
**Login — response**
```json
{ "data": { "accessToken": "<jwt>", "user": { "userId": "…", "email": "…", "role": "student" } } }
```
Errors: `401 UNAUTHORIZED` (bad credentials), `403 FORBIDDEN` (unverified/locked),
`400 VALIDATION_ERROR`.

---

## Documents — `/documents`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /documents/upload` | Bearer | Upload a file (multipart); enqueues processing |
| `GET /documents` | Bearer | List the user's documents |
| `GET /documents/:id` | Bearer | Get a document |
| `GET /documents/:id/status` | Bearer | Processing status (`processing`→`ready`/`failed`) |
| `DELETE /documents/:id` | Bearer | Soft-delete a document |
| `POST /documents/:id/ask` | Bearer | RAG question against the document |
| `POST /documents/:id/flashcards/generate` | Bearer | Generate a flashcard set from the document |

`POST /documents/:id/ask` — request `{ "question": "…" }`;
response `{ "data": { "answer": "…", "sources": [...] } }`.

---

## Lessons — `/lessons`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /lessons/generate` | Bearer | Generate a lesson (enqueued) |
| `GET /lessons` | Bearer | List lessons |
| `GET /lessons/:id/status` | Bearer | Generation status |
| `GET /lessons/:id` | Bearer | Get a lesson (sections, key points, takeaways) |
| `DELETE /lessons/:id` | Bearer | Soft-delete |

`POST /lessons/generate` — request
`{ "topic": "…", "difficulty": "beginner|intermediate|advanced", "documentIds": ["…"] }`;
response `{ "data": { "lessonId": "…", "status": "generating" } }`.

---

## Quizzes — `/quizzes`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /quizzes/generate` | Bearer | Generate a quiz (enqueued) |
| `POST /quizzes/adaptive/next` | Bearer | Generate the adaptive next quiz from the learner model |
| `GET /quizzes` | Bearer | List quizzes |
| `GET /quizzes/:id/status` | Bearer | Generation status |
| `GET /quizzes/:id` | Bearer | Get a quiz (questions without answer keys where appropriate) |
| `GET /quizzes/:id/review` | Bearer | Post-submission review with correct answers/explanations |
| `POST /quizzes/:id/submit` | Bearer | Submit answers; server grades and updates the learner model |
| `DELETE /quizzes/:id` | Bearer | Soft-delete |

`POST /quizzes/:id/submit` — request
`{ "answers": [{ "questionId": "…", "selectedIndex": 2 }] }`;
response `{ "data": { "score": 8, "totalQuestions": 10, ... } }`.
`POST /quizzes/adaptive/next` may return `NO_ADAPTIVE_PLAN` when the learner has
no active plan yet.

---

## Flashcards — `/flashcards`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /flashcards/generate` | Bearer | Generate a flashcard set (enqueued) |
| `GET /flashcards` | Bearer | List sets |
| `GET /flashcards/:id/status` | Bearer | Generation status |
| `GET /flashcards/due` | Bearer | Cards due for review (spaced repetition) |
| `GET /flashcards/:id` | Bearer | Get a set |
| `DELETE /flashcards/:id` | Bearer | Soft-delete |
| `PATCH /flashcards/:id/cards/:cardId/review` | Bearer | Record a review; updates SM-2 schedule |

`PATCH .../review` — request `{ "quality": 0-5 }` (recall grade); updates
`easeFactor`, `interval`, `repetitions`, `nextReviewAt`.

---

## Tutor & Conversations

### Tutor — `/tutor`
| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /tutor/chat` | Bearer | Ask the AI tutor (optionally grounded in documents) |

### Conversations — `/conversations`
| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /conversations/message` | Bearer | Send a message within a persistent conversation |
| `GET /conversations` | Bearer | List conversations |
| `GET /conversations/:id` | Bearer | Get a conversation with messages |
| `DELETE /conversations/:id` | Bearer | Soft-delete a conversation |

---

## Study plan — `/studyplan`
| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /studyplan/generate` | Bearer | Generate a study plan |

---

## Analytics — `/analytics`
| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /analytics/progress` | Bearer | Overall progress: streaks, XP, mastery, totals, topic mastery |
| `GET /analytics/weak-topics` | Bearer | Topics below mastery threshold |
| `GET /analytics/badges/catalog` | Bearer | Badge catalog |

---

## Adaptive — `/adaptive`
| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /adaptive/recommendation` | Bearer | Explainable "recommended next" (why/evidence/confidence) |
| `GET /adaptive/analysis/:quizId` | Bearer | Per-quiz adaptive analysis |
| `GET /adaptive/question-analysis` | Bearer | Recent per-question analysis |
| `GET /adaptive/plan` | Bearer | The autonomous learning plan (next session) |

---

## Learning Intelligence & Prediction — `/lips`
| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /lips/concept-progress` | Bearer | Per-concept progress |
| `GET /lips/timeline` | Bearer | Learning timeline events |
| `GET /lips/revision-forecast` | Bearer | What's due for revision |
| `GET /lips/prediction` | Bearer | Mastery/retention predictions |
| `GET /lips/insights` | Bearer | Aggregated insights |
| `GET /lips/coach` | Bearer | AI-coach summary |
| `GET /lips/weekly-summary` | Bearer | Weekly summary |

---

## Telemetry — `/telemetry`
| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /telemetry/events` | Bearer | Ingest a batch of client behavioral events |

---

## Classrooms — `/classrooms`
| Method & path | Auth (role) | Purpose |
| --- | --- | --- |
| `POST /classrooms` | teacher | Create a classroom |
| `GET /classrooms` | teacher | List the teacher's classrooms |
| `GET /classrooms/mine` | student | Classrooms the student has joined |
| `GET /classrooms/:id` | teacher | Get a classroom |
| `GET /classrooms/:id/dashboard` | teacher | Class dashboard/aggregates |
| `GET /classrooms/:id/students/:studentId/report` | teacher | Per-student report |
| `DELETE /classrooms/:id/students/:studentId` | teacher | Remove a student |
| `DELETE /classrooms/:id` | teacher | Delete a classroom |
| `POST /classrooms/join` | student | Join by `joinCode` |
| `POST /classrooms/:id/leave` | student | Leave a classroom |

---

## Admin — `/admin` (role: admin)
| Method & path | Auth (role) | Purpose |
| --- | --- | --- |
| `GET /admin/stats` | admin | Platform statistics |
| `GET /admin/users` | admin | List users |
| `GET /admin/users/:userId` | admin | Get a user |
| `PATCH /admin/users/:userId/status` | admin | Change a user's status (e.g. suspend) |

## Related documents
- [Backend](Backend.md) · [Database](Database.md) · [Adaptive Learning](AdaptiveLearning.md)
