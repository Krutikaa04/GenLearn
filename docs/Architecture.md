# Architecture

GenLearn is a three-service system: a React frontend, a NestJS backend, and a
FastAPI AI service, backed by MongoDB and Redis.

```
Browser
  │  HTTPS (Bearer access token + refresh cookie)
  ▼
Frontend (React/Vite SPA)
  │  REST /api/v1
  ▼
Backend (NestJS)  ──────────────►  MongoDB   (system of record + vector store)
  │  ▲                         ──►  Redis     (BullMQ queues)
  │  │  internal HTTP (X-Internal-Key)
  ▼  │
AI service (FastAPI)  ─────────►  MongoDB   (vector search for RAG)
  │
  ▼
Google Gemini API
```

## Components

### Frontend
React 19 + Vite SPA. Talks only to the backend over `/api/v1`. Holds the access
token in memory (Zustand) and relies on an HTTP-only refresh cookie for silent
re-authentication. Server state is managed with TanStack Query. See
[Frontend](Frontend.md).

### Backend
NestJS application and the **only** service exposed to the browser. It owns:

- Authentication & authorization (JWT + role guards).
- Persistence of all domain data via Mongoose.
- Orchestration of AI work through the **AI Gateway** module, which is the sole
  caller of the AI service.
- Asynchronous processing via **BullMQ** queues (document processing,
  lesson/quiz/flashcard generation, telemetry ingestion & feature engineering).

Routes are versioned under `/api/v1`; the health probe stays at `/health`. See
[Backend](Backend.md).

### AI Services
FastAPI microservice under `/ai/v1`, callable only by the backend using a shared
`INTERNAL_API_KEY` (`X-Internal-Key` header). Wraps Google Gemini for text
generation and embeddings, performs document chunking/extraction, and runs RAG
retrieval against MongoDB vector search. See [AI Architecture](AIArchitecture.md).

### Cognitive Engine
Backend module (`cognitive-engine`) that is the backend-side entry point to all
generative capabilities — quiz, lesson, flashcard, tutor chat, RAG query,
study plan and document processing. It delegates the actual model calls to the
AI Gateway, keeping feature modules decoupled from the AI service transport.

### Persistent Learner Intelligence
Represented by the `learner-model` module and its collections
(`learner_profiles`, `concept_mastery`, `learner_timeline`). It maintains a
durable model of each learner: per-concept mastery and confidence, misconception
flags, trends, retention, intervention effectiveness, and a chronological
timeline of learning events. Updated on every quiz submission.

### Autonomous Learning Planner
`autonomous-planner.service.ts` regenerates a per-learner `learning_plans`
document describing the next recommended session — objective, target concepts,
whether a lesson/quiz/flashcards are needed, estimated minutes, and reason codes.
Surfaced on the dashboard as "Continue Learning".

### Explainable Intelligence Engine
`explainable-intelligence.service.ts` turns raw mastery/decision data into a
human-readable recommendation with a rationale (`why`), supporting `evidence`,
an `expectedOutcome`, and a `confidence` level. Consumed by the dashboard's
"Recommended next" card.

### Learning Intelligence & Prediction
`learning-intelligence.service.ts` derives higher-level insights: concept
progress, a revision forecast, retention/mastery predictions, an AI-coach
summary, and a weekly summary. Exposed under the `/lips` API.

### RAG
Document text is extracted, chunked, and embedded by the AI service; chunks and
their vectors are stored in `document_chunks`. At generation/chat time the AI
service embeds the query and retrieves the most relevant chunks via MongoDB
vector search to ground the model's response. See
[AI Architecture](AIArchitecture.md#rag-pipeline).

### Database
MongoDB is the single datastore for both domain data and RAG vectors; Redis
backs the job queues. See [Database](Database.md).

### Authentication
Stateless JWT: a short-lived access token (Bearer header) plus a long-lived
refresh token delivered as an HTTP-only cookie. A global `JwtAuthGuard` protects
every route except those marked `@Public()`; a global `RolesGuard` enforces
`@Roles('admin' | 'teacher' | 'student')`. See [Backend](Backend.md#authentication).

## How they interact

1. The browser authenticates against the backend and receives an access token.
2. Feature requests hit the backend REST API.
3. For generative features the backend (via a queue worker or handler) calls the
   Cognitive Engine → AI Gateway → AI service.
4. The AI service optionally performs RAG retrieval, calls Gemini, and returns a
   structured result.
5. The backend persists results and updates learner intelligence.
6. The frontend polls status endpoints and renders the finished artifact.

## Related documents
- [AI Architecture](AIArchitecture.md)
- [Adaptive Learning](AdaptiveLearning.md)
- [Backend](Backend.md) · [Frontend](Frontend.md) · [Database](Database.md) · [API](API.md)
