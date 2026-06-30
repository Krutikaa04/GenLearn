# Document Metadata

**Document ID:** 09H

**Title:** Administration API

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
- Document 09G – Analytics API
- Document 06A – Backend Low-Level Design

---

# Related Documents

- FS-012 – Admin Dashboard Feature Specification

---

# Purpose

This document defines every HTTP endpoint exposed by the Administration module of the GenLearn backend.

The Administration module provides system management capabilities including user administration, content monitoring, platform health, audit logs, and system configuration.

All endpoints in this module are restricted to administrators only.

---

# Scope

- User Management (beyond Identity API)
- Audit Logs
- Platform Health
- System Statistics
- Content Moderation
- System Configuration

---

# Base Path

```
/api/v1/admin
```

---

# Authentication

All endpoints require:

- Valid JWT Bearer token
- Admin role

```
Authorization: Bearer <access_token>
```

Any request from a non-admin role returns 403 Forbidden.

---

# User Management Endpoints

(Extended user management beyond what is defined in Identity API)

---

## GET /api/v1/admin/users

Defined in Identity API document (09B).

---

## GET /api/v1/admin/users/:userId

Defined in Identity API document (09B).

---

## GET /api/v1/admin/users/:userId/activity

**Description:** Retrieve detailed activity history for a specific user.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| from | string | — | ISO8601 start date |
| to | string | — | ISO8601 end date |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "userId": "string",
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
    "pageSize": 20,
    "totalItems": 240,
    "totalPages": 12
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/admin/users/:userId/progress

**Description:** Retrieve learning progress for a specific user.

**Access:** Admin only

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "masteryScore": 0.72,
    "masteryLevel": "intermediate",
    "lessonsCompleted": 24,
    "quizzesCompleted": 18,
    "avgQuizScore": 74,
    "weakTopics": ["string"],
    "strongTopics": ["string"],
    "learningStreak": 7
  },
  "timestamp": "ISO8601"
}
```

---

# Audit Log Endpoints

---

## GET /api/v1/admin/audit-logs

**Description:** Retrieve platform audit logs.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 50 | Results per page |
| action | string | — | Filter by action type |
| actorId | string | — | Filter by actor user ID |
| targetId | string | — | Filter by target entity ID |
| from | string | — | ISO8601 start date |
| to | string | — | ISO8601 end date |

**Audit Log Action Types:**

| Action | Description |
|--------|-------------|
| USER_CREATED | New user registered |
| USER_SUSPENDED | User account suspended |
| USER_RESTORED | User account restored |
| USER_DELETED | User account deleted |
| ROLE_CHANGED | User role was changed |
| PASSWORD_RESET | Password reset performed |
| ADMIN_LOGIN | Admin logged in |
| CONFIG_CHANGED | System configuration changed |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "logId": "string",
        "action": "string",
        "actorId": "string",
        "actorEmail": "string",
        "targetId": "string",
        "targetType": "user | system",
        "details": {},
        "ipAddress": "string",
        "timestamp": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "totalItems": 500,
    "totalPages": 10
  },
  "timestamp": "ISO8601"
}
```

**Note:** Audit logs are immutable — no create, update, or delete operations are available via the API.

---

# Platform Health Endpoints

---

## GET /api/v1/admin/health

**Description:** Retrieve platform health status across all services.

**Access:** Admin only

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "status": "healthy | degraded | down",
    "services": {
      "backend": {
        "status": "healthy",
        "uptime": 86400,
        "version": "1.0.0"
      },
      "aiPlatform": {
        "status": "healthy",
        "uptime": 86400,
        "provider": "gemini",
        "model": "gemini-1.5-flash"
      },
      "mongodb": {
        "status": "healthy",
        "latencyMs": 5
      },
      "redis": {
        "status": "healthy",
        "latencyMs": 1
      },
      "bullmq": {
        "status": "healthy",
        "pendingJobs": 3,
        "failedJobs": 0
      }
    },
    "checkedAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/admin/health/queues

