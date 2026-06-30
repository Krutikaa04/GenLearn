# Document Metadata

**Document ID:** 09E

**Title:** Knowledge API

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
- Document 09B – Identity API
- Document 06A – Backend Low-Level Design
- Document 06B – AI Platform Low-Level Design
- Document 07 – Domain Model
- Document 08 – Database Design

---

# Related Documents

- 09F – AI Platform API
- FS-004 – RAG Feature Specification
- FS-008 – Document Upload Feature Specification
- FS-009 – Flashcards Feature Specification

---

# Purpose

This document defines every HTTP endpoint exposed by the Knowledge module of the GenLearn backend.

The Knowledge module manages document uploads, document processing status, RAG-powered question answering, flashcard generation, and summary generation.

---

# Scope

- Document Upload and Management
- Document Processing Status
- RAG-Powered Question Answering
- Flashcard Generation and Retrieval
- Summary Generation and Retrieval

---

# Base Path

```
/api/v1/documents
/api/v1/flashcards
/api/v1/summaries
```

---

# Authentication

All endpoints require authentication.

```
Authorization: Bearer <access_token>
```

---

# Document Endpoints

---

## POST /api/v1/documents/upload

**Description:** Upload a study document for processing and RAG indexing.

**Access:** Authenticated (Student)

**Request Format:** multipart/form-data

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | The document to upload |
| title | string | No | Custom title (defaults to filename) |
| description | string | No | Optional description |

**Supported File Types:**

- application/pdf
- application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)
- text/plain (.txt)
- text/markdown (.md)

**Maximum File Size:** 20 MB

**Success Response — 202 Accepted:**

```json
{
  "success": true,
  "data": {
    "documentId": "string",
    "title": "string",
    "status": "uploaded",
    "message": "Document uploaded. Processing will begin shortly."
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | INVALID_FILE_TYPE | File type not supported |
| 400 | FILE_TOO_LARGE | File exceeds 20 MB limit |
| 400 | EMPTY_FILE | Uploaded file is empty |
| 429 | DOCUMENT_LIMIT_REACHED | Student has reached document storage limit |

**Side Effects:**

- Stores file in object storage
- Creates document record with status: uploaded
- Publishes DocumentUploaded event
- BullMQ worker begins text extraction and embedding generation

---

## GET /api/v1/documents

**Description:** List all documents uploaded by the authenticated student.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| status | string | — | Filter by status |
| sort | string | createdAt:desc | Sort field and direction |

**Document Statuses:**

- uploaded — File received, processing not started
- processing — Text extraction and chunking in progress
- embedding — Embedding generation in progress
- ready — Document is fully indexed and available for RAG
- failed — Processing failed

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "documentId": "string",
        "title": "string",
        "description": "string",
        "fileType": "pdf",
        "fileSizeBytes": 204800,
        "status": "ready",
        "pageCount": 24,
        "chunkCount": 48,
        "uploadedAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 5,
    "totalPages": 1
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/documents/:documentId

**Description:** Retrieve metadata for a specific document.

**Access:** Authenticated (Student — owner only)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "documentId": "string",
    "title": "string",
    "description": "string",
    "fileType": "pdf",
    "fileSizeBytes": 204800,
    "status": "ready",
    "pageCount": 24,
    "chunkCount": 48,
    "processingError": null,
    "flashcardsGenerated": true,
    "summaryGenerated": true,
    "uploadedAt": "ISO8601",
    "processedAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | DOCUMENT_NOT_FOUND | Document does not exist |
| 403 | FORBIDDEN | Document belongs to another user |

---

## GET /api/v1/documents/:documentId/status

**Description:** Poll for processing status of a document.

**Access:** Authenticated (Student — owner only)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "documentId": "string",
    "status": "processing | embedding | ready | failed",
    "progress": 60,
    "currentStep": "Generating embeddings",
    "error": null
  },
  "timestamp": "ISO8601"
}
```

---

## DELETE /api/v1/documents/:documentId

**Description:** Delete a document and all associated chunks, flashcards, and summaries.

**Access:** Authenticated (Student — owner only)

**Success Response — 204 No Content**

**Side Effects:**

- Soft-deletes document record
- Removes vectors from Atlas Vector Search
- Removes associated chunks
- Removes associated flashcards and summaries

---

## POST /api/v1/documents/:documentId/ask

**Description:** Ask a question using RAG — the AI answers using the content of this document.

**Access:** Authenticated (Student — owner only)

**Request Body:**

```json
{
  "question": "string",
  "conversationId": "string"
}
```

**Validation Rules:**

