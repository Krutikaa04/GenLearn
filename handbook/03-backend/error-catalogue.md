# Document Metadata

**Document ID:** BE-ERR

**Title:** Error Catalogue

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** High

---

# Purpose

Define every error code returned by the GenLearn backend API.

All errors follow a consistent response format. Frontend clients use `error.code` for programmatic handling and `error.message` for display.

---

# Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "statusCode": 400
  }
}
```

---

# Authentication Errors (401, 403)

| Code | Status | Message | Trigger |
|------|--------|---------|---------|
| `UNAUTHORIZED` | 401 | Authentication required | No or invalid Bearer token |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password | Login failed |
| `INVALID_TOKEN` | 401 | Token is invalid or expired | JWT verification failed |
| `TOKEN_EXPIRED` | 401 | Access token has expired | JWT exp in the past |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh token is invalid or expired | Bad or missing refresh cookie |
| `REFRESH_TOKEN_REUSE` | 401 | Refresh token reuse detected | Replay attack — all tokens invalidated |
| `EMAIL_NOT_VERIFIED` | 403 | Please verify your email before logging in | Login with unverified account |
| `ACCOUNT_SUSPENDED` | 403 | Account has been suspended | Suspended user attempts access |
| `FORBIDDEN` | 403 | Insufficient permissions | Role does not meet requirement |
| `ADMIN_REQUIRED` | 403 | Admin role required | Non-admin on admin route |

---

# Validation Errors (400)

| Code | Status | Message | Trigger |
|------|--------|---------|---------|
| `VALIDATION_ERROR` | 400 | Request validation failed | `class-validator` failures |
| `INVALID_EMAIL` | 400 | Invalid email format | Malformed email |
| `WEAK_PASSWORD` | 400 | Password does not meet requirements | Password policy violation |
| `MISSING_REQUIRED_FIELD` | 400 | Required field is missing | Null/undefined required field |
| `INVALID_FILE_TYPE` | 400 | File type not supported | Upload with unsupported MIME type |
| `FILE_TOO_LARGE` | 400 | File size exceeds 20 MB limit | Upload over 20 MB |
| `INVALID_QUESTION_TYPE` | 400 | Invalid question type | Unknown quiz question type |
| `INVALID_DIFFICULTY` | 400 | Invalid difficulty level | Unknown difficulty enum value |
| `INVALID_ROLE` | 400 | Invalid role | Unknown role enum value |

---

# Not Found Errors (404)

| Code | Status | Message | Trigger |
|------|--------|---------|---------|
| `USER_NOT_FOUND` | 404 | User not found | User ID not in database |
| `LESSON_NOT_FOUND` | 404 | Lesson not found | Lesson ID not found or soft-deleted |
| `QUIZ_NOT_FOUND` | 404 | Quiz not found | Quiz ID not found or soft-deleted |
| `ATTEMPT_NOT_FOUND` | 404 | Quiz attempt not found | Attempt ID not found |
| `DOCUMENT_NOT_FOUND` | 404 | Document not found | Document ID not found or soft-deleted |
| `CONVERSATION_NOT_FOUND` | 404 | Conversation not found | Conversation ID not found |
| `FLASHCARD_NOT_FOUND` | 404 | Flashcard not found | Flashcard ID not found |

---

# Conflict Errors (409)

| Code | Status | Message | Trigger |
|------|--------|---------|---------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email address is already registered | Duplicate registration |
| `VERIFICATION_TOKEN_USED` | 409 | Email verification link has already been used | Token already consumed |
| `RESET_TOKEN_USED` | 409 | Password reset link has already been used | Token already consumed |

---

# Business Rule Errors (422)

| Code | Status | Message | Trigger |
|------|--------|---------|---------|
| `DOCUMENT_NOT_READY` | 422 | Document is still being processed | RAG query on non-ready document |
| `DOCUMENT_PROCESSING_FAILED` | 422 | Document processing failed — please re-upload | Query on failed document |
| `LESSON_STILL_GENERATING` | 422 | Lesson is still being generated | Complete lesson before it is ready |
| `QUIZ_STILL_GENERATING` | 422 | Quiz is still being generated | Submit attempt before quiz is ready |
| `CANNOT_SUSPEND_ADMIN` | 422 | Admin accounts cannot be suspended | Admin suspends another admin |
| `DOCUMENT_LIMIT_REACHED` | 422 | Document storage limit reached (50 documents) | Exceeds per-student document limit |
| `RESET_TOKEN_EXPIRED` | 422 | Password reset link has expired | Token older than 1 hour |
| `VERIFICATION_TOKEN_EXPIRED` | 422 | Email verification link has expired | Token older than 24 hours |

---

# Rate Limit Errors (429)

| Code | Status | Message | Trigger |
|------|--------|---------|---------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests — please try again later | Generic throttle |
| `AUTH_RATE_LIMIT_EXCEEDED` | 429 | Too many login attempts — please try again in 15 minutes | Auth throttle |
| `GENERATION_RATE_LIMIT_EXCEEDED` | 429 | Generation limit reached — please wait before generating more | AI generation throttle |

All `429` responses include a `Retry-After` header.

---

# Server Errors (500)

| Code | Status | Message | Trigger |
|------|--------|---------|---------|
| `INTERNAL_SERVER_ERROR` | 500 | An unexpected error occurred | Unhandled exception |
| `AI_PLATFORM_UNAVAILABLE` | 502 | AI service is temporarily unavailable | AI Platform not reachable |
| `AI_GENERATION_FAILED` | 500 | Content generation failed — please try again | AI Platform returned error |
| `DATABASE_ERROR` | 500 | A database error occurred | MongoDB operation failed |

---

# Frontend Error Handling Guide

```typescript
switch (error.code) {
  case 'INVALID_CREDENTIALS':
    showToast('Invalid email or password');
    break;
  case 'REFRESH_TOKEN_INVALID':
    clearAuth();
    redirectToLogin();
    break;
  case 'RATE_LIMIT_EXCEEDED':
    showToast('Too many requests — please wait');
    break;
  case 'DOCUMENT_NOT_READY':
    showToast('Document is still processing');
    break;
  default:
    showToast('Something went wrong');
}
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial error catalogue created. |
