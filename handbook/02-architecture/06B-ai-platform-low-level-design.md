# Document Metadata

**Document ID:** 06B

**Title:** AI Platform Low-Level Design

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
- Document 04 – Technology Decision Record
- Document 05 – High-Level Architecture
- Document 06A – Backend Low-Level Design

---

# Related Documents

- Document 07 – Domain Model
- Document 08 – Database Design
- Document 09 – API Specification
- Document 11 – AI Architecture
- Document 12 – RAG Architecture
- Document 13 – Prompt Engineering Guide
- Document 14 – Adaptive Learning Engine
- Document 15 – AI Evaluation Framework

---

# Purpose

This document defines the internal architecture of the GenLearn AI Platform.

The AI Platform is responsible for all intelligence-driven capabilities, including lesson generation, conversational tutoring, adaptive learning, quiz generation, Retrieval-Augmented Generation (RAG), flashcard creation, and educational recommendations.

Unlike the backend, the AI Platform contains no authentication or business orchestration logic. Its responsibility is to execute AI workflows based on requests received from the backend.

---

# Scope

This document defines:

- AI Platform architecture
- Internal AI services
- AI workflow orchestration
- Prompt management
- Provider abstraction
- Context assembly
- RAG execution
- Response validation
- AI analytics
- Token tracking
- Error handling
- Retry strategy

---

# AI Platform Philosophy

The AI Platform is a reusable intelligence layer.

It should never:

- Authenticate users
- Access frontend components
- Manage user sessions
- Execute business workflows

Instead, it focuses exclusively on transforming structured educational requests into high-quality AI-powered educational responses.

---

# Architectural Style

The AI Platform follows:

- Service-Oriented Architecture
- Provider Abstraction
- Workflow-Based Execution
- Stateless Request Processing
- Clean Architecture
- Dependency Injection

The platform is designed so that AI providers, vector stores, embedding providers, and prompt templates can be replaced independently.

---

# Internal AI Layers

```
Incoming Request
        │
        ▼
Request Validator
        │
        ▼
Workflow Router
        │
        ▼
Context Builder
        │
        ▼
Prompt Manager
        │
        ▼
RAG Engine (Optional)
        │
        ▼
Provider Adapter
        │
        ▼
AI Provider
        │
        ▼
Response Validator
        │
        ▼
Response Formatter
        │
        ▼
Backend Response
```

Each layer has a single responsibility.

---

# AI Platform Modules

```
ai-platform/

provider/

prompt-manager/

lesson-generator/

quiz-generator/

chat-tutor/

rag/

adaptive-learning/

flashcards/

summaries/

analytics/

evaluation/

shared/
```

Each module communicates through interfaces rather than concrete implementations.

---

# AI Workflow Router

The Workflow Router determines which AI capability should process a request.

Supported workflows include:

- Lesson Generation
- Quiz Generation
- AI Tutor
- Flashcard Generation
- Summary Generation
- Recommendation Generation
- Adaptive Difficulty
- Document Question Answering

The router delegates requests without embedding business logic.

---

# Context Builder

The Context Builder assembles all information required for AI inference.

Potential inputs include:

- Student Profile
- Learning Goal
- Adaptive Profile
- Previous Conversation
- Assessment History
- Uploaded Documents
- Retrieved Knowledge Chunks
- Prompt Template
- Difficulty Level

The Context Builder ensures only relevant information is supplied to the AI Provider.

---

# Prompt Manager

The Prompt Manager is responsible for:

- Selecting prompt templates
- Injecting runtime variables
- Managing prompt versions
- Supporting A/B testing
- Provider-specific prompt adjustments

Prompt templates are stored separately from source code wherever practical.

---

# Provider Abstraction Layer

The AI Platform communicates with providers exclusively through adapters.

```
AI Platform
      │
      ▼
Provider Interface
      │
 ┌────┴────┐
 │         │
Gemini   OpenAI
 │         │
Future Providers...
```

Benefits:

- No vendor lock-in
- Easy provider replacement
- Unified request format
- Simplified testing

---

# RAG Engine

The RAG Engine performs:

1. Receive query
2. Retrieve relevant knowledge chunks
3. Rank retrieved chunks
4. Build contextual prompt
5. Submit to AI Provider
6. Validate citations
7. Return grounded response

The AI Platform never relies solely on model knowledge when relevant uploaded content exists.

---

