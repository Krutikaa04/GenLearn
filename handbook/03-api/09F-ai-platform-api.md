# Document Metadata

**Document ID:** 09F

**Title:** AI Platform API

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** API Contract

**Priority:** Critical

---

# Dependencies

- Document 09A – API Design Principles
- Document 06B – AI Platform Low-Level Design
- Document 07 – Domain Model
- Document 08 – Database Design

---

# Related Documents

- 09C – Learning API
- 09D – Assessment API
- 09E – Knowledge API
- FS-003 – AI Tutor Feature Specification
- FS-004 – RAG Feature Specification
- FS-005 – Lesson Generation Feature Specification

---

# Purpose

This document defines the internal HTTP API exposed by the GenLearn AI Platform (FastAPI service).

This API is **internal only**. It is called exclusively by the NestJS backend. The React frontend never calls this API directly.

---

# Important

This is a **service-to-service API**.

Authentication between the backend and AI Platform is handled via a shared internal API key passed as a header.

```
X-Internal-Key: <internal_api_key>
```

All requests originate from the NestJS backend.

---

# Base URL

Development

```
http://ai-service:8000/api/v1
```

Production

```
http://ai-service:8000/api/v1
```

---

# Scope

- AI Tutor (Chat)
- Lesson Generation
- Quiz Generation
- Quiz Evaluation
- Flashcard Generation
- Summary Generation
- Recommendation Generation
- Adaptive Score Update
- RAG Query
- Document Processing
- Health Check

---

# Standard Request Context

Every AI request must include a context object providing the AI Platform with everything it needs for personalized generation.

```json
{
  "studentContext": {
    "studentId": "string",
    "masteryLevel": "beginner | intermediate | advanced",
    "adaptiveScore": 0.65,
    "weakTopics": ["string"],
    "strongTopics": ["string"],
    "learningGoals": ["string"],
    "preferredDifficulty": "string"
  }
}
```

---

# Endpoints

---

## POST /api/v1/tutor/chat

**Description:** Send a message to the AI Tutor and receive a pedagogically structured response.

**Request Body:**

```json
{
  "conversationId": "string",
  "message": "string",
  "history": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ],
  "topic": "string",
  "ragEnabled": true,
  "documentIds": ["string"],
  "studentContext": {}
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "response": "string",
    "sources": [
      {
        "chunkId": "string",
        "text": "string",
        "page": 3,
        "relevanceScore": 0.91
      }
    ],
    "suggestedFollowUps": ["string"],
    "tokensUsed": {
      "input": 500,
      "output": 300,
      "total": 800
    },
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "latencyMs": 1200
  },
  "timestamp": "ISO8601"
}
```

**Behaviour:**

- The tutor must respond in structured teaching format: concept → explanation → example → analogy → key points → next step.
- When documentIds are provided and ragEnabled is true, the tutor retrieves relevant chunks and grounds the response.
- Conversation history is injected into the prompt for context continuity.

---

## POST /api/v1/lessons/generate

**Description:** Generate a complete AI lesson.

**Request Body:**

```json
{
  "topic": "string",
  "difficulty": "beginner | intermediate | advanced",
  "learningGoal": "string",
  "documentIds": ["string"],
  "studentContext": {}
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "lesson": {
      "topic": "string",
      "difficulty": "string",
      "learningObjectives": ["string"],
      "explanation": "string",
      "examples": ["string"],
      "analogies": ["string"],
      "keyPoints": ["string"],
      "summary": "string",
      "revisionQuestions": ["string"],
      "codeSnippets": []
    },
    "ragSources": [],
    "tokensUsed": {},
    "provider": "gemini",
    "latencyMs": 0
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/quizzes/generate

**Description:** Generate a set of quiz questions.

**Request Body:**

```json
{
  "topic": "string",
  "difficulty": "beginner | intermediate | advanced",
  "questionCount": 10,
  "questionTypes": ["mcq", "true_false", "fill_blank", "short_answer"],
  "documentIds": ["string"],
  "lessonContent": "string",
  "studentContext": {}
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "questionId": "string",
        "type": "mcq",
        "text": "string",
        "options": ["string"],
        "correctAnswer": "string",
        "explanation": "string",
        "hint": "string",
        "difficulty": "string",
        "points": 1
      }
    ],
    "tokensUsed": {},
    "provider": "gemini",
    "latencyMs": 0
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/quizzes/evaluate

**Description:** Evaluate submitted quiz answers and produce per-question results and overall feedback.

**Request Body:**

```json
{
  "questions": [
    {
      "questionId": "string",
      "type": "string",
      "text": "string",
      "correctAnswer": "string"
    }
  ],
  "answers": [
    {
      "questionId": "string",
      "answer": "string",
      "timeSpentSeconds": 30,
      "hintUsed": false
    }
  ],
  "studentContext": {}
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "questionId": "string",
        "correct": true,
        "yourAnswer": "string",
        "correctAnswer": "string",
        "explanation": "string",
        "pointsEarned": 1
      }
    ],
    "overallFeedback": "string",
    "nextRecommendation": "string",
    "tokensUsed": {}
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/flashcards/generate

**Description:** Generate flashcards from content.

**Request Body:**

```json
{
  "sourceType": "document | lesson | summary",
  "sourceId": "string",
  "content": "string",
  "count": 20,
  "focusTopics": ["string"],
  "studentContext": {}
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "front": "string",
        "back": "string",
        "topic": "string",
        "difficulty": "string"
      }
    ],
    "tokensUsed": {}
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/summaries/generate

