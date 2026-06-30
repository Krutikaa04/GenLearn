# Document Metadata

**Document ID:** 09G

**Title:** Analytics API

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** API Contract

**Priority:** High

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
- 09D – Assessment API
- FS-010 – Progress Tracking Feature Specification

---

# Purpose

This document defines every HTTP endpoint exposed by the Analytics module of the GenLearn backend.

The Analytics module handles behaviour event tracking, student learning analytics, platform-wide metrics for administrators, and the signals consumed by the adaptive learning engine.

---

# Scope

- Behaviour Event Tracking
- Student Learning Analytics
- Progress Metrics
- Topic Strength Analysis
- Platform-Wide Statistics (Admin)
- AI Usage Analytics (Admin)

---

# Base Path

```
/api/v1/analytics
/api/v1/admin/analytics
```

---

# Authentication

All endpoints require authentication.

Admin endpoints additionally require the admin role.

```
Authorization: Bearer <access_token>
```

---

# Student Analytics Endpoints

---

## POST /api/v1/analytics/events

**Description:** Record a behaviour event for the authenticated student.

**Access:** Authenticated (Student)

**Request Body:**

```json
{
  "type": "string",
  "topic": "string",
  "metadata": {}
}
```

**Event Types:**

| Type | Description |
|------|-------------|
| lesson_opened | Student opened a lesson |
| lesson_completed | Student completed a lesson |
| lesson_abandoned | Student left a lesson before completion |
| quiz_started | Student started a quiz |
| quiz_submitted | Student submitted a quiz |
| quiz_abandoned | Student left a quiz before submission |
| hint_requested | Student requested a hint during a quiz |
| tutor_opened | Student opened the AI Tutor |
| tutor_message_sent | Student sent a message to the AI Tutor |
| document_uploaded | Student uploaded a document |
| document_viewed | Student viewed a document |
| flashcards_opened | Student opened flashcard review |
| flashcard_reviewed | Student reviewed a single flashcard |
| summary_viewed | Student viewed a summary |
| recommendation_clicked | Student acted on a recommendation |

**Metadata Examples:**

For quiz_submitted:
```json
{
  "quizId": "string",
  "score": 80,
  "timeSeconds": 480
}
```

For lesson_completed:
```json
{
  "lessonId": "string",
  "timeSeconds": 600,
  "rating": 4
}
```

**Success Response — 202 Accepted:**

```json
{
  "success": true,
  "data": {
    "eventId": "string",
    "recorded": true
  },
  "timestamp": "ISO8601"
}
```

**Note:** Events are immutable once recorded. No update or delete operations are permitted.

**Rate Limit:** 120 events / minute per user.

---

## GET /api/v1/analytics/progress

**Description:** Retrieve detailed learning progress analytics for the authenticated student.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 30d | Time period: 7d, 30d, 90d, all |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "summary": {
      "lessonsCompleted": 12,
      "quizzesCompleted": 9,
      "documentsUploaded": 3,
      "flashcardsReviewed": 80,
      "tutorSessionCount": 5,
      "totalStudyTimeSeconds": 54000,
      "averageQuizScore": 74,
      "learningStreak": 7
    },
    "masteryTrend": [
      {
        "date": "ISO8601",
        "masteryScore": 0.72
      }
    ],
    "topicBreakdown": [
      {
        "topic": "string",
        "lessonsCompleted": 3,
        "quizAvgScore": 78,
        "masteryScore": 0.8,
        "strength": "strong | weak | neutral"
      }
    ],
    "dailyActivity": [
      {
        "date": "ISO8601",
        "eventsCount": 12,
        "studyTimeSeconds": 1800
      }
    ]
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/analytics/behaviour

**Description:** Retrieve raw behaviour events for the authenticated student.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 50 | Results per page |
| type | string | — | Filter by event type |
| from | string | — | ISO8601 start date |
| to | string | — | ISO8601 end date |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "eventId": "string",
        "type": "string",
        "topic": "string",
        "metadata": {},
        "recordedAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "totalItems": 240,
    "totalPages": 5
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/analytics/topics