# Lesson Generator

Responsibilities:

- Generate structured lessons
- Produce learning objectives
- Create examples
- Produce summaries
- Recommend follow-up topics

Output format is standardized for frontend rendering.

---

# Quiz Generator

Responsibilities:

- Generate adaptive questions
- Support multiple question types
- Produce explanations
- Generate hints
- Return evaluation metadata

Question generation considers learner proficiency and retrieved knowledge.

---

# AI Tutor

Responsibilities:

- Maintain conversational continuity
- Explain concepts
- Answer learner questions
- Suggest revisions
- Encourage active learning

The AI Tutor combines conversation history, learner context, and retrieved knowledge to personalize responses.

---

# Adaptive Learning Engine

Responsibilities:

- Estimate mastery
- Recommend difficulty
- Identify knowledge gaps
- Suggest learning paths
- Update adaptive profiles

The engine consumes behavioural and assessment data rather than raw AI outputs alone.

---

# Flashcard Generator

Generates revision flashcards from:

- AI lessons
- Uploaded documents
- Summaries
- Assessment explanations

Flashcards follow a consistent schema for future spaced repetition features.

---

# Summary Generator

Produces concise educational summaries suitable for:

- Revision
- Exam preparation
- Quick review
- Knowledge reinforcement

Summaries should preserve factual accuracy and key concepts.

---

# AI Analytics

The AI Platform records:

- Workflow executed
- Provider used
- Model version
- Token usage
- Latency
- Success/failure
- Retry count
- Cost estimate

These metrics support monitoring and optimization.

---

# Response Validation

Every AI response undergoes validation before being returned.

Validation includes:

- JSON schema compliance
- Required fields
- Length constraints
- Safety checks
- Citation presence (where applicable)

Invalid responses trigger retries or fallback handling.

---

# Retry Strategy

Transient failures should be retried using exponential backoff.

Retry scenarios include:

- Provider timeout
- Rate limiting
- Temporary network failures

Permanent failures should return meaningful error information to the backend.

---

# Error Categories

The AI Platform defines standardized errors:

- ProviderUnavailable
- InvalidPrompt
- ContextOverflow
- RetrievalFailure
- ValidationFailure
- RateLimitExceeded
- ResponseParsingError

These errors are translated into backend-friendly responses.

---

# Logging Strategy

Every AI request logs:

- Request ID
- Workflow
- Provider
- Model
- Tokens In
- Tokens Out
- Latency
- Outcome
- Retry Count

Sensitive learner information must never appear in logs.

---

# Security

The AI Platform:

- Accepts requests only from trusted backend services
- Never exposes provider API keys
- Sanitizes prompts
- Validates retrieved content
- Applies provider rate limits

---

# Risks

- Provider outages
- Hallucinated responses
- Context window limitations
- Rising API costs
- Embedding drift over time

Mitigation strategies are defined in Documents 11, 12, and 15.

---

# Assumptions

- Backend handles authentication.
- MongoDB stores persistent educational data.
- Redis is available for caching and queue coordination.
- Gemini is the initial AI provider.
- Provider abstraction will allow future migrations.

---

# Constraints

- AI workflows must remain stateless.
- Provider APIs may impose token and rate limits.
- Context size is bounded by provider capabilities.
- Responses must conform to predefined schemas.

---

# Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Provider abstraction | Flexibility | Slight implementation complexity |
| Separate AI service | Independent scaling | Additional network hop |
| Prompt templates | Consistency | Requires template management |
| RAG-first responses | Higher factual accuracy | Increased latency |

---

# Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| AI logic inside backend | Tight coupling and poor scalability |
| Direct frontend-to-AI calls | Security risks and no orchestration |
| Provider-specific implementation | Vendor lock-in |
| Local LLMs for MVP | Hardware constraints and deployment complexity |

---

# Future Improvements

- Multi-agent orchestration
- Prompt optimization service
- AI response caching strategies
- Confidence scoring
- Automatic prompt evaluation
- Model routing based on task complexity

---

# Claude Code Implementation Instructions

1. Build the AI Platform as an independent FastAPI application.
2. Use interfaces for all provider integrations.
3. Implement one workflow at a time.
4. Keep prompt templates external to business logic.
5. Validate every AI response before returning it.
6. Record AI analytics for every workflow execution.
7. Preserve provider independence at every layer.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial AI Platform Low-Level Design created. |