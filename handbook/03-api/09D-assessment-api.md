# Document Metadata

**Document ID:** 09D

**Title:** Assessment API

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

- 09C – Learning API
- 09F – AI Platform API
- FS-006 – Quiz Generation Feature Specification
- FS-007 – Adaptive Learning Feature Specification

---

# Purpose

This document defines every HTTP endpoint exposed by the Assessment module of the GenLearn backend.

The Assessment module handles AI-generated quizzes, quiz submissions, result evaluation, attempt history, and adaptive difficulty adjustment.

---

# Scope

- Quiz Generation
- Quiz Retrieval
- Quiz Submission and Evaluation
- Attempt History and Results
- Adaptive Difficulty Signals

---

# Base Path

```
/api/v1/quizzes
/api/v1/attempts
```

---

# Authentication

All endpoints require authentication.

```
Authorization: Bearer <access_token>
```

---

# Quiz Endpoints

---

## POST /api/v1/quizzes/generate

**Description:** Request generation of an AI quiz for the authenticated student.

**Access:** Authenticated (Student)

**Request Body:**

```json
{
  "topic": "string",
  "difficulty": "beginner | intermediate | advanced",
  "questionCount": 10,
  "questionTypes": ["mcq", "true_false", "fill_blank", "short_answer"],
  "lessonId": "string",
  "documentIds": ["string"]
}
```

**Validation Rules:**

- topic: required, 3–200 characters
- difficulty: optional, defaults to adaptive level
- questionCount: optional, 5–20, default 10
- questionTypes: optional array, must contain valid types
- lessonId: optional, must reference a lesson owned by the student
- documentIds: optional, must reference documents owned by the student

**Success Response — 202 Accepted:**

```json
{
  "success": true,
  "data": {
    "quizId": "string",
    "status": "generating",
    "message": "Quiz generation started. Poll /quizzes/:id for completion."
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 400 | INVALID_LESSON_ID | Lesson not found or not owned |
| 400 | INVALID_DOCUMENT_IDS | Documents not found or not owned |
| 429 | RATE_LIMIT_EXCEEDED | AI generation rate limit reached |

**Side Effects:**

- Creates quiz record with status: generating
- Publishes QuizGenerationRequested event
- BullMQ worker calls AI Platform to generate questions

---

## GET /api/v1/quizzes

**Description:** List all quizzes for the authenticated student.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| topic | string | — | Filter by topic |
| difficulty | string | — | Filter by difficulty |
| status | string | — | Filter by status |
| attempted | boolean | — | Filter by whether student has attempted |
| sort | string | createdAt:desc | Sort field and direction |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "quizId": "string",
        "topic": "string",
        "difficulty": "string",
        "questionCount": 10,
        "status": "ready",
        "attempted": true,
        "bestScore": 85,
        "createdAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 30,
    "totalPages": 2
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/quizzes/:quizId

**Description:** Retrieve a specific quiz with questions.

**Access:** Authenticated (Student — owner only)

**Note:** Answer options are returned without indicating correct answers. Correct answers are revealed only after submission.

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "quizId": "string",
    "topic": "string",
    "difficulty": "string",
    "status": "ready",
    "questions": [
      {
        "questionId": "string",
        "type": "mcq | true_false | fill_blank | short_answer",
        "text": "string",
        "options": ["string"],
        "hint": "string",
        "points": 1
      }
    ],
    "totalPoints": 10,
    "estimatedMinutes": 15,
    "referenceLesson": "string",
    "createdAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | QUIZ_NOT_FOUND | Quiz does not exist |
| 403 | FORBIDDEN | Quiz belongs to another user |

---

## DELETE /api/v1/quizzes/:quizId

**Description:** Soft-delete a quiz.

**Access:** Authenticated (Student — owner only)

**Success Response — 204 No Content**

---

# Attempt Endpoints

---

## POST /api/v1/quizzes/:quizId/attempts

**Description:** Submit a completed quiz attempt for evaluation.

**Access:** Authenticated (Student — owner only)

**Request Body:**

```json
{
  "answers": [
    {
      "questionId": "string",
      "answer": "string",
      "timeSpentSeconds": 30,
      "hintUsed": false
    }
  ],
  "totalTimeSeconds": 480
}
```

**Validation Rules:**

- answers: required, must include an entry for every question in the quiz
- answer: required for each entry
- timeSpentSeconds: optional, non-negative integer
- hintUsed: optional, boolean

**Success Response — 201 Created:**

```json
{
  "success": true,
  "data": {
    "attemptId": "string",
    "quizId": "string",
    "score": 80,
    "totalPoints": 10,
    "pointsEarned": 8,
    "percentage": 80,
    "passed": true,
    "timeTaken": 480,
    "results": [
      {
        "questionId": "string",
        "correct": true,
        "yourAnswer": "string",
        "correctAnswer": "string",
        "explanation": "string",
        "pointsEarned": 1
      }
    ],
    "feedback": "string",
    "nextRecommendation": "string",
    "adaptiveUpdate": {
      "newMasteryScore": 0.75,
      "difficultyAdjustment": "maintain | increase | decrease"
    }
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | QUIZ_NOT_FOUND | Quiz does not exist |
| 403 | FORBIDDEN | Quiz belongs to another user |
| 400 | QUIZ_NOT_READY | Quiz is still generating |
| 400 | INCOMPLETE_ANSWERS | Not all questions answered |
| 409 | ALREADY_SUBMITTED | Attempt already exists for this quiz |

**Side Effects:**

- Creates attempt record
- Publishes QuizCompleted event
- BullMQ worker updates adaptive profile
- Records behaviour events for each question

---

## GET /api/v1/quizzes/:quizId/attempts

**Description:** List all attempts for a specific quiz.

**Access:** Authenticated (Student — owner only)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "attemptId": "string",
        "score": 80,
        "percentage": 80,
        "passed": true,
        "completedAt": "ISO8601"
      }
    ],
    "totalItems": 2,
    "bestScore": 85
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/attempts/:attemptId

