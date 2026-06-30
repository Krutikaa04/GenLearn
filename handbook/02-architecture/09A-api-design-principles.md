# Document Metadata

**Document ID:** 09A

**Title:** API Design Principles

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** Critical

---

# Purpose

This document establishes the standards, conventions, and governance rules for every REST API exposed by the GenLearn platform.

All APIs must conform to these principles regardless of implementation language or module.

---

# API Philosophy

The GenLearn API is:

- Resource-oriented
- RESTful
- Versioned
- Secure by default
- Predictable
- Consistent
- Self-documenting
- Backward compatible whenever practical

APIs are contracts between services and clients.

They must remain stable even as internal implementations evolve.

---

# API Style

GenLearn adopts REST as the primary integration style.

Characteristics:

- Stateless requests
- JSON payloads
- HTTPS only
- Resource-based URLs
- Standard HTTP methods
- Standard HTTP status codes

Future GraphQL support may be added without replacing REST.

---

# Base URL

Development

```
http://localhost:3000/api/v1
```

Production

```
https://api.genlearn.ai/api/v1
```

Every endpoint must be versioned.

---

# Resource Naming

Resources use plural nouns.

Examples:

```
/users
/lessons
/quizzes
/documents
/conversations
/flashcards
```

Avoid verbs in URLs.

Correct:

```
POST /lessons
```

Avoid:

```
POST /generateLesson
```

---

# HTTP Methods

GET

Retrieve resources

POST

Create resources

PUT

Replace resources

PATCH

Partial updates

DELETE

Delete resources

---

# Status Codes

200 OK

201 Created

202 Accepted

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Unprocessable Entity

429 Too Many Requests

500 Internal Server Error

503 Service Unavailable

---

# Request Structure

Headers

Authorization

Bearer Token

Content-Type

application/json

Accept

application/json

Correlation-ID

UUID

---

# Response Envelope

Every successful response follows the same format.

```json
{
  "success": true,
  "data": {},
  "metadata": {},
  "timestamp": "2026-01-01T12:00:00Z"
}
```

---

# Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson could not be located.",
    "details": []
  },
  "timestamp": "2026-01-01T12:00:00Z",
  "correlationId": "uuid"
}
```

---

# Pagination

Collections return:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 300,
  "totalPages": 15
}
```

Cursor pagination may be adopted for high-volume collections.

---

# Filtering

Examples

```
GET /lessons?topic=Arrays

GET /documents?status=processed

GET /quizzes?difficulty=advanced
```

---

# Sorting

Example

```
GET /lessons?sort=createdAt:desc
```

---

# Searching

Example

```
GET /documents?search=recursion
```

---

# API Versioning

URL-based versioning.

Example

```
/api/v1/...

/api/v2/...
```

Breaking changes require a new major version.

---

# Authentication

Protected endpoints require:

JWT Access Token

RBAC Authorization

Public endpoints include:

- Login
- Register
- Password Reset
- Email Verification

---

# Rate Limiting

Default:

100 requests/minute

AI endpoints:

20 requests/minute

Admin endpoints:

Higher configurable limits

---

# Idempotency

Sensitive POST endpoints support idempotency keys.

Examples:

- Payments (future)
- AI generation
- File uploads

---

# File Uploads

Multipart form data

Maximum file size:

Defined in Infrastructure document

Supported formats:

PDF

DOCX

TXT

Markdown

---

# Long Running Operations

Operations exceeding normal response time return:

202 Accepted

Processing continues asynchronously.

Client polls for completion or receives notifications.

---

# Correlation IDs

Every request includes a Correlation ID for tracing across services.

---

# OpenAPI

Every endpoint must include:

- Summary
- Description
- Request schema
- Response schema
- Error responses
- Authentication requirements
- Example payloads

---

# Security Principles

- HTTPS only
- JWT authentication
- RBAC authorization
- Input validation
- Output sanitization
- Rate limiting
- CORS
- Secure headers

---

# Design Decisions

- Resource-oriented APIs
- Consistent response envelopes
- Standardized errors
- URL versioning
- JSON-first communication
- Backward compatibility

---

# Claude Code Implementation Instructions

1. Follow these conventions for every endpoint.
2. Use consistent request and response envelopes.
3. Validate every request.
4. Return meaningful HTTP status codes.
5. Generate OpenAPI documentation alongside implementation.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial API Design Principles created. |