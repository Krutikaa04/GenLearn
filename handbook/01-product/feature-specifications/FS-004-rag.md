# Feature Specification: Retrieval Augmented Generation (RAG)

**Document ID:** FS-004

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** Critical

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the complete RAG pipeline — from document upload through to AI-powered answers grounded in student-uploaded content.

RAG is one of the strongest technical differentiators of GenLearn. It ensures the AI answers from the student's actual study material, not from general model knowledge.

---

# Scope

- Document Upload and Storage
- Text Extraction
- Document Chunking
- Embedding Generation
- Vector Storage
- Semantic Search
- Context Assembly
- Grounded Response Generation
- Source Attribution

---

# Business Rules

1. Document processing is always asynchronous — uploads never block the user.
2. The AI prefers retrieved document content over model memory when relevant chunks exist.
3. Every RAG response must cite its sources with page number and heading.
4. A document must reach status: ready before it can be queried.
5. Embeddings are generated via BullMQ after text extraction completes.
6. Chunks preserve context — paragraphs and sentences are not split arbitrarily.
7. Students may only query their own documents.
8. Vector deletion occurs when a document is deleted.
9. Chunks below relevance threshold are excluded from context.
10. If no relevant chunks are found, the AI answers from model knowledge and states so.

---

# Full Pipeline

```
Student uploads document
  ↓
File stored in object storage
  ↓
Document record created (status: uploaded)
  ↓
DocumentUploaded event → BullMQ
  ↓
Worker: Text Extraction (PDF/DOCX/TXT/MD)
  ↓
Document status: processing
  ↓
Worker: Chunking (~500 tokens, ~50 token overlap)
  ↓
Worker: Embedding Generation (Gemini text-embedding-004)
  ↓
Document status: embedding
  ↓
Vectors stored in Atlas Vector Search
  ↓
Document status: ready
  ↓
Student asks a question
  ↓
Query embedding generated
  ↓
Cosine similarity search: top-5 chunks retrieved
  ↓
Context assembled: question + student profile + chunks
  ↓
Grounded prompt sent to Gemini
  ↓
Response with answer + sources returned
```

---

# Chunking Strategy

- Target chunk size: ~500 tokens
- Chunk overlap: ~50 tokens
- Split preference: paragraph → sentence → word
- Heading context preserved as metadata

---

# Embedding Model

Current: `text-embedding-004` (Gemini)

Dimensions: 768

The embedding model is abstracted — switching providers requires only config change.

---

# Supported File Formats

| Format | Library |
|--------|---------|
| PDF | PyMuPDF / pdfplumber |
| DOCX | python-docx |
| TXT | Native |
| MD | Native |

---

# Error Handling

| Failure | Action |
|---------|--------|
| Extraction fails | status → failed, error stored |
| Embedding API fails | Retry 3× with exponential backoff, then fail |
| No relevant chunks | AI answers from model knowledge, no sources cited |

---

# Database Dependencies

- documents
- document_chunks (with vector index)
- behaviour_events

---

# API Dependencies

- POST /api/v1/documents/upload
- GET /api/v1/documents/:id/status
- POST /api/v1/documents/:id/ask
- DELETE /api/v1/documents/:id
- Internal: POST /ai/v1/documents/process
- Internal: POST /ai/v1/rag/query

---

# Acceptance Criteria

- [ ] Student can upload PDF, DOCX, TXT, and MD files
- [ ] Files over 20 MB are rejected
- [ ] Unsupported file types are rejected
- [ ] Document status progresses: uploaded → processing → embedding → ready
- [ ] Student can poll document status
- [ ] Student can ask a question once the document is ready
- [ ] AI response is grounded in document content
- [ ] Sources are cited with page number and heading
- [ ] Deleting a document removes its vectors and chunks
- [ ] Student cannot query another student's documents

---

# Future Enhancements

- Cross-document querying
- Pinecone / Qdrant as alternative vector stores
- OCR support for scanned PDFs
- PowerPoint support
- Auto-summarise on upload

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
