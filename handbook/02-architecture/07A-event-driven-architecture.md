# Document Metadata

**Document ID:** 07A

**Title:** Event-Driven Architecture & Domain Events

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** High

---

# Dependencies

- Document 05 – High-Level Architecture
- Document 06A – Backend Low-Level Design
- Document 06B – AI Platform Low-Level Design
- Document 07 – Domain Model

---

# Related Documents

- Document 08 – Database Design
- Document 09 – API Specification
- Document 18 – Infrastructure & Deployment
- Document 20 – Testing Strategy

---

# Purpose

This document defines the Event-Driven Architecture (EDA) of the GenLearn platform.

It specifies how platform capabilities communicate using Domain Events, enabling loose coupling, asynchronous processing, scalability, auditability, and future migration toward distributed services.

The MVP implementation uses a Modular Monolith with BullMQ, but all events are designed to be portable to external message brokers in future releases.

---

# Scope

This document defines:

- Event philosophy
- Event lifecycle
- Event taxonomy
- Event producers
- Event consumers
- Payload structure
- Delivery guarantees
- Retry strategy
- Idempotency
- Event versioning
- Future event broker migration

---

# Event Philosophy

Events represent facts that have already occurred.

Events:

- Are immutable.
- Describe completed business actions.
- Are not commands.
- Are not API requests.
- Do not return responses.

Events enable independent platform capabilities to react without introducing tight coupling.

---

# Architectural Principles

The event system follows these principles:

- Publish after successful business transactions.
- Events are append-only.
- Consumers are independent.
- Event handlers must be idempotent.
- Processing failures must not corrupt business data.
- Background processing should never block user requests.

---

# Event Lifecycle

```
Business Action

↓

Domain Validation

↓

Transaction Commit

↓

Domain Event Published

↓

Queue

↓

Worker

↓

Event Handler

↓

Database Updates

↓

Analytics

↓

Notifications

↓

Audit Logs
```

Events are published only after the originating transaction completes successfully.

---

# Event Categories

The platform defines the following event categories.

---

## Identity Events

Examples:

- UserRegistered
- UserLoggedIn
- UserLoggedOut
- UserSuspended
- PasswordResetRequested
- EmailVerified

---

## Learning Events

Examples:

- LessonGenerated
- LessonViewed
- LessonCompleted
- RecommendationGenerated

---

## Assessment Events

Examples:

- QuizGenerated
- QuizStarted
- QuizSubmitted
- QuizCompleted
- AssessmentEvaluated

---

## Knowledge Events

Examples:

- DocumentUploaded
- DocumentDeleted
- DocumentProcessed
- KnowledgeIndexed
- EmbeddingsGenerated
- FlashcardsGenerated
- SummaryGenerated

---

## AI Events

Examples:

- AIConversationStarted
- AIMessageGenerated
- PromptExecuted
- ProviderRequestCompleted
- ProviderRequestFailed

---

## Analytics Events

Examples:

- BehaviourRecorded
- AdaptiveProfileUpdated
- MasteryCalculated
- RecommendationAccepted

---

## Administration Events

Examples:

- UserCreatedByAdmin
- UserDeleted
- UserRoleChanged
- PlatformConfigurationUpdated

---

# Event Producers

The following modules publish events.

| Module | Published Events |
|----------|------------------|
| Authentication | UserRegistered, UserLoggedIn |
| Lessons | LessonGenerated |
| Quiz | QuizCompleted |
| Documents | DocumentUploaded |
| AI | AIMessageGenerated |
| Analytics | AdaptiveProfileUpdated |
| Admin | UserRoleChanged |

---

# Event Consumers

Examples:

| Consumer | Events |
|-----------|--------|
| Analytics | All educational events |
| Recommendation Engine | QuizCompleted |
| AI Platform | DocumentProcessed |
| Notification Service | UserRegistered |
| Audit Service | Administrative events |
| Progress Service | LessonCompleted |

Consumers remain independent from publishers.

---

# Standard Event Schema

Every event follows the same structure.

```json
{
  "eventId": "uuid",
  "eventName": "LessonGenerated",
  "eventVersion": "1.0",
  "timestamp": "ISO8601",
  "correlationId": "uuid",
  "producer": "LessonService",
  "aggregateId": "student-id",
  "payload": {}
}
```

This standard simplifies logging, debugging, replay, and future broker migration.

---

# Correlation IDs

Every request receives a Correlation ID.

The same identifier propagates across:

- Backend
- AI Platform
- BullMQ Workers
- Logs
- Analytics

This enables end-to-end request tracing.

---

# Delivery Guarantees

The MVP provides:

**At-Least-Once Delivery**

Consumers must therefore be idempotent.

Future versions may support Exactly-Once semantics where appropriate.

---

# Idempotency

Every event handler must safely process duplicate events.

Examples:

- Do not regenerate flashcards twice.
- Do not increment mastery multiple times.
- Do not duplicate notifications.

Idempotency keys should be used where necessary.

---

# Retry Strategy

Retry policy:

- Retry transient failures using exponential backoff.
- Move permanently failing events to a Dead Letter Queue (DLQ).
- Record failure reason.
- Notify administrators if retry thresholds are exceeded.

---

# Dead Letter Queue

Failed events are moved to a dedicated Dead Letter Queue.

Each failed event records:

- Original payload
- Failure reason
- Retry count
- Timestamp
- Worker name

DLQ events are reviewed manually or replayed after corrective action.

---

# Event Ordering

Ordering guarantees apply only within a single aggregate.

For example:

Student A:

LessonGenerated

↓

QuizCompleted

↓

AdaptiveProfileUpdated

Student B events may execute independently.

---

# Event Versioning

Events are versioned.

Breaking payload changes require a new event version.

Consumers must explicitly support the versions they process.

---

# Event Persistence

The MVP does not persist an Event Store.

Events exist in BullMQ during processing and are logged for auditing.

Future versions may introduce Event Sourcing if business requirements justify it.

---

# Future Message Broker Migration

The event abstraction allows migration from BullMQ to:

- RabbitMQ
- Apache Kafka
- AWS SQS
- Azure Service Bus
- Google Pub/Sub

without changing business logic.

---

# Risks

- Duplicate processing
- Event storms
- Queue saturation
- Long-running workers
- DLQ growth

---

# Assumptions

- Redis is available.
- BullMQ is operational.
- Workers are independently deployable.
- Event consumers are idempotent.

---

# Constraints

- Events cannot modify the originating transaction.
- Events must be immutable.
- Producers must not know their consumers.
- Business workflows must remain deterministic.

---

# Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| BullMQ | Simple MVP | Limited distributed messaging features |
| At-Least-Once Delivery | Reliable | Requires idempotent consumers |
| Standard Event Schema | Consistency | Slightly larger payloads |

---

# Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Direct service calls | Tight coupling |
| Shared database polling | Poor scalability |
| Kafka for MVP | Operational complexity |
| Event Sourcing | Unnecessary complexity for current scope |

---

# Future Improvements

- Event Store
- Event Replay
- Event Dashboard
- Kafka integration
- Distributed Saga patterns
- Cross-region event replication

---

# Claude Code Implementation Instructions

1. Publish events only after successful transactions.
2. Keep producers unaware of consumers.
3. Use BullMQ for asynchronous processing.
4. Ensure all consumers are idempotent.
5. Include correlation IDs in every event.
6. Implement retry and DLQ support.
7. Version events from the beginning.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial Event-Driven Architecture document created. |