**Description:** Retrieve full details of a specific attempt including per-question results.

**Access:** Authenticated (Student — owner only)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "attemptId": "string",
    "quizId": "string",
    "topic": "string",
    "score": 80,
    "percentage": 80,
    "passed": true,
    "timeTaken": 480,
    "completedAt": "ISO8601",
    "results": [
      {
        "questionId": "string",
        "type": "string",
        "text": "string",
        "correct": true,
        "yourAnswer": "string",
        "correctAnswer": "string",
        "explanation": "string",
        "hintUsed": false,
        "timeSpentSeconds": 30,
        "pointsEarned": 1
      }
    ],
    "feedback": "string",
    "adaptiveImpact": {
      "topicsStrengthened": ["string"],
      "topicsWeakened": ["string"]
    }
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | ATTEMPT_NOT_FOUND | Attempt does not exist |
| 403 | FORBIDDEN | Attempt belongs to another user |

---

## GET /api/v1/attempts

**Description:** List all quiz attempts for the authenticated student.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| topic | string | — | Filter by topic |
| passed | boolean | — | Filter by pass/fail |
| sort | string | completedAt:desc | Sort field and direction |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "attemptId": "string",
        "quizId": "string",
        "topic": "string",
        "score": 80,
        "percentage": 80,
        "passed": true,
        "completedAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 18,
    "totalPages": 1
  },
  "timestamp": "ISO8601"
}
```

---

# Error Codes Reference

| Error Code | Description |
|-----------|-------------|
| VALIDATION_ERROR | Input validation failed |
| QUIZ_NOT_FOUND | Quiz does not exist |
| ATTEMPT_NOT_FOUND | Attempt does not exist |
| FORBIDDEN | Resource does not belong to the authenticated user |
| QUIZ_NOT_READY | Quiz is still generating |
| INCOMPLETE_ANSWERS | Not all questions have been answered |
| ALREADY_SUBMITTED | Attempt for this quiz already exists |
| INVALID_LESSON_ID | Lesson not found or not owned |
| INVALID_DOCUMENT_IDS | Documents not found or not owned |
| RATE_LIMIT_EXCEEDED | AI rate limit reached |

---

# Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /quizzes/generate | 20 requests / hour per user |

---

# Claude Code Implementation Instructions

1. Quiz generation is asynchronous — return 202 immediately and queue the job.
2. Never return correct answers when fetching quiz questions — only return them after submission.
3. Submission must be idempotent — if a student submits the same quiz twice, return the existing attempt.
4. Evaluation logic belongs in the AI Platform, not the backend — the backend sends the answers and receives the evaluation.
5. QuizCompleted events must carry the full attempt metadata for the adaptive engine.
6. Ownership checks are mandatory on every endpoint.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Assessment API contract created. |
