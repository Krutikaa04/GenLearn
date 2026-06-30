# Document Metadata

**Document ID:** 08

**Title:** Database Design

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** Critical

---

# Dependencies

- Document 07 – Domain Model
- Document 07A – Event-Driven Architecture

---

# Related Documents

- 09 – API Specification
- 10 – Authentication & Security
- 11 – AI Architecture
- 12 – RAG Architecture
- 18 – Infrastructure & Deployment

---

# Purpose

This document defines the complete persistence architecture of GenLearn.

It specifies:

- Conceptual Data Model
- Logical Data Model
- Physical MongoDB Design
- Collection Schemas
- Relationships
- Validation Rules
- Indexing Strategy
- Vector Search
- Redis Caching Strategy
- Backup & Recovery

The document is implementation-independent wherever possible while providing sufficient detail for MongoDB Atlas implementation.

---

# Database Philosophy

The database stores **business state**, not application state.

Business entities originate from the Domain Model and are persisted through repositories.

The database is not responsible for business logic.

MongoDB Atlas is the System of Record.

Redis acts only as a temporary performance optimization layer.

---

# Data Architecture

```
Domain Model

↓

Repositories

↓

MongoDB Atlas

↓

Indexes

↓

Atlas Vector Search

↓

Redis Cache
```

---

# Database Design Principles

The database follows:

- Domain-Driven Design
- Collection-per-Aggregate
- Controlled Denormalization
- Read Optimization
- Write Consistency
- Schema Validation
- Index-First Design

---

# Conceptual Data Model

The primary business entities are:

- User
- Student Profile
- Lesson
- Assessment
- Quiz Attempt
- Knowledge Source
- Knowledge Chunk
- Flashcard
- AI Conversation
- Progress
- Recommendation
- Behaviour Event
- Audit Log

---

# Logical Data Model

```
User
 │
 ├──── Student Profile
 │
 ├──── Lessons
 │
 ├──── Assessments
 │
 ├──── AI Conversations
 │
 ├──── Documents
 │
 ├──── Progress
 │
 ├──── Flashcards
 │
 ├──── Recommendations
 │
 └──── Behaviour Events
```

Aggregate ownership follows the Domain Model.

---

# Physical Database

MongoDB Collections

```
users

student_profiles

lessons

quizzes

quiz_attempts

progress

documents

document_chunks

flashcards

ai_conversations

ai_messages

recommendations

behaviour_events

notifications

refresh_tokens

audit_logs

system_metrics

prompt_templates

ai_usage_logs
```

---

# Collection Design

## users

Purpose

Stores authentication identities.

Fields

- _id
- email
- passwordHash
- role
- status
- emailVerified
- createdAt
- updatedAt

Indexes

- email (unique)
- role
- status

---

## student_profiles

Stores learner information.

Fields

- userId
- grade
- interests
- learningGoals
- adaptiveScore
- masteryLevel
- createdAt

Indexes

- userId (unique)
- adaptiveScore

---

## lessons

Stores generated lessons.

Fields

- userId
- topic
- difficulty
- objectives
- generatedContent
- summary
- aiMetadata
- createdAt

Indexes

- userId
- topic
- createdAt

---

## quizzes

Stores quiz definitions.

Indexes

- userId
- lessonId
- difficulty

---

## quiz_attempts

Stores student attempts.

Indexes

- quizId
- userId
- completedAt

---

## documents

Stores uploaded document metadata.

Indexes

- userId
- uploadDate

---

## document_chunks

Stores processed chunks.

Fields

- documentId
- chunkIndex
- chunkText
- embeddingReference
- metadata

Indexes

- documentId
- chunkIndex

Vector Index

embedding

---

## flashcards

Stores generated flashcards.

Indexes

- userId
- documentId

---

## ai_conversations

Stores tutor sessions.

Indexes

- userId
- lastUpdated

---

## ai_messages

Stores conversation messages.

Indexes

- conversationId
- timestamp

---

## progress

Stores learner progress.

Indexes

- userId

---

## recommendations

Stores personalized recommendations.

Indexes

- userId
- priority

---

## behaviour_events

