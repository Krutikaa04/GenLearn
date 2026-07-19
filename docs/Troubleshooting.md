# Troubleshooting

Common issues and their resolutions. See [Environment Setup](EnvironmentSetup.md)
for variable definitions.

## Environment & startup

**Backend exits on boot / can't reach MongoDB or Redis.**
`main.ts` retries the connection a few times before giving up. Verify
`DATABASE_URL` and `REDIS_URL`, and (in Compose) that the `mongodb`/`redis`
health checks are passing. With Docker, services must be on the
`genlearn_network` — start everything via `docker compose up`.

**Backend starts but jobs never finish** (documents stuck `processing`, lessons/
quizzes stuck `generating`). BullMQ workers need Redis. Confirm `REDIS_URL` is
reachable and the AI service is up and reachable at `AI_SERVICE_URL`.

## AI configuration

**AI calls fail / capabilities return errors.** Check `GEMINI_API_KEY` is set on
the AI service and valid. Confirm `MODEL_NAME` and `EMBEDDING_MODEL` are valid
Gemini model names.

**`401`/`403` from the AI service.** The backend and AI service `INTERNAL_API_KEY`
values must be identical; the backend sends it as the `X-Internal-Key` header.

**RAG returns no context / grounding is empty.** Ensure `RAG_GENERATION_ENABLED`
is `true` on **both** backend and AI service, that documents finished processing
(`chunkCount > 0`), and that the MongoDB vector search index exists on
`document_chunks.embedding` (Atlas).

## Database

**Vector search errors on Atlas.** The vector index must be created before
enabling RAG. Local MongoDB (Compose) supports the app schema but vector search
requires an Atlas-compatible index.

**Data appears "deleted" but still queried.** Records use soft deletes
(`deletedAt`); make sure new queries exclude soft-deleted documents.

## Authentication

**Login succeeds but requests 401 shortly after.** The access token is
short-lived (`JWT_ACCESS_EXPIRES_IN`, default 15m). The frontend auto-refreshes
via `/auth/refresh` using the HTTP-only cookie — if refresh fails, confirm the
cookie is being set and sent (CORS `credentials` + correct `FRONTEND_URL`).

**CORS errors in the browser.** The backend allows `FRONTEND_URL` and any
`CORS_ORIGINS`. Set these to the exact frontend origin; for Vercel previews set
`ALLOW_VERCEL_PREVIEWS=true`.

**Account locked / can't log in.** Repeated failures set `failedLoginAttempts`
and `lockedUntil`; wait for the lock to expire.

**Too many requests (`429`).** Global throttling is 60 requests / 60s; the
response includes `Retry-After`. The frontend shows a single rate-limit toast.

## Deployment

**Render backend build fails.** Root Directory must be `backend`, Node 22, build
`corepack enable && pnpm install --frozen-lockfile && pnpm build`. See
[Deployment](Deployment.md).

**Frontend can't reach the API in production.** `VITE_API_URL` must be the
backend origin **without** `/api/v1` (the client appends it). Then set the
backend `FRONTEND_URL`/`CORS_ORIGINS` to the Vercel URL.

**Health check failing on Render.** The probe path is `/health` (outside the API
prefix); `/api/v1/health` intentionally returns `404`.

## Build failures

**Frontend `pnpm build` fails on types.** The build runs `tsc -b` before Vite —
fix reported type errors. Run `pnpm test` (Vitest) to catch regressions.

**Backend `pnpm build` fails.** Runs `nest build`; ensure imports and DI
providers are registered in the owning module.

## Related documents
- [Environment Setup](EnvironmentSetup.md) · [Deployment](Deployment.md) · [Backend](Backend.md)
