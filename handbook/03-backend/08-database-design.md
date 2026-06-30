# Document Metadata

**Document ID:** BE-08

**Title:** Database Design

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** Critical

---

# Purpose

Define the complete MongoDB database design for GenLearn — including collection schemas, indexes, and vector search configuration.

---

# Database

- Database name: `genlearn`
- Provider: MongoDB Atlas (M0 free tier for MVP)
- Driver: Mongoose via `@nestjs/mongoose`

---

# Collections

## users

```javascript
{
  _id: ObjectId,
  userId: String,                  // UUID
  email: String,                   // unique, lowercase
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: String,                    // 'student' | 'admin'
  status: String,                  // 'active' | 'suspended' | 'unverified'
  emailVerified: Boolean,
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  refreshTokens: [
    { tokenHash: String, expiresAt: Date, createdAt: Date }
  ],
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date                  // null = active
}
```

Indexes: `{ email: 1 }` unique, `{ userId: 1 }` unique, `{ status: 1 }`, `{ deletedAt: 1 }`

---

## student_profiles

```javascript
{
  _id: ObjectId,
  profileId: String,
  studentId: String,
  grade: String,
  learningGoals: [String],
  interests: [String],
  preferredDifficulty: String,
  adaptiveScore: Number,
  masteryLevel: String,
  updatedAt: Date
}
```

Indexes: `{ studentId: 1 }` unique

---

## lessons

