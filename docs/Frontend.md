# Frontend

The frontend is a React 19 + Vite single-page app in `frontend/`, written in
TypeScript and styled with Tailwind CSS v4.

## Stack

- **React 19** + **Vite** (build/dev server)
- **React Router** for routing (routes are lazy-loaded and code-split)
- **TanStack Query** for server state / caching
- **Zustand** for local stores (auth token, theme)
- **React Hook Form** + **Zod** for forms and validation
- **Framer Motion** for animation, **Tailwind CSS v4** for styling
- **Axios** HTTP client, **react-hot-toast** for notifications
- **Vitest** + Testing Library for tests

## Structure (`src/`)

| Path | Responsibility |
| --- | --- |
| `App.tsx` | Router, providers (QueryClient, MotionConfig), route guards |
| `main.tsx` | App entry, theme init |
| `api/` | Typed API clients, one file per domain (`auth`, `lessons`, `quizzes`, …) |
| `pages/` | Route pages, grouped by feature (`dashboard`, `quizzes`, `analytics`, …) |
| `components/ui/` | Shared UI primitives (`Button`, `Card`, `Input`, `Modal`, `Badge`, `Spinner`, `EmptyState`, …) |
| `components/layout/` | App shell (`AppLayout`) |
| `components/gamification/` | XP/badge UI |
| `hooks/` | Reusable hooks (`usePaginatedList`, `useGamification`, `useQuizTelemetry`) |
| `lib/` | `axios` instance, `motion` presets, `featureFlags`, `telemetry` |
| `store/` | Zustand stores (`auth.store`, `theme.store`) |

## API access

`src/lib/axios.ts` creates the shared client. The base URL is
`VITE_API_URL + /api/v1` (falls back to `/api/v1`). Interceptors:

- attach the in-memory access token as a Bearer header,
- on `401`, silently call `/auth/refresh` (with the refresh cookie) once and
  retry the original request,
- on `429`, show a single de-duplicated rate-limit toast using the `Retry-After`
  header.

## Routing & auth

`App.tsx` defines `PublicRoute`, `PrivateRoute`, `AdminRoute`, and
`TeacherRoute` wrappers backed by the auth store. Authenticated pages render
inside `AppLayout`. Page components are loaded with `React.lazy` + `Suspense`, so
each route ships as its own chunk and the initial bundle stays small.

## Theming

Design tokens are CSS variables defined in `src/index.css` for light and dark
themes; the theme is toggled via the `theme.store` (adds/removes a `dark` class).

## Conventions

- Use the shared `components/ui/*` primitives rather than bespoke markup; loading
  and empty states use `Spinner` and `EmptyState`.
- Keep server state in TanStack Query; keep only view/auth/theme state in stores.
- Co-locate a `*.test.tsx` with each component/page.

## Related documents
- [Backend](Backend.md) · [API Reference](API.md) · [Developer Guide](DeveloperGuide.md)
