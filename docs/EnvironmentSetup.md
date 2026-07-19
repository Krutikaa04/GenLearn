# Environment Setup

## Prerequisites

- **Docker + Docker Compose** (simplest path), or for native runs:
  - Node **22** and **pnpm** (via `corepack enable`)
  - Python **3.11**
  - MongoDB and Redis instances

## Quick start (Docker Compose)

```bash
cp backend/.env.example    backend/.env
cp ai-service/.env.example ai-service/.env
docker compose up
```

Services: frontend `:5173`, backend `:3000`, AI service `:8000`,
MongoDB `:27017`, Redis `:6379`. The compose file wires health checks and shared
volumes; MongoDB/Redis credentials default to `admin/password` for local use.

## Native runs

```bash
# Backend
cd backend && pnpm install && pnpm start:dev     # :3000, Swagger at /api/docs

# AI service
cd ai-service && pip install -r requirements.txt
uvicorn main:app --reload --port 8000            # :8000, docs at /docs

# Frontend
cd frontend && pnpm install && pnpm dev          # :5173
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Default (dev) | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` disables Swagger |
| `PORT` | `3000` | Injected by Render in prod — don't hardcode |
| `DATABASE_URL` | local Mongo URI | MongoDB Atlas SRV string in prod |
| `REDIS_URL` | `redis://redis:6379` | `rediss://` if TLS |
| `JWT_SECRET` | — | 64+ char secret |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `AI_SERVICE_URL` | `http://ai-service:8000` | Internal AI service URL |
| `INTERNAL_API_KEY` | — | **Must match** the AI service value |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` | Mailtrap sandbox | Email delivery (Resend in prod) |
| `FRONTEND_URL` | `http://localhost:5173` | Email links + CORS |
| `CORS_ORIGINS` | — | Extra allowed origins (comma-separated) |
| `ALLOW_VERCEL_PREVIEWS` | `false` | Allow `*.vercel.app` previews |
| `BEHAVIOR_TELEMETRY_ENABLED` | `false` | Feature flag |
| `ADAPTIVE_LEARNING_ENABLED` | `false` | Feature flag |
| `RAG_GENERATION_ENABLED` | `false` | Feature flag |
| `ADAPTIVE_QUIZ_GENERATION_ENABLED` | `false` | Feature flag |
| `ADAPTIVE_LESSON_GENERATION_ENABLED` | `false` | Feature flag |

### AI service (`ai-service/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `8000` | Injected by Render in prod |
| `ENVIRONMENT` | `development` | `production` disables `/docs` |
| `GEMINI_API_KEY` | — | Google AI Studio key |
| `MODEL_NAME` | `gemini-2.5-flash` | Generation model (code default) |
| `EMBEDDING_MODEL` | `models/text-embedding-004` | Embedding model |
| `INTERNAL_API_KEY` | — | **Must match** the backend value |
| `MONGODB_URI` | local Mongo URI | Same cluster as backend in prod |
| `BACKEND_URL` | `http://backend:3000` | CORS allow-origin |
| `REDIS_URL` | `redis://redis:6379` | — |
| `RAG_GENERATION_ENABLED` | `false` | Feature flag |

### Frontend (`.env` / Vercel)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | Backend origin **without** `/api/v1` (the app appends it) |
| `VITE_BEHAVIOR_TELEMETRY_ENABLED` | `true`/`false` |

## MongoDB vector search (RAG)

RAG retrieval uses MongoDB vector search over `document_chunks.embedding`. On
Atlas, create a vector search index for that field before enabling
`RAG_GENERATION_ENABLED`.

## Related documents
- [Deployment](Deployment.md) · [Troubleshooting](Troubleshooting.md) · [Developer Guide](DeveloperGuide.md)
