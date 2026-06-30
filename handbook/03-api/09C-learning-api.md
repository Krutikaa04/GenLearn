# Document Metadata

**Document ID:** 09C

**Title:** Learning API

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** API Contract

**Priority:** Critical

---

# Dependencies

- Document 09A – API Design Principles
- Document 09B – Identity API
- Document 06A – Backend Low-Level Design
- Document 07 – Domain Model
- Document 08 – Database Design

---

# Related Documents

- 09D – Assessment API
- 09F – AI Platform API
- FS-005 – Lesson Generation Feature Specification
- FS-010 – Progress Tracking Feature Specification
- FS-011 – Recommendations Feature Specification

---

# Purpose

This document defines every HTTP endpoint exposed by the Learning module of the GenLearn backend.

The Learning module manages AI-generated lessons, student progress tracking, and personalized recommendations.

---

# Scope

- Lesson Generation
- Lesson Retrieval and Management
- Learning Progress Tracking
- Adaptive Recommendations

---

# Base Path

```
/api/v1/lessons
/api/v1/progress
/api/v1/recommendations
```

---

# Authentication

All endpoints in this module require authentication.

```
Authorization: Bearer <access_token>
```

---

# Lesson Endpoints

---

## POST /api/v1/lessons/generate

**Description:** Request generation of a new AI lesson for the authenticated student.

**Access:** Authenticated (Student)

**Request Body:**

```json
{
  "topic": "string",
  "difficulty": "beginner | intermediate | advanced",
  "learningGoal": "string",
  "useDocuments": true,
  "documentIds": ["string"]
}
```

**Validation Rules:**

- topic: required, 3–200 characters
- difficulty: optional, defaults to student's adaptive level
- learningGoal: optional, 10–500 characters
- documentIds: optional array, must reference documents owned by the student

**Success Response — 202 Accepted:**

```json
{
  "success": true,
  "data": {
    "lessonId": "string",
    "status": "generating",
    "message": "Lesson generation started. Poll /lessons/:id for completion."
  },
  "timestamp": "ISO8601"
}
```

**Note:** Lesson generation is asynchronous. The backend immediately returns 202 and queues the AI request via BullMQ.

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 400 | INVALID_DOCUMENT_IDS | One or more document IDs not found or not owned by user |
| 429 | RATE_LIMIT_EXCEEDED | AI generation rate limit reached |

**Side Effects:**

- Creates a lesson record with status: generating
- Publishes LessonGenerationRequested event
- BullMQ worker calls AI Platform to generate content

---

## GET /api/v1/lessons

**Description:** Retrieve the authenticated student's lesson history.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| topic | string | — | Filter by topic |
| difficulty | string | — | Filter by difficulty |
| status | string | — | Filter by status (generating, ready, failed) |
| sort | string | createdAt:desc | Sort field and direction |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "lessonId": "string",
        "topic": "string",
        "difficulty": "string",
        "learningGoal": "string",
        "status": "ready",
        "createdAt": "ISO8601",
        "estimatedReadTime": 10
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/lessons/:lessonId

**Description:** Retrieve a specific lesson with full content.

**Access:** Authenticated (Student — owner only)

**Path Parameters:**

- lessonId: MongoDB ObjectId

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "lessonId": "string",
    "topic": "string",
    "difficulty": "string",
    "learningGoal": "string",
    "status": "ready",
    "content": {
      "learningObjectives": ["string"],
      "explanation": "string",
      "examples": ["string"],
      "analogies": ["string"],
      "keyPoints": ["string"],
      "summary": "string",
      "revisionQuestions": ["string"],
      "codeSnippets": []
    },
    "aiMetadata": {
      "provider": "gemini",
      "model": "string",
      "tokensUsed": 0,
      "generatedAt": "ISO8601"
    },
    "fromDocuments": ["string"],
    "createdAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | LESSON_NOT_FOUND | Lesson does not exist |
| 403 | FORBIDDEN | Lesson belongs to another user |
| 200 | — | Returns with status: generating if still in progress |

---

## DELETE /api/v1/lessons/:lessonId

**Description:** Soft-delete a lesson.

**Access:** Authenticated (Student — owner only)

