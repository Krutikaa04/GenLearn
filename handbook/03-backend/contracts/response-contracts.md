# Document Metadata

**Document ID:** BE-CON-04

**Title:** Response Contracts

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** High

---

# Purpose

Define the HTTP response contracts for all GenLearn API endpoints — the complete shape of every successful response body.

These contracts are implemented as response DTOs in NestJS. They define exactly what is returned to clients, ensuring no accidental data leakage (passwords, tokens, internal IDs).

---

# Standard Envelope

## Single Resource

```json
{
  "data": { }
}
```

## Paginated List

```json
{
  "data": [ ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 202 Accepted (Async Operations)

```json
{
  "data": {
    "jobId": "string",
    "resourceId": "string",
    "status": "generating",
    "pollUrl": "/api/v1/lessons/lesson-id"
  }
}
```

---

# Auth Responses

## POST /api/v1/auth/register → 201

```json
{
  "data": {
    "userId": "string",
    "email": "student@example.com",
    "firstName": "Rishi",
    "lastName": "Mahajan",
    "role": "student",
    "status": "unverified",
    "emailVerified": false,
    "createdAt": "2026-06-30T10:00:00Z"
  }
}
```

## POST /api/v1/auth/login → 200

```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "user": {
      "userId": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "student",
      "status": "active",
      "emailVerified": true
    }
  }
}
```

`refreshToken` set as `HttpOnly` cookie.

## GET /api/v1/auth/me → 200

```json
{
  "data": {
    "userId": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "student",
    "status": "active",
    "emailVerified": true,
    "profile": {
      "grade": "string",
      "learningGoals": [],
      "interests": [],
      "preferredDifficulty": "intermediate",
      "adaptiveScore": 0.65,
      "masteryLevel": "intermediate"
    },
    "createdAt": "2026-06-30T10:00:00Z"
  }
}
```

---

# Lesson Responses

## POST /api/v1/lessons/generate → 202

```json
{
  "data": {
    "lessonId": "string",
    "status": "generating",
    "topic": "Binary Search Trees",
    "difficulty": "intermediate",
    "pollUrl": "/api/v1/lessons/lesson-id"
  }
}
```

## GET /api/v1/lessons/:id → 200 (when ready)

```json
{
  "data": {
    "lessonId": "string",
    "topic": "string",
    "difficulty": "intermediate",
    "status": "ready",
    "content": {
      "learningObjectives": [],
      "explanation": "string",
      "examples": [],
      "analogies": [],
      "keyPoints": [],
      "summary": "string",
      "revisionQuestions": [],
      "codeSnippets": []
    },
    "completedAt": null,
    "createdAt": "2026-06-30T10:00:00Z"
  }
}
```

---

# Quiz Responses

## POST /api/v1/quizzes/generate → 202

```json
{
  "data": {
    "quizId": "string",
    "status": "generating",
    "topic": "string",
    "pollUrl": "/api/v1/quizzes/quiz-id"
  }
}
```

## GET /api/v1/quizzes/:id → 200 (no correct answers)

```json
{
  "data": {
    "quizId": "string",
    "topic": "string",
    "difficulty": "intermediate",
    "status": "ready",
    "questions": [
      {
        "questionId": "string",
        "type": "mcq",
        "text": "What is the time complexity of BST insertion?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        "difficulty": "intermediate"
      }
    ],
    "createdAt": "2026-06-30T10:00:00Z"
  }
}
```

`correctAnswer` and `explanation` are NOT included.

## POST /api/v1/quizzes/:id/attempts → 200

```json
{
  "data": {
    "attemptId": "string",
    "score": 80,
    "correctCount": 8,
    "totalQuestions": 10,
    "overallFeedback": "string",
    "perQuestionResults": [
      {
        "questionId": "string",
        "isCorrect": true,
        "explanation": "string"
      }
    ],
    "adaptiveUpdate": {
      "previousScore": 0.60,
      "newScore": 0.65,
      "masteryLevel": "intermediate"
    }
  }
}
```

---

# Document Responses

## POST /api/v1/documents/upload → 202

```json
{
  "data": {
    "documentId": "string",
    "status": "uploaded",
    "title": "string",
    "fileType": "pdf",
    "fileSizeBytes": 1048576,
    "pollUrl": "/api/v1/documents/doc-id/status"
  }
}
```

## GET /api/v1/documents/:id/status → 200

```json
{
  "data": {
    "documentId": "string",
    "status": "ready",
    "chunkCount": 42,
    "pageCount": 15
  }
}
```

## POST /api/v1/documents/:id/ask → 200

```json
{
  "data": {
    "answer": "string",
    "sources": [
      {
        "chunkId": "string",
        "documentId": "string",
        "pageNumber": 5,
        "heading": "Chapter 3: Binary Trees",
        "excerpt": "A binary search tree is a node-based..."
      }
    ],
    "grounded": true
  }
}
```

---

# AI Conversation Responses

## POST /api/v1/ai/conversations/:id/messages → 200

```json
{
  "data": {
    "messageId": "string",
    "role": "assistant",
    "content": "string",
    "sources": [],
    "followUpSuggestions": [
      "How does AVL tree balancing work?",
      "What is the difference between BST and heap?"
    ],
    "createdAt": "2026-06-30T10:00:00Z"
  }
}
```

---

# Progress Response

## GET /api/v1/progress → 200

```json
{
  "data": {
    "overallMasteryScore": 0.65,
    "masteryLevel": "intermediate",
    "lessonsCompleted": 12,
    "quizzesCompleted": 8,
    "avgQuizScore": 74,
    "documentsUploaded": 3,
    "flashcardsReviewed": 45,
    "learningStreak": 5,
    "lastActiveAt": "2026-06-30T10:00:00Z",
    "weakTopics": ["Recursion", "Dynamic Programming"],
    "strongTopics": ["Arrays", "Sorting Algorithms"]
  }
}
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial response contracts created. |
