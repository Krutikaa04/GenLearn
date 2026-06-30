# Document Metadata

**Document ID:** 04A

**Title:** System Context & C4 Model

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

---

# Related Documents

- Document 05 – High-Level Architecture
- Document 06 – Low-Level Design
- Document 18 – Infrastructure & Deployment

---

# Purpose

This document defines the architectural context of the GenLearn platform using the C4 Model.

Rather than describing implementation details, it explains how users, external systems, and platform services interact.

It serves as the bridge between product requirements and technical architecture.

---

# Scope

This document defines:

- System Context (C4 Level 1)
- Container Architecture (C4 Level 2)
- External Systems
- Trust Boundaries
- High-Level Data Flow
- Communication Patterns

---

# Intended Audience

- Software Architects
- Backend Engineers
- Frontend Engineers
- AI Engineers
- DevOps Engineers
- Project Evaluators
- Claude Code

---

# Table of Contents

1. Introduction
2. C4 Model Overview
3. System Context
4. External Systems
5. Container Diagram
6. Trust Boundaries
7. High-Level Data Flow
8. Communication Patterns
9. Design Decisions
10. Claude Code Instructions
11. Revision History

---

# Introduction

GenLearn is designed as a modular AI-native educational platform.

The platform separates user interfaces, business logic, artificial intelligence, knowledge processing, analytics, and infrastructure into distinct platform capabilities.

This separation improves scalability, maintainability, and future extensibility.

---

# C4 Model Overview

The C4 Model describes software architecture using four abstraction levels:

- Level 1 – System Context
- Level 2 – Container
- Level 3 – Component
- Level 4 – Code

The GenLearn handbook documents Levels 1–3.

Code-level organization is documented separately through implementation standards.

---

# C4 Level 1 — System Context

## Primary Actors

### Student

Interacts with:

- Student Workspace
- AI Tutor
- Lesson Generator
- Quiz Center
- Study Materials
- Progress Dashboard

---

### Administrator

Interacts with:

- Admin Workspace
- User Management
- Analytics Dashboard
- AI Monitoring
- Content Management

---

## External Systems

### AI Provider

Purpose:

Large Language Model inference.

Current MVP:

Google Gemini API

Future Providers:

- OpenAI
- Anthropic
- Groq
- Hugging Face

---

### MongoDB Atlas

Purpose:

Primary operational database.

Stores:

- Users
- Lessons
- Quizzes
- Analytics
- Documents
- Chats
- Flashcards

---

### Redis

Purpose:

Caching and asynchronous processing.

Supports:

- BullMQ
- Sessions
- Temporary cache
- Rate limiting

---

### Email Provider

Purpose:

Account verification

Password reset

Future notifications

---

### Object Storage

Purpose:

Store uploaded documents.

Future providers:

- AWS S3
- Cloudinary
- Azure Blob Storage

MVP:

Local storage (development)

Cloud object storage (production)

---

# C4 Level 2 — Container Architecture

The platform consists of the following containers.

---

## React Frontend

Responsibilities

- User Interface
- Authentication
- Dashboards
- AI Chat
- Lessons
- Quizzes
- Analytics

Technology

React

TypeScript

Vite

TailwindCSS

---

## API Gateway (NestJS Backend)

Responsibilities

- Authentication
- Business Logic
- Validation
- Authorization
- API Orchestration

Communicates with:

- MongoDB
- Redis
- AI Platform

---

## AI Platform (FastAPI)

Responsibilities

- Lesson Generation
- Quiz Generation
- AI Tutor
- Prompt Management
- Adaptive Learning
- RAG

Communicates with:

- AI Provider
- MongoDB
- Vector Store

---

## MongoDB Atlas

Responsibilities

Persistent data storage.

---

## Redis

Responsibilities

Caching

Queues

Temporary storage

---

## BullMQ Workers

Responsibilities

Background processing.

Examples

- Embeddings
- Email
- Analytics
- AI Processing

---

# Trust Boundaries

Boundary 1

Internet

↓

React Frontend

---

Boundary 2

Authenticated API

↓

NestJS

---

Boundary 3

Internal Services

↓

FastAPI

Redis

MongoDB

BullMQ

---

Boundary 4

External Providers

↓

Gemini API

Email Provider

Object Storage

---

# High-Level Data Flow

Student

↓

React Frontend

↓

NestJS API

↓

Authentication

↓

Business Logic

↓

FastAPI

↓

AI Provider

↓

Generated Response

↓

MongoDB

↓

React Frontend

---

# Communication Patterns

Frontend ↔ Backend

REST API

---

Backend ↔ AI Platform

REST API

---

Backend ↔ Redis

TCP

---

Backend ↔ MongoDB

MongoDB Driver

---

AI Platform ↔ Gemini

HTTPS

---

BullMQ ↔ Redis

Queue Protocol

---

# Architectural Principles

The following principles govern communication:

- Frontend never communicates directly with AI providers.
- AI providers are abstracted behind the AI Platform.
- All business logic resides in the backend.
- Every request requiring persistence passes through the backend.
- Background processing must never block user requests.
- AI requests are stateless unless explicitly associated with learner context.

---

# Design Decisions

- Adopt the C4 Model for architecture documentation.
- Separate presentation, business logic, AI, and persistence.
- Minimize coupling between services.
- Use explicit trust boundaries.
- Prefer asynchronous processing for expensive workloads.

---

# Claude Code Implementation Instructions

Before implementing any service:

1. Identify its container.
2. Respect defined trust boundaries.
3. Do not bypass platform layers.
4. Use the documented communication patterns.
5. Keep services independently deployable where practical.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial System Context & C4 Model created. |