Stores immutable analytics events.

Indexes

- userId
- eventType
- timestamp

---

## audit_logs

Stores administrator activity.

Indexes

- actorId
- action
- timestamp

---

# Relationships

MongoDB favors document references.

Reference examples:

Student Profile

↓

User

Lesson

↓

Student

Quiz

↓

Lesson

Document Chunk

↓

Knowledge Source

Flashcard

↓

Document

---

# Denormalization Strategy

Duplicate only frequently accessed immutable data.

Allowed:

- Student name in lessons
- Topic title in quiz attempts

Not Allowed:

- Passwords
- Roles
- Adaptive Score
- Learning Goals

These remain single-source-of-truth fields.

---

# Validation Rules

Every collection defines:

- Required fields
- Type validation
- Enum validation
- Length constraints
- Default values

Validation occurs in:

- DTO
- Domain Layer
- MongoDB Schema

---

# Indexing Strategy

Index types:

- Unique
- Compound
- Sparse
- TTL
- Text
- Vector

Indexes are created before production deployment.

---

# Compound Indexes

Examples:

Lessons

(userId, createdAt)

Behaviour Events

(userId, timestamp)

Quiz Attempts

(userId, quizId)

Recommendations

(userId, priority)

---

# TTL Indexes

Temporary collections use TTL.

Examples

Password Reset Tokens

Email Verification Tokens

Temporary Upload Sessions

Cached AI Responses (if persisted)

---

# Atlas Vector Search

Knowledge chunks use Atlas Vector Search.

Embedding model:

Provider-independent.

Current MVP:

Google Gemini Embeddings (or provider selected later)

Future providers:

- OpenAI
- Voyage AI
- Cohere

Vector search retrieves semantic knowledge for RAG.

---

# Redis Caching Strategy

Cache:

- Sessions
- AI Responses
- Recommendations
- Frequently accessed lessons
- Dashboard summaries

Redis never becomes the system of record.

---

# Backup Strategy

MongoDB Atlas backups:

- Daily snapshots
- Point-in-time recovery
- Automated backups

Critical exports:

- Users
- Progress
- Documents
- AI Conversations

---

# Recovery Strategy

Recovery priorities:

1. Authentication
2. Student Profiles
3. Documents
4. Lessons
5. AI Conversations
6. Analytics

---

# Data Retention

Permanent

- Lessons
- Documents
- Progress
- Assessments

Temporary

- Password reset tokens
- Email verification tokens
- Upload sessions

Configurable

- AI Usage Logs
- Behaviour Events
- Audit Logs

---

# Risks

- Large AI documents
- Embedding storage growth
- Index fragmentation
- Hot collections
- Large analytics datasets

---

# Assumptions

- MongoDB Atlas remains the primary database.
- Redis is available.
- Atlas Vector Search is enabled.
- Daily backups are configured.

---

# Constraints

- Business logic remains outside MongoDB.
- Repositories control persistence.
- Collections follow aggregate boundaries.

---

# Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| MongoDB | Flexible schema | Less relational integrity |
| References | Scalability | Additional queries |
| Controlled denormalization | Faster reads | Some duplication |
| Atlas Vector Search | Integrated RAG | Atlas dependency |

---

# Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| PostgreSQL | Less flexible for AI documents |
| Firebase | Limited querying |
| Supabase | Strong for relational apps but not optimal for GenLearn's AI-first document model |

---

# Future Improvements

- Collection sharding
- Read replicas
- Multi-region deployment
- Time-series collections
- Event Store
- Cold storage for analytics
- Automatic embedding re-indexing

---

# References

- MongoDB Atlas Documentation
- MongoDB Vector Search Documentation
- Domain-Driven Design by Eric Evans
- Designing Data-Intensive Applications by Martin Kleppmann

---

# Claude Code Implementation Instructions

1. Create collections according to aggregate boundaries.
2. Implement schema validation before repository logic.
3. Create indexes before production deployment.
4. Use references instead of deep document nesting.
5. Keep MongoDB provider-specific features behind abstractions.
6. Do not place business logic in persistence models.
7. Ensure every repository follows this design.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial Database Design created. |