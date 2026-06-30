# Document Metadata

**Document ID:** 05

**Title:** High-Level Architecture

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** Critical

---

# Dependencies

- README
- Document 00 – Project Constitution
- Document 00A – Glossary & Ubiquitous Language
- Document 01 – Project Vision & Scope
- Document 02 – Product Requirements Document
- Document 04 – Technology Decision Record
- Document 04A – System Context & C4 Model

---

# Related Documents

- Document 06 – Low-Level Design
- Document 07 – Domain Model
- Document 08 – Database Design
- Document 09 – API Specification
- Document 10 – Authentication & Security
- Document 11 – AI Architecture
- Document 18 – Infrastructure & Deployment

---

# Purpose

This document defines the logical architecture of the GenLearn platform.

It describes the major platform capabilities, their responsibilities, communication patterns, architectural layers, dependency rules, and design principles.

It intentionally avoids implementation-specific details while providing a blueprint that every engineering team can follow.

---

# Scope

This document defines:

- Platform Layers
- Core Platform Capabilities
- Service Responsibilities
- Communication Rules
- Data Flow
- Architectural Principles
- Dependency Rules
- Cross-Cutting Concerns

---

# Intended Audience

- Software Architects
- Backend Engineers
- Frontend Engineers
- AI Engineers
- DevOps Engineers
- QA Engineers
- Claude Code

---

# Table of Contents

1. Architectural Vision
2. Design Principles
3. Platform Layers
4. Core Platform Capabilities
5. Layer Responsibilities
6. Request Lifecycle
7. Cross-Cutting Concerns
8. Dependency Rules
9. Scalability Strategy
10. Fault Tolerance
11. Architectural Constraints
12. Design Decisions
13. Claude Code Instructions
14. Revision History

---

# Architectural Vision

GenLearn is designed as an AI-native educational platform composed of independent but cooperating platform capabilities.

Each capability owns a specific business responsibility while remaining loosely coupled from other capabilities.

The architecture prioritizes:

- Modularity
- Scalability
- Maintainability
- Provider Independence
- Cloud Readiness
- AI Extensibility

The system is designed to evolve from a Final Year Project into a production-grade SaaS platform without architectural redesign.

---

# Architectural Principles

The following principles govern every architectural decision.

## 1. AI-First Architecture

Artificial Intelligence is not an external integration.

It is a first-class platform capability.

Every major educational workflow should be capable of leveraging AI.

---

## 2. Separation of Concerns

Each layer owns a single responsibility.

Examples:

Presentation → User Interface

Application → Business Workflows

Domain → Business Rules

Infrastructure → Technical Services

---

## 3. Loose Coupling

Platform capabilities communicate through clearly defined contracts.

No capability should directly access another capability's internal implementation.

---

## 4. High Cohesion

Related functionality should remain within the same capability.

Avoid scattering business logic across multiple services.

---

## 5. Provider Independence

The platform must remain independent of:

- AI Providers
- Cloud Providers
- Object Storage
- Email Providers
- Vector Databases

All external systems must be abstracted.

---

## 6. Security by Design

Authentication, authorization, validation, and auditing are foundational platform capabilities.

Security is never an afterthought.

---

# Platform Layers

The GenLearn platform is divided into six logical layers.

```
+------------------------------------------------+
|               Presentation Layer               |
+------------------------------------------------+
|               Application Layer                |
+------------------------------------------------+
|                 Domain Layer                   |
+------------------------------------------------+
|                 AI Layer                       |
+------------------------------------------------+
|             Infrastructure Layer              |
+------------------------------------------------+
|             External Services Layer           |
+------------------------------------------------+
```

Each layer has clearly defined responsibilities and dependencies.

---

# Layer Responsibilities

## Presentation Layer

Purpose

Provide all user-facing interfaces.

Contains

- Student Workspace
- Administrator Workspace
- Authentication Pages
- AI Tutor Interface
- Lesson Viewer
- Quiz Interface
- Analytics Dashboards

Technology

React

TypeScript

TailwindCSS

Framer Motion

---

## Application Layer

Purpose

Coordinate business workflows.

Responsibilities

- Request orchestration
- Validation
- Authentication
- Authorization
- Transaction coordination
- Service orchestration

Technology

NestJS

---

## Domain Layer

Purpose

Represent business concepts.

Contains

- Student
- Lesson
- Quiz
- Progress
- Adaptive Profile
- Behaviour Events
- Knowledge Source

Responsibilities

- Business Rules
- Domain Validation
- Domain Services
- Domain Events

No framework-specific logic belongs in this layer.

---

## AI Layer

Purpose

Deliver intelligent educational capabilities.

Contains

- AI Provider Abstraction
- Prompt Manager
- AI Tutor
- Lesson Generator
- Quiz Generator
- Adaptive Learning Engine
- RAG Pipeline
- Flashcard Generator
- Summary Generator

Technology

FastAPI

LangChain

Gemini API

---

## Infrastructure Layer

Purpose

Provide technical services.

Contains

- MongoDB
- Redis
- BullMQ
- Object Storage
- Logging
- Monitoring
- Email Services

