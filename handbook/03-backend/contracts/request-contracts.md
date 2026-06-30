# Document Metadata

**Document ID:** BE-CON-03

**Title:** Request Contracts

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** High

---

# Purpose

Define the HTTP request contracts for all GenLearn API endpoints — the complete expected shape of every request body, path parameter, and query string.

These contracts are implemented as DTOs in the NestJS backend and are validated by `ValidationPipe`.

---

# Auth Requests

## POST /api/v1/auth/register

```json
{
  "email": "student@example.com",
  "password": "Password123!",
  "firstName": "Rishi",
  "lastName": "Mahajan"
}
```

Constraints: email unique and valid, password meets policy, names 2–50 chars.

---

## POST /api/v1/auth/login

```json
{
  "email": "student@example.com",
  "password": "Password123!"
}
```

---

## POST /api/v1/auth/refresh

No body. Refresh token sent as `HttpOnly` cookie: `refreshToken`.

---

## POST /api/v1/auth/forgot-password

```json
{
  "email": "student@example.com"
}
```

---

## POST /api/v1/auth/reset-password

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123!"
}
```

---

## PATCH /api/v1/auth/me

All fields optional. At least one must be provided.

```json
{
  "firstName": "Rishi",
  "lastName": "Mahajan",
  "grade": "MCA Year 3",
  "learningGoals": ["Machine Learning", "System Design"],
  "interests": ["Computer Science", "AI"],
  "preferredDifficulty": "intermediate"
}
```

---

# Lesson Requests

## POST /api/v1/lessons/generate

```json
{
  "topic": "Binary Search Trees",
  "difficulty": "intermediate",
  "learningGoal": "Understand insertion and deletion",
  "documentIds": ["doc-id-1", "doc-id-2"]
}
```

`difficulty` defaults to student's adaptive level if omitted.
`documentIds` optional — enables RAG grounding.

---

## POST /api/v1/lessons/:id/complete

```json
{
  "timeSpentSeconds": 1200,
  "rating": 4
}
```

---

# Quiz Requests

## POST /api/v1/quizzes/generate

```json
{
  "topic": "Binary Search Trees",
  "difficulty": "intermediate",
  "questionCount": 10,
  "questionTypes": ["mcq", "true_false"],
  "lessonId": "lesson-id-optional",
  "documentIds": ["doc-id-1"]
}
```

`questionCount` defaults to 10. `questionTypes` defaults to `["mcq"]`.

---

## POST /api/v1/quizzes/:id/attempts

```json
{
  "answers": [
    {
      "questionId": "q-1",
      "answer": "B",
      "timeTakenSeconds": 30,
      "hintUsed": false
    },
    {
      "questionId": "q-2",
      "answer": "True",
      "timeTakenSeconds": 15,
      "hintUsed": true
    }
  ],
  "totalTimeSeconds": 480
}
```

---

# Document Requests

## POST /api/v1/documents/upload

```
Content-Type: multipart/form-data

Field: file (binary)
Field: title (string, optional)
```

Accepted types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `text/markdown`

Maximum size: 20 MB

---

## POST /api/v1/documents/:id/ask

```json
{
  "question": "What is the time complexity of insertion in a BST?"
}
```

---

## POST /api/v1/documents/:id/flashcards/generate

```json
{
  "count": 20
}
```

`count` defaults to 15. Maximum 50.

---

# AI Conversation Requests

## POST /api/v1/ai/conversations

```json
{
  "topic": "Operating Systems",
  "documentIds": ["doc-id-1"]
}
```

All fields optional.

---

## POST /api/v1/ai/conversations/:id/messages

```json
{
  "content": "Explain virtual memory with an analogy"
}
```

---

# Analytics Requests

## POST /api/v1/analytics/events

```json
{
  "type": "flashcard_reviewed",
  "payload": {
    "flashcardId": "fc-id",
    "topic": "Binary Trees"
  }
}
```

---

# Admin Requests

## PATCH /api/v1/admin/users/:id/role

```json
{
  "role": "admin"
}
```

---

## POST /api/v1/admin/users/:id/suspend

```json
{
  "reason": "Repeated policy violations"
}
```

---

# Query Parameters

All list endpoints support:

```
page=1
pageSize=20
sortBy=createdAt
sortOrder=desc
```

Additional filters per endpoint:

```
GET /api/v1/admin/users?search=rishi&role=student&status=active
GET /api/v1/admin/audit-logs?action=user.suspend&from=2026-01-01&to=2026-06-30
GET /api/v1/flashcards?topic=BST&source=document
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial request contracts created. |