**Description:** Retrieve topic-level mastery analysis for the authenticated student.

**Access:** Authenticated (Student)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "topic": "string",
        "masteryScore": 0.85,
        "strength": "strong | weak | neutral",
        "lessonsCompleted": 4,
        "quizAvgScore": 82,
        "lastStudied": "ISO8601",
        "recommendedAction": "revise | advance | maintain"
      }
    ],
    "weakTopics": ["string"],
    "strongTopics": ["string"]
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/analytics/summary

**Description:** Retrieve a compact analytics summary for dashboard widgets.

**Access:** Authenticated (Student)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "learningStreak": 7,
    "weeklyGoalProgress": 60,
    "masteryScore": 0.72,
    "masteryLevel": "intermediate",
    "recentActivity": [
      {
        "type": "string",
        "topic": "string",
        "timestamp": "ISO8601"
      }
    ],
    "thisWeek": {
      "lessonsCompleted": 3,
      "quizzesCompleted": 2,
      "studyTimeMinutes": 90
    }
  },
  "timestamp": "ISO8601"
}
```

---

# Admin Analytics Endpoints

---

## GET /api/v1/admin/analytics/platform

**Description:** Retrieve platform-wide usage statistics.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 30d | Time period: 7d, 30d, 90d |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "totalUsers": 150,
    "activeUsers": 80,
    "newRegistrations": 25,
    "totalLessonsGenerated": 600,
    "totalQuizzesGenerated": 450,
    "totalDocumentsUploaded": 120,
    "totalAiRequests": 2400,
    "averageSessionDurationSeconds": 1800,
    "dailyActiveUsers": [
      {
        "date": "ISO8601",
        "count": 45
      }
    ]
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/admin/analytics/ai-usage

**Description:** Retrieve AI token usage and cost analytics.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 30d | Time period: 7d, 30d, 90d |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "totalTokensUsed": 5000000,
    "totalInputTokens": 3000000,
    "totalOutputTokens": 2000000,
    "estimatedCostUSD": 2.50,
    "byWorkflow": [
      {
        "workflow": "lesson_generation | quiz_generation | tutor_chat | flashcard_generation | summary_generation",
        "requestCount": 600,
        "tokensUsed": 1500000,
        "avgLatencyMs": 1200
      }
    ],
    "topUsers": [
      {
        "userId": "string",
        "requestCount": 50,
        "tokensUsed": 80000
      }
    ],
    "failureRate": 0.02,
    "providerBreakdown": [
      {
        "provider": "gemini",
        "requestCount": 2400,
        "successRate": 0.98
      }
    ]
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/admin/analytics/students

**Description:** Retrieve aggregated student performance analytics.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| sort | string | masteryScore:desc | Sort field |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": "string",
        "name": "string",
        "masteryScore": 0.72,
        "masteryLevel": "intermediate",
        "lessonsCompleted": 24,
        "quizzesCompleted": 18,
        "avgQuizScore": 74,
        "lastActive": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  },
  "timestamp": "ISO8601"
}
```

---

# Error Codes Reference

| Error Code | Description |
|-----------|-------------|
| VALIDATION_ERROR | Input validation failed |
| INVALID_EVENT_TYPE | Unknown behaviour event type |
| RATE_LIMIT_EXCEEDED | Event tracking rate limit reached |

---

# Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /analytics/events | 120 events / minute per user |

---

# Design Notes

Behaviour events are immutable once recorded — no PUT, PATCH, or DELETE operations exist on events.

Events are append-only and serve as the audit trail for the adaptive learning engine.

The adaptive engine is fed events asynchronously via BullMQ — analytics endpoints do not trigger adaptive updates directly.

---

# Claude Code Implementation Instructions

1. Event tracking must be fire-and-forget — return 202 immediately, process asynchronously.
2. Behaviour events are immutable — never implement update or delete on events.
3. Analytics aggregations should be cached in Redis for dashboard queries.
4. Admin analytics should never expose individual student data without aggregation.
5. AI usage logs must be written by the AI Platform, not by the backend.
6. Mastery trend data is computed from the progress collection, not recalculated on each request.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Analytics API contract created. |
