# Developer Guide

How the codebase is organized and how to extend it. For structure see
[Folder Structure](FolderStructure.md); for the running system see
[Architecture](Architecture.md).

## Where major systems live

| System | Location |
| --- | --- |
| REST API surface | `backend/src/modules/*/*.controller.ts` |
| Business logic | `backend/src/modules/*/*.service.ts` |
| Persistence models | `backend/src/modules/*/schemas/*.schema.ts` |
| Async jobs | `backend/src/modules/*/workers/*.processor.ts` |
| AI orchestration | `backend/src/modules/cognitive-engine`, `.../ai-gateway` |
| Adaptive engine | `backend/src/modules/learner-model` |
| AI generation/RAG | `ai-service/app/api/routes`, `ai-service/app/services` |
| Frontend pages | `frontend/src/pages/<feature>` |
| Frontend API clients | `frontend/src/api/*.api.ts` |
| Shared UI | `frontend/src/components/ui` |

## Adding a backend feature

1. Create a module folder under `src/modules/<feature>/` with `*.module.ts`,
   `*.controller.ts`, `*.service.ts`, and `schemas/`/`dto/` as needed.
2. Register the module in `src/app.module.ts` (or import it where it's used).
3. Define Mongoose schemas with `@Schema({ collection: '…', timestamps: true })`;
   add `deletedAt` for soft-deletable, user-owned data.
4. Validate input with DTOs + `class-validator` (the global `ValidationPipe`
   whitelists and rejects unknown fields).
5. Protect routes by default; add `@Public()` for open endpoints and
   `@Roles(...)` for role-restricted ones.
6. Return `{ data: ... }` from handlers to match the response envelope.
7. For slow work, add a BullMQ queue + `workers/*.processor.ts` and expose a
   `GET .../:id/status` endpoint instead of blocking the request.
8. Gate new adaptive/AI behavior behind a flag in `common/feature-flags.ts`.

## Adding an AI capability

1. Add a route module under `ai-service/app/api/routes/` and register it in
   `app/api/router.py`.
2. Reuse `services/gemini.py` for model calls and `services/retrieval.py` for
   RAG; keep prompt construction in the route.
3. In the backend, add a typed method to `AiGatewayService` and surface it via
   `CognitiveEngineService`, then call it from the feature module.
4. Keep the AI service internal — it is reached only through the gateway with the
   `X-Internal-Key` header.

## Adding a frontend feature

1. Add an API client in `src/api/<feature>.api.ts` using the shared `axios`
   instance.
2. Add a page under `src/pages/<feature>/` and a lazy route in `App.tsx`.
3. Use TanStack Query for server state; reuse `components/ui/*` primitives
   (including `Spinner` and `EmptyState`) rather than new markup.
4. Co-locate a `*.test.tsx`.

## Coding conventions (already in use)

- **TypeScript** throughout the frontend and backend; Python (typed with
  Pydantic settings) in the AI service.
- **NestJS module boundaries**: controllers stay thin; logic lives in services.
- **Uniform envelopes**: `{ data }` on success, `{ error: { code, message,
  statusCode } }` on failure (see [Backend](Backend.md)).
- **Soft deletes** via `deletedAt`; **timestamps** on most collections.
- **Feature flags** default off; new adaptive behavior must not change existing
  behavior until enabled.
- **Tests co-located**: `*.spec.ts` (backend/Jest), `*.test.tsx` (frontend/
  Vitest), `test_*.py` (AI service/pytest).
- **Linting/formatting**: backend ESLint + Prettier; frontend `oxlint`.

## Testing

```bash
cd backend    && pnpm test        # Jest
cd frontend   && pnpm test        # Vitest
cd ai-service && pytest           # pytest
```

## Related documents
- [Backend](Backend.md) · [Frontend](Frontend.md) · [AI Architecture](AIArchitecture.md) · [Contributing](Contributing.md)
