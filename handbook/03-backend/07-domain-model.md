# Document Metadata

**Document ID:** BE-07

**Title:** Domain Model

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** Critical

---

# Purpose

Define the GenLearn domain model — the core business entities, their attributes, and their relationships.

This document drives the MongoDB collection design, the TypeScript domain classes, and the NestJS module structure.

---

# Domain Entities

## User

The top-level account entity. Shared across all roles.

| Field | Type | Description |
|-------|------|-------------|
| userId | string (UUID) | Primary identifier |
| email | string | Unique, lowercase, validated |
| passwordHash | string | bcrypt hash — never returned in responses |
| firstName | string | |
| lastName | string | |
| role | enum | student / admin |
| status | enum | active / suspended / unverified |
| emailVerified | boolean | |
| emailVerificationToken | string (nullable) | |
| passwordResetToken | string (nullable) | |
| passwordResetExpiry | Date (nullable) | |
| refreshTokens | RefreshToken[] | Active refresh token list |
| createdAt | Date | |
| updatedAt | Date | |
| deletedAt | Date (nullable) | Soft delete |

## RefreshToken (Value Object, embedded in User)

| Field | Type | Description |
|-------|------|-------------|
| tokenHash | string | SHA-256 hash of the token |
| expiresAt | Date | |
| createdAt | Date | |

## StudentProfile

One-to-one with User. Created automatically on registration.

| Field | Type | Description |
|-------|------|-------------|
| profileId | string | |
| studentId | string | FK to User |
| grade | string | |
| learningGoals | string[] | |
| interests | string[] | |
| preferredDifficulty | enum | beginner / intermediate / advanced |
| adaptiveScore | float | 0.0–1.0, managed by adaptive engine |
| masteryLevel | enum | beginner / intermediate / advanced |
| updatedAt | Date | |

---

## Lesson

AI-generated lesson content.

| Field | Type | Description |
|-------|------|-------------|
| lessonId | string | |
| studentId | string | |
| topic | string | |
| difficulty | enum | beginner / intermediate / advanced |
| status | enum | generating / ready / failed |
| content | LessonContent (embedded) | Null until status: ready |
| documentIds | string[] | Source documents used in RAG |
| tokenUsage | TokenUsage | |
| completedAt | Date (nullable) | |
| generationError | string (nullable) | |
| createdAt | Date | |
| updatedAt | Date | |
| deletedAt | Date (nullable) | |

## LessonContent (Embedded)

| Field | Type |
|-------|------|
| learningObjectives | string[] |
| explanation | string |
| examples | string[] |
| analogies | string[] |
| keyPoints | string[] |
| summary | string |
| revisionQuestions | string[] |
| codeSnippets | CodeSnippet[] |

---

## Quiz

AI-generated assessment.

| Field | Type | Description |
|-------|------|-------------|
| quizId | string | |
| studentId | string | |
| topic | string | |
| difficulty | enum | |
| questionCount | number | |
| status | enum | generating / ready / failed |
| questions | Question[] | |
| lessonId | string (nullable) | Optionally linked |
| tokenUsage | TokenUsage | |
| generationError | string (nullable) | |
| createdAt | Date | |
| updatedAt | Date | |
| deletedAt | Date (nullable) | |

## Question (Embedded in Quiz)

| Field | Type |
|-------|------|
| questionId | string |
| type | mcq / true_false / fill_blank / short_answer |
| text | string |
| options | string[] (MCQ only) |
| correctAnswer | string (server-side only) |
| explanation | string |
| difficulty | enum |
| topic | string |

## QuizAttempt

A student's submission against a quiz.

| Field | Type |
|-------|------|
| attemptId | string |
| quizId | string |
| studentId | string |
| answers | SubmittedAnswer[] |
| score | number (0–100) |
| correctCount | number |
| totalQuestions | number |
| hintCount | number |
| totalTimeSeconds | number |
| perQuestionResults | QuestionResult[] |
| overallFeedback | string |
| createdAt | Date |

---

## Document

