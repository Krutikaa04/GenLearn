# Backend

The backend is a NestJS application in `backend/`. It is the system of record,
the API surface for the frontend, and the orchestrator of all AI work.

## Bootstrap (`src/main.ts`)

- Global prefix `api/v1` (the `/health` route is excluded).
- Security: `helmet`, `cookie-parser`, CORS driven by env
  (`FRONTEND_URL` / `CORS_ORIGINS` / `ALLOW_VERCEL_PREVIEWS`).
- Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Global `AllExceptionsFilter` (uniform error envelope).
- Global `JwtAuthGuard` + `RolesGuard`.
- Swagger at `/api/docs` in non-production.
- Startup retry loop for transient MongoDB/Redis failures; graceful shutdown
  hooks so SIGTERM drains queue workers.

## Modules (`src/modules/`)

| Module | Responsibility |
| --- | --- |
| `auth` | Registration, login, JWT issue/refresh, email verification, password reset, profile |
| `document` | Upload, storage, processing (queue), RAG "ask", flashcard trigger |
| `lesson` | Lesson generation (queue) and retrieval |
| `quiz` | Quiz generation (queue), adaptive next, submission/grading, review |
| `flashcard` | Flashcard set generation (queue), SM-2 review scheduling |
| `analytics` | Progress, weak topics, badge catalog |
| `admin` | Platform stats and user management (admin only) |
| `tutor` | AI tutor chat |
| `conversation` | Persistent tutor conversations |
| `studyplan` | Study-plan generation |
| `classroom` | Teacher classrooms, join codes, dashboards, student reports |
| `telemetry` | Behavioral event ingestion + feature engineering (queues) |
| `learner-model` | Adaptive engine: mastery, planner, explainability, LIPS |
| `cognitive-engine` | Backend-side uniform API to all generative capabilities |
| `ai-gateway` | HTTP transport to the AI service (typed payloads/results) |

Cross-cutting code lives in `src/common/` (`guards/`, `filters/`, `decorators/`,
`feature-flags.ts`) and `src/health/`.

## Asynchronous processing

Long-running work runs on **BullMQ** queues (Redis). Each such module has a
`workers/*.processor.ts`:

- `document-processor` — extract, chunk, embed uploaded documents
- `lesson-generator`, `quiz-generator`, `flashcard-generator`
- `telemetry-ingestion`, `feature-engineering`

The corresponding create endpoints return immediately with a `generating` status;
clients poll `GET .../:id/status`.

## Authentication

- **Access token**: short-lived JWT sent as `Authorization: Bearer <token>`.
- **Refresh token**: long-lived, delivered as an HTTP-only cookie; `POST
  /auth/refresh` mints a new access token.
- **Guards**: `JwtAuthGuard` is global — mark open routes with `@Public()`.
  `RolesGuard` enforces `@Roles('admin' | 'teacher' | 'student')`.
- Expiries configurable via `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN`.

Security details are also captured in the design handbook
(`handbook/03-backend/10-authentication-and-security.md`).

## Response & error envelopes

Success responses are wrapped as `{ "data": ... }`. Errors use the
`AllExceptionsFilter` shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "statusCode": 400 } }
```

Common codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMIT_EXCEEDED` (429),
`INTERNAL_SERVER_ERROR` (500).

## Rate limiting

Global throttling via `ThrottlerModule` (60 requests / 60s). A 429 includes a
`Retry-After` header, which the frontend surfaces to the user.

## Related documents
- [API Reference](API.md) · [Database](Database.md) · [Architecture](Architecture.md)
- [Developer Guide](DeveloperGuide.md)
