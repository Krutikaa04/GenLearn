# Document Metadata

**Document ID:** 06A

**Title:** Backend Low-Level Design

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** Critical

---

# Dependencies

- Document 00 – Constitution
- Document 00A – Glossary
- Document 01 – Vision
- Document 02 – PRD
- Document 04 – Technology Decision Record
- Document 04A – System Context
- Document 05 – High-Level Architecture

---

# Related Documents

- 06B – AI Platform Low-Level Design
- 06C – Frontend Low-Level Design
- 07 – Domain Model
- 08 – Database Design
- 09 – API Specification

---

# Purpose

This document defines the internal backend architecture of GenLearn.

Unlike the High-Level Architecture, this document specifies how the backend application is organized internally, including layers, modules, request flow, dependency rules, folder structure, error handling, validation, background processing, and integration with the AI Platform.

It serves as the implementation blueprint for the NestJS backend.

---

# Scope

This document covers:

- Backend Architecture
- Module Organization
- Request Lifecycle
- Dependency Injection
- Clean Architecture
- Repository Pattern
- Validation
- Exception Handling
- Event Flow
- Queue Integration
- Redis Integration
- MongoDB Integration
- AI Platform Integration

---

# Backend Philosophy

The backend is responsible for business orchestration.

It does **not** generate AI responses.

It does **not** contain prompt engineering.

It does **not** contain retrieval logic.

Those responsibilities belong exclusively to the AI Platform.

The backend coordinates platform capabilities.

---

# Architectural Style

The backend follows:

- Clean Architecture
- Domain-Driven Design
- Modular Monolith (MVP)
- API-First Design
- Repository Pattern
- Dependency Injection

The MVP begins as a Modular Monolith to reduce operational complexity while maintaining clear module boundaries.

Future versions may extract individual modules into microservices without major redesign.

---

# Backend Layers

```
Client Request
        │
        ▼
Controllers
        │
        ▼
Application Services
        │
        ▼
Domain Services
        │
        ▼
Repositories
        │
        ▼
MongoDB
```

Cross-cutting concerns such as authentication, logging, validation, rate limiting, and auditing are applied before requests reach business logic.

---

# Module Organization

The backend is organized into independent business modules.

```
src/

authentication/

users/

students/

lessons/

quizzes/

progress/

analytics/

documents/

flashcards/

recommendations/

notifications/

admin/

shared/

infrastructure/

config/
```

Each module owns its business logic.

Modules must communicate through public service interfaces rather than accessing each other's repositories directly.

---

# Internal Module Structure

Every module follows the same structure.

```
module/

controllers/

services/

repositories/

entities/

dtos/

validators/

interfaces/

events/

mappers/

tests/
```

This consistency improves discoverability and maintainability.

---

# Controller Responsibilities

Controllers are responsible only for:

- Receiving HTTP requests
- Validating request format
- Invoking application services
- Returning standardized responses

Controllers must never contain business logic.

Maximum controller complexity should remain minimal.

---

# Application Services

Application Services coordinate business workflows.

Responsibilities include:

- Calling domain services
- Managing transactions
- Invoking repositories
- Publishing events
- Calling the AI Platform
- Coordinating background jobs

Application Services are the primary orchestration layer.

---

# Domain Services

Domain Services implement business rules.

Examples include:

- Calculate Mastery
- Generate Recommendation
- Update Adaptive Profile
- Validate Assessment

Domain Services remain independent of frameworks and infrastructure.

---

# Repository Layer

Repositories abstract database access.

Responsibilities:

- CRUD operations
- Query construction
- Pagination
- Filtering
- Aggregation

Repositories must not contain business logic.

---

# Validation Strategy

Validation occurs at multiple levels.

## API Validation

DTO validation

Request validation

Type validation

Authentication validation

---

## Domain Validation

Business rule validation

Ownership validation

Permission validation

Adaptive rule validation

---

## Database Validation

Schema validation

Unique constraints

Index enforcement

---

# Exception Handling

The backend defines standardized exception categories.

Authentication Errors

Authorization Errors

Validation Errors

Business Rule Violations

Resource Not Found

Conflict Errors

Infrastructure Failures

External Service Failures

Every exception returns a consistent error response.

---

# AI Platform Integration

The backend never communicates directly with an AI Provider.

Instead:

```
Backend

↓

AI Platform

↓

Provider Adapter

↓

Gemini API
```

This separation preserves provider independence.

---

# Background Processing

Expensive operations execute asynchronously.

Examples include:

- PDF Processing
- Embedding Generation
- Flashcard Generation
- Analytics Aggregation
- Email Delivery

BullMQ queues coordinate asynchronous execution.

---

# Redis Responsibilities

Redis is used for:

- Session cache
- Rate limiting
- Temporary AI response cache
- Queue backend
- Distributed locks (future)

Redis is not the source of truth.

MongoDB remains the primary persistence layer.

---

# Logging Strategy

Every request receives:

- Correlation ID
- Timestamp
- User ID (if authenticated)
- Request Path
- Response Status
- Execution Time

AI requests additionally record:

- Provider
- Model
- Token usage
- Latency

Structured logging is mandatory.

---

# Security

The backend enforces:

- JWT Authentication
- RBAC
- Input validation
- Rate limiting
- MongoDB sanitization
- Secure headers
- CORS

Security is applied globally.

---

# Dependency Rules

Controllers may depend only on Application Services.

Application Services may depend on:

- Domain Services
- Repositories
- Infrastructure Services

Repositories may depend only on database abstractions.

Infrastructure must never depend on business modules.

Circular dependencies are prohibited.

---

# Design Decisions

- Modular Monolith for MVP
- Clean Architecture
- Repository Pattern
- DTO Validation
- Event-driven background processing
- Provider-independent AI integration
- Framework-independent Domain Layer

---

# Claude Code Implementation Instructions

Before generating backend code:

1. Generate modules one at a time.
2. Create DTOs before controllers.
3. Implement repositories before services.
4. Keep controllers thin.
5. Keep domain logic framework-independent.
6. Never bypass repositories.
7. Integrate with the AI Platform only through defined interfaces.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial Backend Low-Level Design created. |