Responsibilities

- Persistence
- Caching
- Queue Processing
- Background Jobs

---

## External Services Layer

Contains

- Gemini API
- MongoDB Atlas
- Redis
- Email Provider
- Cloud Object Storage

External systems must never contain business logic.

---

# Core Platform Capabilities

The platform is composed of the following logical capabilities.

## Identity Platform

Responsibilities

- Authentication
- Authorization
- RBAC
- Session Management

---

## Student Platform

Responsibilities

- Dashboard
- Learning Progress
- Profile
- Recommendations

---

## Knowledge Platform

Responsibilities

- Document Upload
- Text Extraction
- Chunking
- Embeddings
- Retrieval
- Knowledge Base

---

## Assessment Platform

Responsibilities

- Quiz Generation
- Assessment Evaluation
- Feedback
- Results

---

## AI Platform

Responsibilities

- AI Tutor
- Lesson Generation
- Prompt Management
- AI Provider Integration
- Flashcards
- Summaries

---

## Adaptive Learning Platform

Responsibilities

- Behaviour Tracking
- Mastery Estimation
- Difficulty Adjustment
- Learning Path Generation

---

## Analytics Platform

Responsibilities

- Learning Analytics
- Platform Analytics
- Behaviour Analytics
- AI Usage Metrics

---

## Administration Platform

Responsibilities

- User Management
- Content Management
- Platform Monitoring
- AI Monitoring

---

# Request Lifecycle

A standard request follows this lifecycle:

1. User initiates action.
2. Presentation Layer validates client input.
3. Request reaches Application Layer.
4. Authentication is verified.
5. Authorization is checked.
6. Business workflow is executed.
7. Domain rules are enforced.
8. AI Platform is invoked if required.
9. Infrastructure services persist data.
10. Response is returned to the client.
11. Background jobs are queued if necessary.
12. Analytics events are recorded.

---

# Cross-Cutting Concerns

The following concerns apply across all platform capabilities:

- Authentication
- Authorization
- Validation
- Logging
- Monitoring
- Error Handling
- Configuration
- Auditing
- Rate Limiting
- Observability
- Caching
- Exception Management

No capability is exempt from these concerns.

---

# Dependency Rules

The following dependency rules are mandatory:

- Presentation Layer may only communicate with the Application Layer.
- Application Layer may communicate with the Domain, AI, and Infrastructure Layers.
- Domain Layer must not depend on Infrastructure or UI frameworks.
- AI Layer must communicate with external AI providers only through provider abstractions.
- Infrastructure Layer must not contain business rules.
- External Services must never be accessed directly by the Presentation Layer.

Violating these rules requires an approved Architecture Decision Record (ADR).

---

# Scalability Strategy

The architecture supports horizontal scaling through:

- Stateless backend services
- Independent AI services
- External session storage
- Redis caching
- BullMQ workers
- MongoDB Atlas clustering
- Cloud-native deployment

---

# Fault Tolerance

The platform is designed to degrade gracefully.

Examples:

- AI Provider unavailable → Return cached response where appropriate or informative error.
- Redis unavailable → Continue core functionality with reduced performance where feasible.
- Background worker failure → Retry using queue policies.
- Object Storage unavailable → Preserve metadata and surface upload failure cleanly.
- External email provider failure → Queue retry without blocking user workflows.

Critical educational data must never be lost due to transient infrastructure failures.

---

# Architectural Constraints

The following constraints are mandatory:

- Business logic shall not exist inside controllers.
- AI providers shall not be called directly from frontend code.
- MongoDB shall only be accessed through repositories or data access abstractions.
- Long-running tasks shall execute asynchronously.
- Every external dependency shall have an abstraction layer.
- Platform capabilities shall communicate using defined contracts.
- Every API shall require validation.
- Every protected API shall require authentication and authorization.

---

# Architectural Quality Attributes

The architecture is optimized for the following quality attributes:

| Attribute | Priority | Strategy |
|-----------|----------|----------|
| Scalability | High | Stateless services, queues, caching |
| Maintainability | High | Modular architecture, DDD, clean layering |
| Security | High | JWT, RBAC, validation, auditing |
| Performance | High | Redis caching, async processing |
| Reliability | High | Retry policies, graceful degradation |
| Extensibility | High | Provider abstractions, modular capabilities |
| Observability | High | Structured logging, metrics, tracing |
| Testability | High | Dependency injection, clear contracts |

---

# Design Decisions

- Adopt a layered architecture.
- Organize the system around platform capabilities rather than technical modules.
- Isolate AI functionality into a dedicated AI Platform.
- Keep the Domain Layer framework-independent.
- Use asynchronous processing for computationally intensive operations.
- Design for provider independence from the beginning.

---

# Claude Code Implementation Instructions

Before implementing any feature:

1. Identify the owning Platform Capability.
2. Determine which architectural layer owns the responsibility.
3. Respect dependency rules.
4. Do not bypass platform abstractions.
5. Keep business logic within the Domain Layer.
6. Use asynchronous processing for expensive tasks.
7. Follow the quality attributes defined in this document.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial High-Level Architecture created. |