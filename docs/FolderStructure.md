# Folder Structure

```
GenLearn/
├── frontend/              React 19 + Vite SPA
│   └── src/
│       ├── api/           Typed API clients (one per domain)
│       ├── pages/         Route pages, grouped by feature
│       ├── components/    ui/ primitives, layout/, gamification/
│       ├── hooks/         Reusable hooks
│       ├── lib/           axios, motion, featureFlags, telemetry
│       ├── store/         Zustand stores (auth, theme)
│       └── App.tsx        Router, providers, route guards
│
├── backend/               NestJS API (system of record + orchestrator)
│   └── src/
│       ├── modules/       Feature modules (see Backend.md)
│       │   ├── auth/ document/ lesson/ quiz/ flashcard/
│       │   ├── analytics/ admin/ tutor/ conversation/ studyplan/
│       │   ├── classroom/ telemetry/
│       │   ├── learner-model/     Adaptive engine (mastery, planner, LIPS)
│       │   ├── cognitive-engine/  Uniform generative API
│       │   └── ai-gateway/        HTTP transport to the AI service
│       ├── common/        guards/, filters/, decorators/, feature-flags.ts
│       ├── health/        Health controller
│       └── main.ts        Bootstrap (prefix, guards, CORS, Swagger)
│
├── ai-service/            FastAPI + Gemini microservice
│   ├── app/
│   │   ├── api/routes/    Per-capability routers (tutor, lessons, quizzes, rag, …)
│   │   ├── services/      gemini, chunker, retrieval, text_extractor, mongodb
│   │   ├── middleware/    Internal API-key auth
│   │   └── config.py      Settings (models, keys, URIs)
│   └── main.py            FastAPI app entry
│
├── handbook/              Product & architecture design handbook (planning artifacts)
├── docs/                  Production documentation (this set)
├── docker-compose.yml     Local multi-service dev environment
├── render.yaml            Render blueprint (backend + ai-service)
├── DEPLOYMENT.md          Detailed deployment checklists
└── PROJECT_CONTEXT_FOR_CLAUDE.md
```

## Folder responsibilities

- **`frontend/`** — the only user-facing app; talks solely to the backend.
- **`backend/`** — authentication, persistence, orchestration, and job queues.
  Feature modules follow a `controller / service / schemas / dto / workers`
  layout. Deploys independently from `backend/` (own lockfile).
- **`ai-service/`** — internal AI microservice; generation, embeddings, RAG.
  Never exposed to the browser.
- **`handbook/`** — the design/planning handbook (vision, PRDs, ADRs, sequence
  diagrams). Useful background; the `docs/` set is the source of truth for the
  *current* implementation.
- **`docs/`** — this production documentation set.

> Test files are co-located: `*.spec.ts` in the backend, `*.test.tsx`/`test_*.py`
> in the frontend and AI service. Build output (`dist/`), `node_modules/`,
> `.venv/`, and `uploads/` are not tracked as source.

## Related documents
- [Backend](Backend.md) · [Frontend](Frontend.md) · [AI Architecture](AIArchitecture.md)