Student-uploaded knowledge source.

| Field | Type | Description |
|-------|------|-------------|
| documentId | string | |
| studentId | string | |
| title | string | |
| originalFilename | string | |
| fileType | enum | pdf / docx / txt / md |
| fileSizeBytes | number | |
| storagePath | string | Object storage path |
| status | enum | uploaded / processing / embedding / ready / failed |
| processingError | string (nullable) | |
| pageCount | number (nullable) | |
| chunkCount | number | |
| createdAt | Date | |
| updatedAt | Date | |
| deletedAt | Date (nullable) | |

## DocumentChunk

Text segment extracted and embedded from a document.

| Field | Type | Description |
|-------|------|-------------|
| chunkId | string | |
| documentId | string | |
| studentId | string | Denormalised for scoped vector search |
| content | string | |
| embedding | float[768] | Gemini text-embedding-004 |
| pageNumber | number (nullable) | |
| heading | string (nullable) | |
| chunkIndex | number | |
| tokenCount | number | |
| createdAt | Date | |

---

## AIConversation

Persistent AI Tutor session.

| Field | Type |
|-------|------|
| conversationId | string |
| studentId | string |
| topic | string (nullable) |
| documentIds | string[] |
| messageCount | number |
| createdAt | Date |
| updatedAt | Date |

## AIMessage

Individual turn in an AI conversation.

| Field | Type |
|-------|------|
| messageId | string |
| conversationId | string |
| studentId | string |
| role | user / assistant |
| content | string |
| sources | SourceChunk[] (assistant only) |
| followUpSuggestions | string[] (assistant only) |
| tokenUsage | TokenUsage (assistant only) |
| createdAt | Date |

---

## Flashcard

AI-generated study card.

| Field | Type |
|-------|------|
| flashcardId | string |
| studentId | string |
| front | string |
| back | string |
| topic | string |
| difficulty | enum |
| source | document / lesson / tutor / summary |
| sourceId | string |
| createdAt | Date |

---

## Progress

Aggregated student learning record.

| Field | Type |
|-------|------|
| progressId | string |
| studentId | string (unique) |
| lessonsCompleted | number |
| quizzesCompleted | number |
| avgQuizScore | number |
| documentsUploaded | number |
| flashcardsReviewed | number |
| studyTimeSeconds | number |
| learningStreak | number (days) |
| lastActiveAt | Date |
| topicScores | TopicScore[] |
| weakTopics | string[] |
| strongTopics | string[] |
| updatedAt | Date |

---

## BehaviourEvent

Immutable event log consumed by the adaptive engine.

| Field | Type |
|-------|------|
| eventId | string |
| studentId | string |
| type | enum (see table below) |
| payload | object |
| occurredAt | Date |

| Event Type | Trigger |
|-----------|---------|
| lesson_completed | Student marks lesson done |
| quiz_submitted | Student submits quiz |
| hint_used | Student requests hint |
| tutor_message_sent | AI tutor message |
| flashcard_reviewed | Flashcard flipped |
| document_uploaded | Document upload |
| recommendation_clicked | Recommendation acted on |

---

## AuditLog

Immutable admin action log.

| Field | Type |
|-------|------|
| auditId | string |
| adminId | string |
| action | string |
| targetId | string |
| targetType | string |
| details | object |
| ipAddress | string |
| occurredAt | Date |

---

# Domain Relationships

```
User ──────────────── StudentProfile (1:1)
User ──────────────── Lesson[] (1:N)
User ──────────────── Quiz[] (1:N)
Quiz ──────────────── QuizAttempt[] (1:N)
User ──────────────── Document[] (1:N)
Document ───────────── DocumentChunk[] (1:N)
User ──────────────── AIConversation[] (1:N)
AIConversation ──────── AIMessage[] (1:N)
User ──────────────── Flashcard[] (1:N)
User ──────────────── Progress (1:1)
User ──────────────── BehaviourEvent[] (1:N)
Admin ──────────────── AuditLog[] (1:N)
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial domain model created. |