- question: required, 5–1000 characters
- conversationId: optional, ties this question to an existing tutor conversation

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "answer": "string",
    "sources": [
      {
        "chunkId": "string",
        "text": "string",
        "page": 3,
        "heading": "string",
        "relevanceScore": 0.91
      }
    ],
    "tokensUsed": 450,
    "responseId": "string"
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | DOCUMENT_NOT_FOUND | Document does not exist |
| 403 | FORBIDDEN | Document belongs to another user |
| 400 | DOCUMENT_NOT_READY | Document is still processing |
| 429 | RATE_LIMIT_EXCEEDED | AI rate limit reached |

**Rate Limit:** 30 requests / hour per user.

---

# Flashcard Endpoints

---

## POST /api/v1/documents/:documentId/flashcards/generate

**Description:** Request AI-generated flashcards from a document.

**Access:** Authenticated (Student — owner only)

**Request Body:**

```json
{
  "count": 20,
  "focusTopics": ["string"]
}
```

**Success Response — 202 Accepted:**

```json
{
  "success": true,
  "data": {
    "message": "Flashcard generation started.",
    "estimatedSeconds": 15
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | DOCUMENT_NOT_FOUND | Document does not exist |
| 400 | DOCUMENT_NOT_READY | Document still processing |

---

## GET /api/v1/documents/:documentId/flashcards

**Description:** Retrieve flashcards generated from a specific document.

**Access:** Authenticated (Student — owner only)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "flashcardId": "string",
        "front": "string",
        "back": "string",
        "topic": "string",
        "difficulty": "string"
      }
    ],
    "totalItems": 20,
    "generatedAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/flashcards

**Description:** Retrieve all flashcards for the authenticated student across all sources.

**Access:** Authenticated (Student)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| source | string | — | Filter by source: document, lesson, tutor |
| topic | string | — | Filter by topic |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "flashcardId": "string",
        "front": "string",
        "back": "string",
        "topic": "string",
        "source": "document | lesson | tutor",
        "sourceId": "string",
        "createdAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 120,
    "totalPages": 6
  },
  "timestamp": "ISO8601"
}
```

---

## DELETE /api/v1/flashcards/:flashcardId

**Description:** Delete a specific flashcard.

**Access:** Authenticated (Student — owner only)

**Success Response — 204 No Content**

---

# Summary Endpoints

---

## POST /api/v1/documents/:documentId/summary/generate

**Description:** Request an AI-generated summary of a document.

**Access:** Authenticated (Student — owner only)

**Request Body:**

```json
{
  "type": "short | detailed | revision | exam | cheatsheet"
}
```

**Success Response — 202 Accepted:**

```json
{
  "success": true,
  "data": {
    "message": "Summary generation started.",
    "estimatedSeconds": 20
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/documents/:documentId/summary

**Description:** Retrieve the generated summary for a document.

**Access:** Authenticated (Student — owner only)

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "summaryId": "string",
    "type": "short | detailed | revision | exam | cheatsheet",
    "content": "string",
    "keyPoints": ["string"],
    "importantDefinitions": [
      {
        "term": "string",
        "definition": "string"
      }
    ],
    "generatedAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 404 | SUMMARY_NOT_FOUND | Summary has not been generated yet |

---

# Error Codes Reference

| Error Code | Description |
|-----------|-------------|
| VALIDATION_ERROR | Input validation failed |
| DOCUMENT_NOT_FOUND | Document does not exist |
| FORBIDDEN | Resource belongs to another user |
| DOCUMENT_NOT_READY | Document is still being processed |
| INVALID_FILE_TYPE | Unsupported file format |
| FILE_TOO_LARGE | File exceeds size limit |
| EMPTY_FILE | Uploaded file has no content |
| DOCUMENT_LIMIT_REACHED | Storage limit reached |
| SUMMARY_NOT_FOUND | No summary generated yet |
| RATE_LIMIT_EXCEEDED | AI rate limit reached |

---

# Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /documents/upload | 10 documents / day per user |
| POST /documents/:id/ask | 30 requests / hour per user |
| POST /documents/:id/flashcards/generate | 5 requests / hour per document |
| POST /documents/:id/summary/generate | 5 requests / hour per document |

---

# Claude Code Implementation Instructions

1. File upload uses multipart/form-data — use Multer or equivalent NestJS interceptor.
2. Files are stored in object storage (Cloudflare R2 or S3); MongoDB only stores metadata.
3. Processing is asynchronous — always return 202 for processing requests.
4. The DocumentUploaded event triggers the full pipeline: extraction → chunking → embedding.
5. Ownership checks are mandatory on every document endpoint.
6. RAG queries (/documents/:id/ask) are forwarded to the AI Platform which handles context assembly and vector retrieval.
7. Vector deletion must be handled when a document is deleted.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Knowledge API contract created. |
