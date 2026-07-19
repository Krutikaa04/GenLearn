# Deployment

> The authoritative, step-by-step checklists live in the repo-root
> [DEPLOYMENT.md](../DEPLOYMENT.md). This page summarizes the production topology
> and the build process; consult the root guide for exact dashboard settings and
> the post-deploy verification steps.

## Topology

```
GitHub
  ├── frontend   → Vercel
  ├── backend    → Render (web service)
  └── ai-service → Render (web service, optional)

backend + ai-service → MongoDB Atlas
                     → Managed Redis
```

The backend deploys directly from the `backend/` directory (Render Root
Directory = `backend`) with its own lockfile, so the repo root is never built.
The `render.yaml` blueprint provisions both server services.

## Frontend deployment (Vercel)

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

Env: `VITE_API_URL` = the backend origin **without** `/api/v1`
(e.g. `https://genlearn-backend.onrender.com`); `frontend/vercel.json` rewrites
all routes to `index.html` for SPA routing. After the first deploy, set the
backend's `FRONTEND_URL`/`CORS_ORIGINS` to the Vercel URL.

## Backend deployment (Render)

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Runtime | Node (`NODE_VERSION=22`) |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `node dist/main` |
| Health Check | `/health` |

Do **not** set `PORT` — Render injects it and the app binds `0.0.0.0`.

## AI service deployment (Render, optional)

| Setting | Value |
| --- | --- |
| Root Directory | `ai-service` |
| Runtime | Python (`PYTHON_VERSION=3.11`) |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2` |
| Health Check | `/health` |

## Environment variables

The full list with descriptions is in [Environment Setup](EnvironmentSetup.md).
Secrets (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `INTERNAL_API_KEY`,
`GEMINI_API_KEY`, `SMTP_PASSWORD`, `AI_SERVICE_URL`, `FRONTEND_URL`) are marked
`sync: false` in the blueprint and entered per-environment — never committed.
`INTERNAL_API_KEY` **must match** between backend and AI service.

## Production configuration

- `NODE_ENV=production` disables Swagger (`/api/docs`).
- Adaptive feature flags are enabled in the production blueprint
  (`ADAPTIVE_LEARNING_ENABLED`, `RAG_GENERATION_ENABLED`, etc.); they default off
  in code.
- MongoDB Atlas network access must allow Render egress (Render free tier has no
  static IPs — use `0.0.0.0/0` with SRV credentials, or a static-IP add-on).
- Graceful shutdown hooks drain BullMQ workers on SIGTERM during deploys.

## Build process

- **Frontend**: `tsc -b && vite build` → static assets in `dist/` (route-level
  code splitting produces per-page chunks).
- **Backend**: `nest build` (via `pnpm build`) → `dist/`, started with
  `node dist/main`.
- **AI service**: no compile step; `uvicorn` serves `main:app` directly.

## Local (Docker Compose)

`docker compose up` runs all services plus MongoDB and Redis for development
only. See [Environment Setup](EnvironmentSetup.md).

## Related documents
- [DEPLOYMENT.md](../DEPLOYMENT.md) · [Environment Setup](EnvironmentSetup.md) · [Troubleshooting](Troubleshooting.md)
