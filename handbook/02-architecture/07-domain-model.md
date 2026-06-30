# Document Metadata

**Document ID:** 07

**Title:** Domain Model

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** Critical

---

# Dependencies

- Document 00 – Project Constitution
- Document 00A – Glossary & Ubiquitous Language
- Document 01 – Project Vision & Scope
- Document 02 – Product Requirements Document
- Document 05 – High-Level Architecture
- Document 06A – Backend Low-Level Design
- Document 06B – AI Platform Low-Level Design
- Document 06C – Frontend Low-Level Design

---

# Related Documents

- Document 08 – Database Design
- Document 09 – API Specification
- Document 10 – Authentication & Security
- Document 11 – AI Architecture
- Document 14 – Adaptive Learning Engine

---

# Purpose

The Domain Model defines the business entities, relationships, aggregates, value objects, bounded contexts, and domain services that together represent the GenLearn platform.

It is the canonical representation of the business domain and must remain independent of implementation technologies such as MongoDB, NestJS, React, or FastAPI.

The Domain Model is the foundation for persistence, APIs, AI workflows, and business logic.

---

# Scope

This document defines:

- Bounded Contexts
- Domain Entities
- Aggregates
- Aggregate Roots
- Value Objects
- Domain Services
- Domain Events
- Entity Relationships
- Business Invariants

Implementation details are intentionally excluded.

---

# Domain Philosophy

The Domain Model describes the business.

It does not describe:

- Database collections
- API endpoints
- UI screens
- Framework classes

Every concept in this document should remain valid even if the implementation technology changes.

---

# Domain Design Principles

The GenLearn domain follows Domain-Driven Design (DDD).

Core principles include:

- Ubiquitous Language
- Rich Domain Model
- High Cohesion
- Low Coupling
- Aggregate Consistency
- Explicit Business Rules
- Clear Ownership Boundaries

---

# Bounded Contexts

The platform is divided into the following bounded contexts.

---

## Identity Context

Responsible for:

- Users
- Authentication
- Authorization
- Roles
- Sessions

Aggregate Root

User

---

## Learning Context

Responsible for:

- Lessons
- Learning Goals
- Learning Sessions
- Progress
- Recommendations

Aggregate Root

Student Profile

---

## Assessment Context

Responsible for:

- Assessments
- Quizzes
- Questions
- Attempts
- Results

Aggregate Root

Assessment

---

## Knowledge Context

Responsible for:

- Documents
- Knowledge Sources
- Chunks
- Flashcards
- Summaries

Aggregate Root

Knowledge Source

---

## AI Context

Responsible for:

- AI Tutor
- Lesson Generation
- Prompt Templates
- AI Requests
- AI Responses

Aggregate Root

AI Conversation

---

## Analytics Context

Responsible for:

- Behaviour Events
- Learning Analytics
- Adaptive Scores
- AI Metrics

Aggregate Root

Learning Analytics

---

## Administration Context

Responsible for:

- Platform Management
- AI Monitoring
- User Management
- Audit Logs

Aggregate Root

Administration Workspace

---

# Core Domain Entities

The following entities possess unique identities.

---

## User

Represents an authenticated identity.

Lifecycle

Registration

↓

Verification

↓

Active

↓

Suspended

↓

Archived

---

## Student Profile

Represents the educational identity of a learner.

Owns

- Learning Goals
- Adaptive Profile
- Progress
- Learning History

---

## Lesson

Represents AI-generated educational content.

Lifecycle

Generated

↓

Reviewed

↓

Completed

↓

Revisited

---

## Assessment

Represents an educational evaluation.

Contains

- Questions
- Attempts
- Results

---

## Knowledge Source

Represents uploaded educational material.

Lifecycle

Uploaded

↓

Processed

↓

Chunked

↓

Embedded

↓

Indexed

↓

Available

---

## AI Conversation

Represents a conversational tutoring session.

Contains

- Messages
- Context
- References
- Metadata

---

## Behaviour Event

Represents a measurable learner interaction.

Examples

- Lesson Opened
- Quiz Submitted
- Hint Requested
- Flashcard Reviewed

---

# Value Objects

Value Objects possess no identity.

Examples

- Email Address
- Password Hash
- Learning Goal
- Difficulty Level
- Token Usage
- Citation
- Prompt Template Version
- AI Model Version
- Score
- Time Duration