**Description:** Generate a structured summary of content.

**Request Body:**

```json
{
  "content": "string",
  "type": "short | detailed | revision | exam | cheatsheet",
  "topic": "string",
  "studentContext": {}
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "summary": "string",
    "keyPoints": ["string"],
    "importantDefinitions": [
      {
        "term": "string",
        "definition": "string"
      }
    ],
    "tokensUsed": {}
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/recommendations/generate

**Description:** Generate personalized learning recommendations.

**Request Body:**

```json
{
  "studentContext": {},
  "recentActivity": [
    {
      "type": "lesson | quiz | document",
      "topic": "string",
      "score": 0,
      "completedAt": "ISO8601"
    }
  ],
  "availableTopics": ["string"]
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "lesson | quiz | revision | document",
        "topic": "string",
        "reason": "string",
        "priority": "high | medium | low",
        "difficulty": "string"
      }
    ],
    "tokensUsed": {}
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/adaptive/score

**Description:** Calculate an updated adaptive mastery score based on recent behaviour events.

**Request Body:**

```json
{
  "studentId": "string",
  "currentScore": 0.65,
  "events": [
    {
      "type": "quiz_completed | lesson_completed | hint_used | tutor_session",
      "topic": "string",
      "score": 80,
      "timeSpentSeconds": 480,
      "hintsUsed": 1,
      "attempts": 1,
      "timestamp": "ISO8601"
    }
  ]
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "newScore": 0.72,
    "masteryLevel": "intermediate",
    "recommendedDifficulty": "intermediate",
    "weakTopics": ["string"],
    "strongTopics": ["string"],
    "scoreDelta": 0.07
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/rag/query

**Description:** Perform a semantic search and return retrieved document chunks.

**Request Body:**

```json
{
  "query": "string",
  "documentIds": ["string"],
  "studentId": "string",
  "topK": 5
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "chunks": [
      {
        "chunkId": "string",
        "documentId": "string",
        "text": "string",
        "page": 3,
        "heading": "string",
        "relevanceScore": 0.91
      }
    ],
    "queryEmbeddingMs": 80
  },
  "timestamp": "ISO8601"
}
```

---

## POST /api/v1/documents/process

**Description:** Process a newly uploaded document — extract text, chunk it, and generate embeddings.

**Request Body:**

```json
{
  "documentId": "string",
  "studentId": "string",
  "storagePath": "string",
  "fileType": "pdf | docx | txt | md"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "documentId": "string",
    "pageCount": 24,
    "chunkCount": 48,
    "embeddingsGenerated": 48,
    "processingMs": 4500
  },
  "timestamp": "ISO8601"
}
```

**Error Response — 422:**

```json
{
  "success": false,
  "error": {
    "code": "EXTRACTION_FAILED",
    "message": "Text could not be extracted from the document."
  }
}
```

---

## GET /health

**Description:** Health check for the AI Platform service.

**Access:** Internal

**Success Response — 200 OK:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "ragEnabled": true,
  "vectorStore": "atlas",
  "uptime": 3600
}
```

---

# Provider Abstraction

The AI Platform must never couple response format to a specific provider.

All generation calls go through a Provider Interface:

```
Request
  ↓
Workflow Router
  ↓
Prompt Manager
  ↓
Context Builder
  ↓
Provider Interface
  ↓
Gemini Adapter (current)
  ↓
Response Validator
  ↓
Response
```

Switching providers must require zero changes to API contracts.

---

# Response Validation

Every AI response is validated before being returned.

Validation checks:

- Required fields present
- Content is not empty
- JSON structure matches expected schema
- Content passes safety filter
- Length is within acceptable range

On validation failure, the request is retried once.

On second failure, a structured error is returned.

---

# Token Tracking

Every response must include token usage:

```json
{
  "tokensUsed": {
    "input": 500,
    "output": 300,
    "total": 800,
    "estimatedCostUSD": 0.0001
  }
}
```

---

# Error Codes

| Error Code | Description |
|-----------|-------------|
| PROVIDER_ERROR | AI provider returned an error |
| VALIDATION_FAILED | AI response failed validation |
| EXTRACTION_FAILED | Document text extraction failed |
| EMBEDDING_FAILED | Embedding generation failed |
| CONTEXT_TOO_LARGE | Context exceeds model token limit |
| RATE_LIMIT_EXCEEDED | Provider rate limit reached |
| TIMEOUT | AI request timed out |

---

# Claude Code Implementation Instructions

1. All endpoints in this service are internal — apply X-Internal-Key validation on every request.
2. Never call the Gemini API directly from business logic — always route through the Provider Interface.
3. All AI responses must pass through the Response Validator before being returned.
4. Token usage must be recorded and returned on every response.
5. The Prompt Manager injects all context — never hardcode prompts inside endpoint handlers.
6. Document processing is the heaviest operation — handle failures gracefully and update document status in the callback.
7. The adaptive score calculation is rule-based with AI assistance — define clear scoring rules before implementation.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial AI Platform API contract created. |
