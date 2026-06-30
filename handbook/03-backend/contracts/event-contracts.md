# Document Metadata

**Document ID:** BE-CON-02

**Title:** Event Contracts

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** High

---

# Purpose

Define the event contracts for all domain events published on BullMQ queues.

Events are the integration mechanism between the NestJS backend and the background worker layer. Every event must be typed, versioned, and documented here.

---

# Event Naming Convention

```
{aggregate}.{past_tense_verb}

Examples:
  document.uploaded
  lesson.completed
  quiz.submitted
  user.email_verified
```

---

# Queue Architecture

| Queue Name | Purpose |
|-----------|---------|
| document-processing | RAG pipeline: extraction, chunking, embedding |
| lesson-generation | AI lesson generation |
| quiz-generation | AI quiz generation |
| adaptive-update | Mastery score update after quiz/lesson |
| notification | Email and in-app notifications |
| flashcard-generation | AI flashcard generation |

---

# Document Events

## document.uploaded

**Queue:** `document-processing`

Published when: A student successfully uploads a document.

```typescript
interface DocumentUploadedEvent {
  eventId: string;
  eventType: 'document.uploaded';
  version: '1.0';
  occurredAt: string;          // ISO8601
  payload: {
    documentId: string;
    studentId: string;
    storagePath: string;
    fileType: 'pdf' | 'docx' | 'txt' | 'md';
    fileSizeBytes: number;
    title: string;
  };
}
```

**Consumed by:** Document processing worker (extraction → chunking → embedding)

---

# Lesson Events

## lesson.generate.requested

**Queue:** `lesson-generation`

Published when: Student requests a lesson via `POST /api/v1/lessons/generate`.

```typescript
interface LessonGenerateRequestedEvent {
  eventId: string;
  eventType: 'lesson.generate.requested';
  version: '1.0';
  occurredAt: string;
  payload: {
    lessonId: string;
    studentId: string;
    topic: string;
    difficulty: string;
    learningGoal?: string;
    documentIds: string[];
    studentContext: {
      adaptiveScore: number;
      masteryLevel: string;
      weakTopics: string[];
      learningGoals: string[];
    };
  };
}
```

**Consumed by:** Lesson generation worker → calls AI Platform `/lessons/generate`

---

## lesson.completed

**Queue:** `adaptive-update`

Published when: Student marks a lesson as complete.

```typescript
interface LessonCompletedEvent {
  eventId: string;
  eventType: 'lesson.completed';
  version: '1.0';
  occurredAt: string;
  payload: {
    lessonId: string;
    studentId: string;
    topic: string;
    difficulty: string;
    timeSpentSeconds: number;
    rating?: number;
  };
}
```

**Consumed by:** Adaptive update worker

---

# Quiz Events

## quiz.generate.requested

**Queue:** `quiz-generation`

Published when: Student requests a quiz via `POST /api/v1/quizzes/generate`.

```typescript
interface QuizGenerateRequestedEvent {
  eventId: string;
  eventType: 'quiz.generate.requested';
  version: '1.0';
  occurredAt: string;
  payload: {
    quizId: string;
    studentId: string;
    topic: string;
    difficulty: string;
    questionCount: number;
    questionTypes: string[];
    documentIds: string[];
    lessonId?: string;
    studentContext: {
      adaptiveScore: number;
      masteryLevel: string;
    };
  };
}
```

**Consumed by:** Quiz generation worker → calls AI Platform `/quizzes/generate`

---

## quiz.submitted

**Queue:** `adaptive-update`

Published when: Student submits a quiz attempt.

```typescript
interface QuizSubmittedEvent {
  eventId: string;
  eventType: 'quiz.submitted';
  version: '1.0';
  occurredAt: string;
  payload: {
    attemptId: string;
    quizId: string;
    studentId: string;
    topic: string;
    difficulty: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    hintCount: number;
    totalTimeSeconds: number;
    perQuestionResults: Array<{
      questionId: string;
      isCorrect: boolean;
      timeTakenSeconds: number;
      hintUsed: boolean;
    }>;
  };
}
```

**Consumed by:** Adaptive update worker → calls AI Platform `/adaptive/score`

---

# Flashcard Events

## flashcard.generate.requested

**Queue:** `flashcard-generation`

Published when: Student triggers flashcard generation from a document or lesson.

```typescript
interface FlashcardGenerateRequestedEvent {
  eventId: string;
  eventType: 'flashcard.generate.requested';
  version: '1.0';
  occurredAt: string;
  payload: {
    studentId: string;
    source: 'document' | 'lesson';
    sourceId: string;
    count: number;
    topic?: string;
  };
}
```

**Consumed by:** Flashcard generation worker → calls AI Platform `/flashcards/generate`

---

# Notification Events

## notification.send

**Queue:** `notification`

Published when: Any event requires sending an email or push notification.

```typescript
interface NotificationSendEvent {
  eventId: string;
  eventType: 'notification.send';
  version: '1.0';
  occurredAt: string;
  payload: {
    type: 'email_verification' | 'password_reset' | 'welcome' | 'lesson_ready' | 'quiz_ready';
    recipientEmail: string;
    recipientName: string;
    data: Record<string, string>;
  };
}
```

**Consumed by:** Notification worker → sends email via SMTP

---

# Event Schema Rules

1. Every event has a unique `eventId` (UUID).
2. Every event has an `eventType` matching the naming convention.
3. Every event has a `version` field for backward compatibility.
4. Every event has an `occurredAt` ISO8601 timestamp.
5. Business data lives in `payload` — never at the root level.
6. Events are never mutated after publishing.
7. Workers must be idempotent — safe to process the same event twice.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial event contracts created. |
