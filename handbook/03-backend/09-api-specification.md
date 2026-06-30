# Document Metadata

**Document ID:** BE-09

**Title:** Backend API Specification Reference

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** High

---

# Purpose

Provide a consolidated reference of all NestJS backend API endpoints, linking to the detailed API documents in `handbook/03-api/`.

This document is an index. Full endpoint specifications live in the referenced documents.

---

# API Base URL

```
Development: http://localhost:3000
Production:  https://api.genlearn.app
```

---

# Authentication

All protected endpoints require:

```
Authorization: Bearer <accessToken>
```

See `handbook/03-api/09B-identity-api.md` for authentication flows.

---

# API Documents

| Domain | Document |
|--------|---------|
| Identity (Auth + Profile) | [09B-identity-api.md](../03-api/09B-identity-api.md) |
| Learning (Lessons + Progress) | [09C-learning-api.md](../03-api/09C-learning-api.md) |
| Assessment (Quizzes) | [09D-assessment-api.md](../03-api/09D-assessment-api.md) |
| Knowledge (Documents + RAG) | [09E-knowledge-api.md](../03-api/09E-knowledge-api.md) |
| AI Platform (Internal) | [09F-ai-platform-api.md](../03-api/09F-ai-platform-api.md) |
| Analytics | [09G-analytics-api.md](../03-api/09G-analytics-api.md) |
| Administration | [09H-administration-api.md](../03-api/09H-administration-api.md) |

---

# Endpoint Summary

## Identity

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/verify-email?token=
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
PATCH  /api/v1/auth/me
```

## Learning

```
POST   /api/v1/lessons/generate
GET    /api/v1/lessons
GET    /api/v1/lessons/:id
POST   /api/v1/lessons/:id/complete
DELETE /api/v1/lessons/:id
GET    /api/v1/progress
GET    /api/v1/recommendations
POST   /api/v1/recommendations/refresh
GET    /api/v1/ai/conversations
POST   /api/v1/ai/conversations
GET    /api/v1/ai/conversations/:id
DELETE /api/v1/ai/conversations/:id
GET    /api/v1/ai/conversations/:id/messages
POST   /api/v1/ai/conversations/:id/messages
```

## Assessment

```
POST   /api/v1/quizzes/generate
GET    /api/v1/quizzes
GET    /api/v1/quizzes/:id
POST   /api/v1/quizzes/:id/attempts
GET    /api/v1/quizzes/:id/attempts
GET    /api/v1/attempts/:id
```

## Knowledge

```
POST   /api/v1/documents/upload
GET    /api/v1/documents
GET    /api/v1/documents/:id
GET    /api/v1/documents/:id/status
DELETE /api/v1/documents/:id
POST   /api/v1/documents/:id/ask
POST   /api/v1/documents/:id/flashcards/generate
GET    /api/v1/documents/:id/flashcards
GET    /api/v1/flashcards
DELETE /api/v1/flashcards/:id
```

## Analytics

```
POST   /api/v1/analytics/events
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/topics
GET    /api/v1/admin/analytics/platform
GET    /api/v1/admin/analytics/ai-usage
GET    /api/v1/admin/analytics/students
```

## Administration

```
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
GET    /api/v1/admin/users/:id/activity
GET    /api/v1/admin/users/:id/progress
PATCH  /api/v1/admin/users/:id/role
POST   /api/v1/admin/users/:id/suspend
POST   /api/v1/admin/users/:id/restore
DELETE /api/v1/admin/users/:id
GET    /api/v1/admin/content/lessons
GET    /api/v1/admin/content/documents
GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/health
GET    /api/v1/admin/health/queues
GET    /api/v1/admin/stats
GET    /api/v1/admin/config
PATCH  /api/v1/admin/config
```

---

# Standard Response Envelope

## Success

```json
{
  "data": { },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

`meta` only present on paginated responses.

## Error

```json
{
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found",
    "statusCode": 404
  }
}
```

See `handbook/03-backend/error-catalogue.md` for all error codes.

---

# Pagination

All list endpoints support:

```
GET /api/v1/lessons?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

Defaults: `page=1`, `pageSize=20`, `sortBy=createdAt`, `sortOrder=desc`.

---

# Rate Limits

| Endpoint Group | Limit |
|---------------|-------|
| Auth (login, register) | 10 requests / 15 min / IP |
| Forgot password | 3 requests / hour / email |
| AI generation (lessons, quizzes) | 20 requests / hour / user |
| AI queries (ask, chat) | 60 requests / hour / user |
| Document upload | 10 requests / hour / user |

---

# Interactive Documentation

Swagger UI (development only):

```
http://localhost:3000/api/docs
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial API specification reference created. |