```javascript
{
  _id: ObjectId,
  lessonId: String,
  studentId: String,
  topic: String,
  difficulty: String,
  status: String,
  content: {
    learningObjectives: [String],
    explanation: String,
    examples: [String],
    analogies: [String],
    keyPoints: [String],
    summary: String,
    revisionQuestions: [String],
    codeSnippets: [{ language: String, code: String }]
  },
  documentIds: [String],
  tokenUsage: { inputTokens: Number, outputTokens: Number, totalTokens: Number },
  completedAt: Date,
  generationError: String,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

Indexes: `{ lessonId: 1 }` unique, `{ studentId: 1, createdAt: -1 }`, `{ studentId: 1, status: 1 }`, `{ deletedAt: 1 }`

---

## quizzes

```javascript
{
  _id: ObjectId,
  quizId: String,
  studentId: String,
  topic: String,
  difficulty: String,
  questionCount: Number,
  status: String,
  questions: [{
    questionId: String,
    type: String,
    text: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    difficulty: String,
    topic: String
  }],
  lessonId: String,
  tokenUsage: { inputTokens: Number, outputTokens: Number, totalTokens: Number },
  generationError: String,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

Indexes: `{ quizId: 1 }` unique, `{ studentId: 1, createdAt: -1 }`, `{ lessonId: 1 }`, `{ deletedAt: 1 }`

---

## quiz_attempts

```javascript
{
  _id: ObjectId,
  attemptId: String,
  quizId: String,
  studentId: String,
  answers: [{
    questionId: String,
    answer: String,
    isCorrect: Boolean,
    timeTakenSeconds: Number,
    hintUsed: Boolean
  }],
  score: Number,
  correctCount: Number,
  totalQuestions: Number,
  hintCount: Number,
  totalTimeSeconds: Number,
  perQuestionResults: [{
    questionId: String,
    isCorrect: Boolean,
    explanation: String
  }],
  overallFeedback: String,
  createdAt: Date
}
```

Indexes: `{ attemptId: 1 }` unique, `{ quizId: 1, createdAt: -1 }`, `{ studentId: 1, createdAt: -1 }`

---

## documents

```javascript
{
  _id: ObjectId,
  documentId: String,
  studentId: String,
  title: String,
  originalFilename: String,
  fileType: String,
  fileSizeBytes: Number,
  storagePath: String,
  status: String,                  // 'uploaded' | 'processing' | 'embedding' | 'ready' | 'failed'
  processingError: String,
  pageCount: Number,
  chunkCount: Number,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

Indexes: `{ documentId: 1 }` unique, `{ studentId: 1, createdAt: -1 }`, `{ studentId: 1, status: 1 }`, `{ deletedAt: 1 }`

---

## document_chunks

```javascript
{
  _id: ObjectId,
  chunkId: String,
  documentId: String,
  studentId: String,
  content: String,
  embedding: [Number],             // 768-dimensional float array
  pageNumber: Number,
  heading: String,
  chunkIndex: Number,
  tokenCount: Number,
  createdAt: Date
}
```

Indexes: `{ chunkId: 1 }` unique, `{ documentId: 1, chunkIndex: 1 }`, `{ studentId: 1 }`

**Atlas Vector Search Index:**

```json
{
  "name": "vector_index",
  "type": "vectorSearch",
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "studentId"
    }
  ]
}
```

The `studentId` filter ensures students can only search within their own document chunks.

---

## ai_conversations

```javascript
{
  _id: ObjectId,
  conversationId: String,
  studentId: String,
  topic: String,
  documentIds: [String],
  messageCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes: `{ conversationId: 1 }` unique, `{ studentId: 1, updatedAt: -1 }`

---

## ai_messages

```javascript
{
  _id: ObjectId,
  messageId: String,
  conversationId: String,
  studentId: String,
  role: String,
  content: String,
  sources: [{
    chunkId: String,
    documentId: String,
    pageNumber: Number,
    heading: String,
    excerpt: String
  }],
  followUpSuggestions: [String],
  tokenUsage: { inputTokens: Number, outputTokens: Number, totalTokens: Number },
  createdAt: Date
}
```

Indexes: `{ messageId: 1 }` unique, `{ conversationId: 1, createdAt: 1 }`

---

## flashcards

```javascript
{
  _id: ObjectId,
  flashcardId: String,
  studentId: String,
  front: String,
  back: String,
  topic: String,
  difficulty: String,
  source: String,
  sourceId: String,
  createdAt: Date
}
```

Indexes: `{ flashcardId: 1 }` unique, `{ studentId: 1, createdAt: -1 }`, `{ studentId: 1, topic: 1 }`, `{ studentId: 1, source: 1 }`

---

## progress

```javascript
{
  _id: ObjectId,
  progressId: String,
  studentId: String,
  lessonsCompleted: Number,
  quizzesCompleted: Number,
  avgQuizScore: Number,
  documentsUploaded: Number,
  flashcardsReviewed: Number,
  studyTimeSeconds: Number,
  learningStreak: Number,
  lastActiveAt: Date,
  topicScores: [{
    topic: String,
    masteryScore: Number,
    lastStudied: Date,
    quizAttempts: Number,
    avgQuizScore: Number
  }],
  weakTopics: [String],
  strongTopics: [String],
  updatedAt: Date
}
```

Indexes: `{ studentId: 1 }` unique

---

## behaviour_events

```javascript
{
  _id: ObjectId,
  eventId: String,
  studentId: String,
  type: String,
  payload: Object,
  occurredAt: Date
}
```

Indexes: `{ eventId: 1 }` unique, `{ studentId: 1, occurredAt: -1 }`, `{ studentId: 1, type: 1 }`, `{ occurredAt: -1 }` (TTL: 365 days)

---

## audit_logs

```javascript
{
  _id: ObjectId,
  auditId: String,
  adminId: String,
  action: String,
  targetId: String,
  targetType: String,
  details: Object,
  ipAddress: String,
  occurredAt: Date
}
```

Indexes: `{ auditId: 1 }` unique, `{ adminId: 1, occurredAt: -1 }`, `{ action: 1 }`, `{ occurredAt: -1 }`

No TTL — audit logs are retained permanently.

---

# Design Decisions

**MongoDB over SQL:** GenLearn entities are document-shaped (lessons embed structured content, quizzes embed questions). MongoDB Atlas also provides built-in vector search, eliminating the need for a separate vector database. See ADR-002.

**Soft deletes everywhere:** `deletedAt` is used on all user-facing entities. Repositories always add `{ deletedAt: null }` to queries. Data is retained for audit purposes.

**Denormalised studentId:** `studentId` is stored on every child entity (chunks, messages, attempts) to allow efficient scoped queries and vector search filtering without joins.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial database design created. |
