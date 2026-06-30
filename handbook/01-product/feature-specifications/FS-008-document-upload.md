# Feature Specification: Document Upload and Management

**Document ID:** FS-008

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** Critical

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the document upload, storage, and management feature.

Documents uploaded by students become the foundation for RAG-powered AI tutoring, flashcard generation, and personalised summaries.

---

# Scope

- Document Upload
- File Validation
- Object Storage
- Processing Pipeline Trigger
- Document Listing and Retrieval
- Processing Status Polling
- Document Deletion

---

# Business Rules

1. Students can upload PDF, DOCX, TXT, and Markdown files.
2. Maximum file size is 20 MB per document.
3. Maximum documents per student: 50 (MVP limit).
4. Document processing is asynchronous — the upload response is immediate.
5. A document in status: processing or embedding cannot be queried via RAG.
6. A document in status: failed can be re-uploaded but cannot be queried.
7. Deleting a document removes all associated chunks, vectors, flashcards, and summaries.
8. Students can only manage their own documents.
9. Admins can view all documents but cannot access their content.
10. The actual file lives in object storage; MongoDB stores only metadata.

---

# Document Processing States

| Status | Description |
|--------|-------------|
| uploaded | File stored, processing not yet started |
| processing | Text extraction and chunking in progress |
| embedding | Embedding generation in progress |
| ready | Fully indexed and available for RAG queries |
| failed | Processing failed — error stored |

---

# User Flow: Document Upload

```
Student clicks "Upload Document"
  ↓
Selects file from file picker
  ↓
Frontend validates: file type and size
  ↓
POST /api/v1/documents/upload (multipart/form-data)
  ↓
Backend validates file type and size
  ↓
File stored in object storage
  ↓
Document record created (status: uploaded)
  ↓
DocumentUploaded event published
  ↓
Returns 202 with documentId
  ↓
Frontend polls GET /api/v1/documents/:id/status
  ↓
UI shows progress indicator
  ↓
When status: ready — document available for AI queries
```

---

# File Storage Strategy

Files are stored in object storage (Cloudflare R2 or AWS S3).

Storage path format:
```
/{studentId}/{documentId}/{filename}
```

MongoDB stores:
- documentId
- studentId
- title
- originalFilename
- fileType
- fileSizeBytes
- storagePath
- status
- processingError
- pageCount
- chunkCount
- timestamps

---

# User Flow: Document Deletion

```
Student clicks "Delete"
  ↓
Frontend confirms deletion
  ↓
DELETE /api/v1/documents/:id
  ↓
Backend soft-deletes document record
  ↓
Backend queues: delete vectors from Atlas Vector Search
  ↓
Backend queues: delete associated chunks
  ↓
Backend queues: delete associated flashcards and summaries
  ↓
File removed from object storage
  ↓
Returns 204
```

---

# Database Dependencies

- documents
- document_chunks
- flashcards (associated)
- summaries (associated)

---

# API Dependencies

- POST /api/v1/documents/upload
- GET /api/v1/documents
- GET /api/v1/documents/:id
- GET /api/v1/documents/:id/status
- DELETE /api/v1/documents/:id

---

# Acceptance Criteria

- [ ] Student can upload PDF, DOCX, TXT, and MD files
- [ ] Files over 20 MB are rejected with a clear error
- [ ] Unsupported file types are rejected
- [ ] Upload returns 202 immediately
- [ ] Document status progresses through all stages
- [ ] Student can poll for processing status
- [ ] Student can list all their documents
- [ ] Student can delete a document
- [ ] Deletion removes all associated vectors, chunks, flashcards, and summaries
- [ ] Student cannot access another student's documents
- [ ] Storage limit of 50 documents per student is enforced

---

# Future Enhancements

- Drag-and-drop upload with progress bar
- Bulk upload
- Re-process failed documents
- PowerPoint (.pptx) support
- OCR for scanned PDFs
- Document preview in browser

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
