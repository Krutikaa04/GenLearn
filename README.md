# GenLearn

GenLearn is an AI-powered adaptive learning platform. Learners upload their own
documents, generate lessons, quizzes and flashcards from them, chat with an AI
tutor grounded in their material, and progress through an adaptive learning
loop that models what they know and plans what to study next.

The platform is split into three deployable services:

- **Frontend** — React 19 + Vite single-page app.
- **Backend** — NestJS REST API (the system of record and orchestrator).
- **AI service** — FastAPI microservice wrapping Google Gemini for generation,
  embeddings, and Retrieval-Augmented Generation (RAG).

---

## Key Features

- **Document ingestion & RAG** — upload PDF/DOCX/TXT/MD; documents are chunked,
  embedded, and stored for semantic retrieval.
- **AI lesson generation** — structured lessons (sections, key points, code
  examples) on any topic, optionally grounded in uploaded documents.
- **Quiz generation & grading** — multiple-choice quizzes with explanations,
  server-side scoring, and an adaptive challenge mode.
- **Flashcards** — auto-generated sets with SM-2 spaced-repetition scheduling.
- **AI tutor** — conversational tutoring grounded in the learner's documents.
- **Adaptive learning** — a concept-mastery model, an autonomous planner that
  proposes the next session, explainable recommendations, and learning
  predictions (see [Adaptive Learning](docs/AdaptiveLearning.md)).
- **Progress & analytics** — streaks, XP, badges, topic mastery, weak-topic
  detection.
- **Classrooms** — teachers create classrooms, students join by code, teachers
  view class dashboards and per-student reports.
- **Admin** — user management and platform statistics.

## Screenshots

_Add screenshots here._

| Dashboard | Adaptive Quiz | Progress |
| --- | --- | --- |
| _`docs/images/dashboard.png`_ | _`docs/images/quiz.png`_ | _`docs/images/progress.png`_ |

---

## High-Level Architecture

```
          ┌────────────┐        ┌─────────────────────┐        ┌────────────────┐
Browser → │  Frontend  │ HTTPS  │   Backend (NestJS)  │  HTTP  │  AI service    │
          │  React/Vite│ ─────► │   REST /api/v1      │ ─────► │  FastAPI /ai/v1│
          └────────────┘        │   Auth · Orchestrate│        │  Gemini · RAG  │
                                └──────────┬──────────┘        └───────┬────────┘
                                           │                           │
                                   ┌───────┴────────┐          ┌───────┴────────┐
                                   │ MongoDB  Redis │          │ MongoDB (vector│
                                   │ (data)  (queue)│          │  search)       │
                                   └────────────────┘          └────────────────┘
```

The backend is the only service the browser talks to. It owns authentication,
persistence, and job orchestration, and calls the AI service over an internal
HTTP channel (shared-secret header). Long-running work (document processing,
lesson/quiz/flashcard generation, telemetry) runs on **BullMQ** queues backed by
Redis; clients poll `*/status` endpoints for completion.

See [Architecture](docs/Architecture.md) for the full breakdown.

## AI Workflow

1. The backend receives a generate/chat request and enqueues or forwards it.
2. A worker (or request handler) calls the AI service `/ai/v1/*` endpoint with
   an `X-Internal-Key` header.
3. The AI service builds a prompt, optionally retrieves relevant document chunks
   (RAG) via MongoDB vector search, and calls Gemini.
4. The structured result is returned to the backend, persisted, and exposed to
   the client.

See [AI Architecture](docs/AIArchitecture.md).

## Adaptive Learning Workflow

On each quiz submission the backend updates the learner's **concept-mastery**
records, records a **pedagogical decision**, refreshes the **learner profile**
and **timeline**, and regenerates the **learning plan**. The dashboard surfaces
the planned next session, an explainable recommendation, and an AI-coach
summary.

See [Adaptive Learning](docs/AdaptiveLearning.md).

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query, Zustand, Framer Motion |
| Backend | NestJS, TypeScript, Mongoose (MongoDB), BullMQ (Redis), JWT auth, Swagger |
| AI service | FastAPI, Python 3.11, Google Gemini (`gemini-2.5-flash`), `text-embedding-004` |
| Data | MongoDB (documents + vector search), Redis (queues) |
| Infra | Docker Compose (local), Render (backend + AI service), Vercel (frontend) |

## Project Structure

```
GenLearn/
├── frontend/     React + Vite SPA
├── backend/      NestJS API (system of record + orchestrator)
├── ai-service/   FastAPI + Gemini microservice
├── handbook/     Product/architecture design handbook (planning artifacts)
├── docs/         Production documentation (this set)
├── docker-compose.yml
└── render.yaml
```

See [Folder Structure](docs/FolderStructure.md).

---

## Local Setup

Prerequisites: Docker + Docker Compose, or Node 22 + pnpm and Python 3.11 for
running services natively.

```bash
git clone <repo-url> GenLearn
cd GenLearn
# Copy and fill env files (see Environment Variables below)
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
docker compose up
```

This starts the frontend (`:5173`), backend (`:3000`), AI service (`:8000`),
MongoDB (`:27017`) and Redis (`:6379`). Full instructions:
[Environment Setup](docs/EnvironmentSetup.md).

## Environment Variables

| Service | Key variables |
| --- | --- |
| Backend | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `AI_SERVICE_URL`, `INTERNAL_API_KEY`, `SMTP_*`, `FRONTEND_URL`, `CORS_ORIGINS`, feature flags |
| AI service | `GEMINI_API_KEY`, `MODEL_NAME`, `EMBEDDING_MODEL`, `INTERNAL_API_KEY`, `MONGODB_URI`, `BACKEND_URL`, `REDIS_URL`, `RAG_GENERATION_ENABLED` |
| Frontend | `VITE_API_URL`, `VITE_BEHAVIOR_TELEMETRY_ENABLED` |

Full reference and defaults: [Environment Setup](docs/EnvironmentSetup.md).

### Running Frontend

```bash
cd frontend && pnpm install && pnpm dev      # http://localhost:5173
```

### Running Backend

```bash
cd backend && pnpm install && pnpm start:dev # http://localhost:3000
# Swagger (non-production): http://localhost:3000/api/docs
```

### Running AI Services

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000        # http://localhost:8000
# Docs (development): http://localhost:8000/docs
```

---

## Deployment

Frontend → Vercel, backend + AI service → Render, data on MongoDB Atlas +
managed Redis. A `render.yaml` blueprint provisions both server services. See
[Deployment](docs/Deployment.md) and the root [DEPLOYMENT.md](DEPLOYMENT.md).

## Documentation

- [Architecture](docs/Architecture.md)
- [AI Architecture](docs/AIArchitecture.md)
- [Adaptive Learning](docs/AdaptiveLearning.md)
- [Backend](docs/Backend.md)
- [Frontend](docs/Frontend.md)
- [API Reference](docs/API.md)
- [Database](docs/Database.md)
- [Folder Structure](docs/FolderStructure.md)
- [Deployment](docs/Deployment.md)
- [Developer Guide](docs/DeveloperGuide.md)
- [Environment Setup](docs/EnvironmentSetup.md)
- [Troubleshooting](docs/Troubleshooting.md)
- [Contributing](docs/Contributing.md)
- [Release Notes](docs/ReleaseNotes.md)

## License

No license file is currently present in the repository. Add a `LICENSE` file to
declare usage terms before public distribution.