Value Objects are immutable.

---

# Aggregates

Aggregate boundaries ensure consistency.

---

## User Aggregate

Root

User

Contains

- Credentials
- Roles
- Sessions

---

## Student Aggregate

Root

Student Profile

Contains

- Progress
- Learning Goals
- Adaptive Profile
- Recommendations

---

## Assessment Aggregate

Root

Assessment

Contains

- Questions
- Attempts
- Results
- Feedback

---

## Knowledge Aggregate

Root

Knowledge Source

Contains

- Document
- Chunks
- Embeddings
- Flashcards

---

## AI Aggregate

Root

AI Conversation

Contains

- Messages
- Prompt Metadata
- Citations

---

## Analytics Aggregate

Root

Learning Analytics

Contains

- Behaviour Events
- Engagement
- Mastery
- Adaptive Score

---

# Aggregate Rules

Only Aggregate Roots may be modified directly.

Child entities are modified through their owning aggregate.

Cross-aggregate updates occur through domain events.

---

# Domain Services

Domain Services implement business rules spanning multiple aggregates.

Examples

- Adaptive Learning Service
- Recommendation Service
- Mastery Calculation Service
- Behaviour Analysis Service
- Assessment Evaluation Service
- AI Context Builder

Domain Services do not own data.

---

# Domain Events

Business events include:

- UserRegistered
- LessonGenerated
- QuizCompleted
- DocumentUploaded
- KnowledgeIndexed
- FlashcardsGenerated
- AIConversationStarted
- RecommendationCreated
- AdaptiveProfileUpdated

Events enable loose coupling.

---

# Entity Relationships

```
User
 │
 │ 1 : 1
 ▼
Student Profile
 │
 ├──────── Lessons
 │
 ├──────── Assessments
 │
 ├──────── Documents
 │
 ├──────── AI Conversations
 │
 ├──────── Behaviour Events
 │
 ├──────── Recommendations
 │
 └──────── Progress
```

---

# Business Invariants

The following rules must always hold true.

Identity

- Every Student Profile belongs to exactly one User.
- Every User possesses at least one Role.

Learning

- Every Lesson belongs to exactly one Student.
- Progress is derived from completed educational activities.

Knowledge

- Every Knowledge Chunk belongs to one Knowledge Source.
- Chunks cannot exist independently.

Assessment

- Every Attempt belongs to one Assessment.
- Every Assessment Result belongs to one Attempt.

AI

- Every AI Conversation belongs to one Student.
- AI Responses retain generation metadata.

Analytics

- Behaviour Events are immutable.
- Adaptive Scores are recalculated rather than edited.

---

# Ubiquitous Language Mapping

Business terminology defined in Document 00A shall be used consistently throughout the platform.

No alternative terminology may be introduced without updating the Glossary.

---

# Risks

- Aggregate boundaries becoming too large.
- Domain leakage into infrastructure.
- Business logic duplicated across services.

Mitigation:

- Strict DDD adherence.
- Regular architecture reviews.
- Repository abstraction.

---

# Assumptions

- One educational profile per user.
- AI workflows remain stateless.
- Educational history is retained indefinitely unless deleted by policy.

---

# Constraints

- Aggregates must remain internally consistent.
- Business rules belong only in the Domain Layer.
- Infrastructure cannot modify domain state directly.

---

# Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Rich Domain Model | Better maintainability | Higher initial design effort |
| Aggregate boundaries | Data consistency | More domain events |
| Domain Services | Clear business logic | Additional abstraction |

---

# Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Anemic Domain Model | Business logic scattered across services |
| Database-first design | Couples business model to persistence |
| Shared mutable entities | Difficult to maintain consistency |

---

# Future Improvements

Future domain extensions may include:

- Teacher Aggregate
- Classroom Aggregate
- Institution Aggregate
- Course Aggregate
- Learning Community Aggregate
- AI Agent Aggregate

The current model is designed to accommodate these additions without breaking existing aggregates.

---

# Claude Code Implementation Instructions

1. Create domain entities before database schemas.
2. Implement aggregates before repositories.
3. Keep business logic inside the Domain Layer.
4. Use domain events for cross-aggregate communication.
5. Avoid exposing persistence concerns within domain entities.
6. Follow the aggregate boundaries defined in this document.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial Domain Model created. |