**Description:** Retrieve BullMQ queue health and job statistics.

**Access:** Admin only

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "queues": [
      {
        "name": "embedding | flashcard | summary | notification | email | analytics | recommendation",
        "pending": 0,
        "active": 1,
        "completed": 4500,
        "failed": 3,
        "delayed": 0
      }
    ]
  },
  "timestamp": "ISO8601"
}
```

---

# System Statistics Endpoints

---

## GET /api/v1/admin/stats

**Description:** Retrieve high-level platform statistics for the admin dashboard.

**Access:** Admin only

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 80,
      "suspended": 2,
      "newThisWeek": 10
    },
    "content": {
      "totalLessons": 1200,
      "totalQuizzes": 900,
      "totalDocuments": 350,
      "totalFlashcards": 8000
    },
    "ai": {
      "requestsToday": 240,
      "requestsThisMonth": 6000,
      "tokensThisMonth": 12000000,
      "estimatedCostThisMonthUSD": 6.00,
      "failureRatePercent": 1.5
    },
    "storage": {
      "totalDocumentStorageMB": 4096,
      "avgDocumentSizeMB": 11.7
    }
  },
  "timestamp": "ISO8601"
}
```

---

# Content Monitoring Endpoints

---

## GET /api/v1/admin/content/lessons

**Description:** List all lessons generated on the platform.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| userId | string | — | Filter by student |
| topic | string | — | Filter by topic |
| status | string | — | Filter by status |
| from | string | — | ISO8601 start date |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "lessonId": "string",
        "userId": "string",
        "topic": "string",
        "difficulty": "string",
        "status": "string",
        "createdAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 1200,
    "totalPages": 60
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/admin/content/documents

**Description:** List all documents uploaded on the platform.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| userId | string | — | Filter by student |
| status | string | — | Filter by processing status |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "documentId": "string",
        "userId": "string",
        "title": "string",
        "fileType": "string",
        "fileSizeBytes": 0,
        "status": "string",
        "uploadedAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 350,
    "totalPages": 18
  },
  "timestamp": "ISO8601"
}
```

---

# System Configuration Endpoints

---

## GET /api/v1/admin/config

**Description:** Retrieve current system configuration.

**Access:** Admin only

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "ai": {
      "provider": "gemini",
      "model": "gemini-1.5-flash",
      "rateLimits": {
        "lessonGenerationPerHour": 20,
        "quizGenerationPerHour": 20,
        "documentAskPerHour": 30,
        "tutorMessagesPerHour": 60
      }
    },
    "storage": {
      "maxDocumentSizeMB": 20,
      "maxDocumentsPerUser": 50
    },
    "features": {
      "registrationEnabled": true,
      "emailVerificationRequired": true,
      "maintenanceMode": false
    }
  },
  "timestamp": "ISO8601"
}
```

---

## PATCH /api/v1/admin/config

**Description:** Update system configuration.

**Access:** Admin only

**Request Body:** Partial configuration object (only include fields to update).

```json
{
  "features": {
    "maintenanceMode": true
  }
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Configuration updated successfully."
  },
  "timestamp": "ISO8601"
}
```

**Side Effects:**

- Creates audit log entry
- Redis cache for affected settings is invalidated

---

# Error Codes Reference

| Error Code | Description |
|-----------|-------------|
| FORBIDDEN | Caller does not have admin role |
| USER_NOT_FOUND | Target user does not exist |
| VALIDATION_ERROR | Input validation failed |
| CONFIG_INVALID | Invalid configuration value |

---

# Claude Code Implementation Instructions

1. Every endpoint in this module requires the admin role — apply the RolesGuard globally on the /admin prefix.
2. Audit logs must be written before executing the action, not after.
3. Configuration changes must be validated before applying.
4. Never expose sensitive fields (password hashes, API keys) even to admins.
5. Health check endpoint should be fast — use cached status, not live pings on every call.
6. Audit log entries are immutable — do not implement write operations on audit_logs.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Administration API contract created. |
