# GenLearn — Deployment Guide

Production architecture:

```
GitHub Repository
        │
        ├── frontend  ──►  Vercel
        ├── backend   ──►  Render (Web Service)
        └── ai-service ─►  Render (Web Service, optional)

        Backend + ai-service ──► MongoDB Atlas
                             ──► Managed Redis
```

The backend is deployed **directly from the `backend/` directory** (Render Root
Directory = `backend`) and builds independently — it has its own
`pnpm-lock.yaml` and `pnpm-workspace.yaml`, so the repo root is never deployed.

A `render.yaml` blueprint at the repo root provisions both services; the manual
steps below are equivalent if you prefer to configure the dashboard by hand.

---

## 1. Render Deployment Checklist (Backend)

| Setting | Value |
| --- | --- |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `corepack enable && pnpm install --frozen-lockfile && pnpm build` |
| **Start Command** | `node dist/main` |
| **Health Check Path** | `/health` |
| **Node version** | `NODE_VERSION=22` |

### Required environment variables

Set these in the Render dashboard (or via the blueprint prompts). **None are
committed** — `.env` is gitignored; `backend/.env.example` documents every one.

Secrets (set per-environment, never commit):
- `DATABASE_URL` — MongoDB Atlas SRV string (`mongodb+srv://…/<db>?retryWrites=true`)
- `REDIS_URL` — managed Redis URL (`rediss://…` if TLS)
- `JWT_SECRET` — 64+ char random secret
- `INTERNAL_API_KEY` — shared secret; must equal the ai-service value
- `SMTP_PASSWORD` — Resend API key
- `AI_SERVICE_URL` — internal URL of the ai-service
- `FRONTEND_URL` — the Vercel production URL

Non-secret config:
- `NODE_ENV=production`
- `JWT_ACCESS_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`
- `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`, `SMTP_USER=resend`, `SMTP_FROM=…`
- `CORS_ORIGINS` — optional comma-separated extra origins
- `ALLOW_VERCEL_PREVIEWS` — `true` to allow `*.vercel.app` preview URLs
- Feature flags: `BEHAVIOR_TELEMETRY_ENABLED`, `ADAPTIVE_LEARNING_ENABLED`,
  `RAG_GENERATION_ENABLED`, `ADAPTIVE_QUIZ_GENERATION_ENABLED`,
  `ADAPTIVE_LESSON_GENERATION_ENABLED` (all default `false`)

> **Do not set `PORT`.** Render injects it; the app reads `process.env.PORT`
> and binds `0.0.0.0`.

### MongoDB Atlas prerequisites
- Create a cluster and a database user.
- Network Access → allow Render egress. Render does not publish static IPs on
  the free tier, so use `0.0.0.0/0` (or a Render static-IP add-on for stricter
  control) and rely on the SRV credentials.

---

## 2. Vercel Deployment Checklist (Frontend)

| Setting | Value |
| --- | --- |
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `pnpm build` (default) |
| **Output Directory** | `dist` (default) |

### Required environment variables
- `VITE_API_URL` — the **Render backend origin without the `/api/v1` suffix**,
  e.g. `https://genlearn-backend.onrender.com`. The app appends `/api/v1`
  automatically (see `frontend/src/lib/axios.ts`).
- `VITE_BEHAVIOR_TELEMETRY_ENABLED` — `true`/`false` as desired.

`frontend/vercel.json` already rewrites all routes to `/index.html` for SPA
client-side routing.

### After deploying the frontend
Set the backend's `FRONTEND_URL` (and/or `CORS_ORIGINS`) to the Vercel
production URL so browser requests pass CORS. To allow Vercel **preview**
deployments, set `ALLOW_VERCEL_PREVIEWS=true` on the backend.

---

## 3. Deployment Verification

### Verified locally against the production build
Running the compiled backend (`NODE_ENV=production node dist/main`) against
**MongoDB Atlas**:

```
$ curl https://<backend>/health
{"status":"ok","info":{"mongodb":{"status":"up"}},"error":{},
 "details":{"mongodb":{"status":"up"}},
 "service":"genlearn-backend","version":"1.0.0",
 "timestamp":"2026-07-12T14:34:38.524Z"}
```

Confirmed:
- ✅ `pnpm install` + `pnpm build` succeed; `tsc --noEmit` clean
- ✅ Production process starts and binds the injected `PORT` on `0.0.0.0`
- ✅ Connects to MongoDB Atlas (`mongodb: up` in the health payload)
- ✅ `GET /health` returns `200` with status/service/version/timestamp
- ✅ `/api/v1/health` returns `404` — health is intentionally outside the API
  prefix so Render probes hit `/health`
- ✅ CORS reflects an allowed origin with `Access-Control-Allow-Credentials`
- ✅ Graceful shutdown hooks enabled (`app.enableShutdownHooks()`) so SIGTERM
  during a Render deploy drains queue workers and closes Mongo/Redis

### Post-deploy smoke test (run after Render + Vercel are live)
1. `curl https://<render-backend>/health` → `200`, `mongodb: up`.
2. Open the Vercel URL, register/login → confirms auth + Atlas writes.
3. In the browser devtools Network tab, confirm API calls hit
   `https://<render-backend>/api/v1/...` with no CORS errors.
4. Upload a document / generate a quiz → confirms upload + adaptive APIs and
   (if deployed) the ai-service round-trip.

---

## Notes
- **No Railway.** All Railway URLs, config, and code comments have been removed;
  the platform is now Render for the backend and ai-service.
- The `ai-service` is Render-ready (`render.yaml` + `PORT`-aware Dockerfile) but
  deploying it is optional depending on whether RAG/AI features are enabled.
- `docker-compose.yml` remains for local development only.
