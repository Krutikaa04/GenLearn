# Document Metadata

**Document ID:** 06C

**Title:** Frontend Low-Level Design

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** Critical

---

# Dependencies

- Document 00 – Project Constitution
- Document 00A – Glossary & Ubiquitous Language
- Document 01 – Project Vision & Scope
- Document 02 – Product Requirements Document
- Document 04 – Technology Decision Record
- Document 05 – High-Level Architecture

---

# Related Documents

- Document 06A – Backend Low-Level Design
- Document 06B – AI Platform Low-Level Design
- Document 16 – Frontend Architecture
- Document 17 – Design System

---

# Purpose

This document defines the internal architecture of the GenLearn frontend.

The frontend is responsible for presenting an intuitive, responsive, and premium user experience while delegating business logic to the backend and intelligence to the AI Platform.

It must preserve the existing visual experience while replacing all mock functionality with real backend integrations.

---

# Scope

This document defines:

- Frontend architecture
- Folder organization
- Routing
- State management
- API communication
- Authentication flow
- UI composition
- Error handling
- Performance strategy
- Accessibility
- Design principles

---

# Frontend Philosophy

The frontend is responsible for:

- Rendering UI
- Managing client-side state
- Performing navigation
- Calling backend APIs
- Presenting AI responses

The frontend must never:

- Contain business logic
- Generate prompts
- Call AI providers directly
- Access MongoDB
- Store sensitive credentials

---

# Architectural Style

The frontend follows:

- Feature-Based Architecture
- Component-Driven Development
- Atomic Design Principles
- React Hooks
- TypeScript
- Responsive Design
- API-First Integration

---

# Frontend Layers

```
Pages
    │
    ▼
Feature Components
    │
    ▼
Shared Components
    │
    ▼
Hooks
    │
    ▼
API Services
    │
    ▼
Backend APIs
```

Business logic must remain outside UI components wherever possible.

---

# Application Structure

```
src/

app/

pages/

components/

features/

hooks/

contexts/

services/

api/

types/

utils/

assets/

styles/

config/
```

Each feature owns its UI components, hooks, API integration, and types.

---

# Routing Strategy

The application uses React Router.

Public Routes

- Landing Page
- Login
- Register
- Forgot Password

Protected Student Routes

- Dashboard
- AI Tutor
- Lesson Generator
- Quiz Center
- Documents
- Flashcards
- Progress
- Profile

Protected Admin Routes

- Admin Dashboard
- User Management
- AI Monitoring
- Analytics
- Content Management

Unauthorized users are redirected appropriately.

---

# Authentication Flow

Authentication uses JWT with refresh tokens.

Workflow:

1. User logs in.
2. Backend returns Access Token and Refresh Token.
3. Access Token is stored in memory.
4. Refresh Token is stored securely (HttpOnly cookie preferred).
5. Expired access tokens are refreshed automatically.
6. Logout clears session and invalidates refresh token.

The frontend must never expose tokens unnecessarily.

---

# State Management

State is divided into:

Global State

- Authentication
- User Profile
- Theme
- Notifications

Feature State

- Lesson Generation
- Quiz Progress
- Chat Session
- Upload Progress

Server State

- API responses
- Cached queries
- Background refresh

Recommended library:

TanStack Query for server state.

React Context for lightweight global state.

---

# API Layer

All backend communication passes through a centralized API client.

Responsibilities:

- Authentication headers
- Token refresh
- Error handling
- Request retries
- Response parsing

Components must never call fetch() directly.

---

# Component Hierarchy

The frontend follows reusable composition.

```
Page

↓

Layout

↓

Feature Component

↓

Shared Component

↓

Primitive UI Component
```

This improves maintainability and reuse.

---

# UI Composition

The existing UI/UX is preserved.

Core screens include:

- Landing Page
- Student Dashboard
- AI Tutor
- Lesson Generator
- Quiz Interface
- Progress Dashboard
- Admin Dashboard

Only the underlying data sources change.

Visual redesign is explicitly out of scope.

---

# Error Handling

The frontend provides:

- Global Error Boundary
- API Error Handler
- Form Validation Errors
- Empty States
- Loading States
- Retry UI

Errors should be understandable and actionable.

---

# Loading Strategy

Loading indicators include:

- Skeleton loaders
- Progress bars
- Inline spinners
- Optimistic UI where appropriate

AI operations should display progress feedback.

---

# Performance Strategy

Performance techniques include:

- Route-based code splitting
- Lazy loading
- Image optimization
- Memoization
- Virtualized lists
- API response caching
- Debounced search

---

# Responsive Design

Target devices:

- Desktop
- Laptop
- Tablet
- Mobile

Layouts must adapt without changing functionality.

---

# Accessibility

The frontend adheres to WCAG principles where practical.

Requirements:

- Keyboard navigation
- Semantic HTML
- Accessible forms
- Focus indicators
- ARIA labels
- Color contrast compliance

---

# Security

Frontend security includes:

- Protected routes
- XSS prevention
- CSRF mitigation (where applicable)
- Secure token handling
- Input sanitization
- Content Security Policy compatibility

---

# Logging

Client-side logging captures:

- UI errors
- Route changes
- Performance metrics
- API failures

Sensitive information must never be logged.

---

# Dependency Rules

Pages may depend on:

- Features
- Layouts
- Shared Components

Shared Components must not depend on Pages.

API Services must not depend on UI.

Feature modules communicate through public interfaces.

---

# Risks

- Large bundle size
- Excessive re-renders
- API latency
- Token expiration
- Offline scenarios

Mitigations include code splitting, caching, optimized rendering, and resilient API handling.

---

# Assumptions

- Backend APIs are versioned.
- AI Platform responses follow defined schemas.
- Stable internet connectivity for AI operations.
- JWT authentication is available.

---

# Constraints

- No direct AI provider calls.
- No direct database access.
- Preserve existing UI.
- Maintain responsive behavior.
- Avoid unnecessary client-side business logic.

---

# Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Feature-based structure | Scalability | More folders |
| TanStack Query | Better server state | Additional learning |
| Context for global state | Simplicity | Not suitable for very large state |
| Preserve UI | Faster delivery | Limited redesign opportunities |

---

# Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Redux Toolkit | More boilerplate than required for MVP |
| Direct fetch calls | Poor maintainability |
| Local storage for auth | Security concerns |
| Complete UI redesign | Existing UI already meets product goals |

---

# Future Improvements

- Offline support
- Progressive Web App (PWA)
- Theme customization
- Internationalization (i18n)
- Real-time collaboration
- Desktop application (Electron/Tauri)

---

# Claude Code Implementation Instructions

1. Preserve the existing visual design.
2. Replace mock services with real APIs.
3. Build reusable feature modules.
4. Keep API logic centralized.
5. Use TypeScript throughout.
6. Ensure accessibility and responsiveness.
7. Avoid embedding business logic in components.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial Frontend Low-Level Design created. |