**Success Response — 204 No Content**

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | LESSON_NOT_FOUND | Lesson does not exist |
| 403 | FORBIDDEN | Lesson belongs to another user |

---

## POST /api/v1/lessons/:lessonId/complete

**Description:** Mark a lesson as completed and record a behaviour event.

**Access:** Authenticated (Student — owner only)

**Request Body:**

```json
{
  "timeSpentSeconds": 0,
  "rating": 1
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Lesson marked as completed.",
    "progressUpdated": true
  },
  "timestamp": "ISO8601"
}
```

**Side Effects:**

- Records LessonCompleted behaviour event
- Triggers adaptive profile update via BullMQ
- Updates progress record

---

## GET /api/v1/lessons/:lessonId/flashcards

**Description:** Retrieve flashcards generated from a specific lesson.

**Access:** Authenticated (Student — owner only)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "flashcardId": "string",
        "front": "string",
        "back": "string",
        "topic": "string"
      }
    ],
    "totalItems": 10
  },
  "timestamp": "ISO8601"
}
```

---

# Progress Endpoints

---

## GET /api/v1/progress

**Description:** Retrieve the authenticated student's full learning progress.

**Access:** Authenticated (Student)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "studentId": "string",
    "overallMasteryScore": 0.72,
    "masteryLevel": "intermediate",
    "adaptiveScore": 0.65,
    "lessonsCompleted": 24,
    "quizzesCompleted": 18,
    "documentsUploaded": 5,
    "flashcardsReviewed": 120,
    "learningStreak": 7,
    "weakTopics": ["string"],
    "strongTopics": ["string"],
    "currentRecommendations": ["string"],
    "completionTimeline": [
      {
        "date": "ISO8601",
        "lessonsCompleted": 2,
        "quizzesCompleted": 1
      }
    ]
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/progress/summary

**Description:** Retrieve a compact progress summary suitable for dashboards.

**Access:** Authenticated (Student)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "masteryLevel": "intermediate",
    "masteryScore": 0.72,
    "learningStreak": 7,
    "lessonsCompleted": 24,
    "quizzesCompleted": 18,
    "topWeakTopics": ["string"],
    "topStrongTopics": ["string"]
  },
  "timestamp": "ISO8601"
}
```

---

# Recommendation Endpoints

---

## GET /api/v1/recommendations

**Description:** Retrieve personalized learning recommendations for the authenticated student.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 5 | Number of recommendations to return |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "recommendationId": "string",
        "type": "lesson | quiz | revision | document",
        "topic": "string",
        "reason": "string",
        "priority": "high | medium | low",
        "difficulty": "string"
      }
    ],
    "generatedAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/recommendations/refresh

**Description:** Request a fresh set of recommendations based on the latest adaptive profile.

**Access:** Authenticated (Student)

**Success Response — 202 Accepted:**

```json
{
  "success": true,
  "data": {
    "message": "Recommendations are being refreshed.",
    "estimatedSeconds": 5
  },
  "timestamp": "ISO8601"
}
```

**Rate Limit:** 5 requests per hour.

**Side Effects:**

- Queues RecommendationRefreshRequested event
- BullMQ worker calls AI Platform recommendation engine

---

# Error Codes Reference

| Error Code | Description |
|-----------|-------------|
| VALIDATION_ERROR | Input validation failed |
| LESSON_NOT_FOUND | Lesson does not exist |
| FORBIDDEN | Resource does not belong to authenticated user |
| INVALID_DOCUMENT_IDS | Referenced documents not found or not owned |
| RATE_LIMIT_EXCEEDED | Request rate limit reached |
| LESSON_GENERATION_FAILED | AI Platform failed to generate lesson |

---

# Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /lessons/generate | 20 requests / hour per user |
| POST /recommendations/refresh | 5 requests / hour per user |

---

# Claude Code Implementation Instructions

1. Lesson generation must be asynchronous — never block the HTTP response.
2. When a generation job fails, update the lesson status to failed and store the error reason.
3. Ownership checks are mandatory — a student must never access another student's lessons.
4. The progress record is updated by event consumers, not directly by lesson endpoints.
5. Recommendations are cached in Redis; refresh clears the cache and queues regeneration.
6. LessonCompleted events trigger the adaptive engine update via BullMQ.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Learning API contract created. |
