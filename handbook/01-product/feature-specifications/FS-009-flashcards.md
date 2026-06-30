# Feature Specification: Flashcard Generation

**Document ID:** FS-009

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** High

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the AI-powered flashcard generation and review feature.

Flashcards provide bite-sized revision material derived from lessons, documents, tutor sessions, and summaries.

---

# Scope

- Flashcard Generation from Documents
- Flashcard Generation from Lessons
- Flashcard Review Interface
- Flashcard Management

---

# Business Rules

1. Flashcards can be generated from: documents, lessons, summaries, and tutor sessions.
2. Flashcard generation is asynchronous.
3. Each flashcard has a front (question/concept) and a back (answer/explanation).
4. Flashcards are owned by the student and cannot be accessed by others.
5. Students can delete individual flashcards.
6. Students can review all flashcards or filter by topic or source.
7. Flashcard review events are tracked as behaviour events.
8. Each flashcard stores the source type and source ID for traceability.

---

# Flashcard Structure

```json
{
  "flashcardId": "string",
  "studentId": "string",
  "front": "What is recursion?",
  "back": "A function that calls itself with a smaller version of the problem until it reaches a base case.",
  "topic": "Recursion",
  "difficulty": "intermediate",
  "source": "document | lesson | tutor | summary",
  "sourceId": "string",
  "createdAt": "ISO8601"
}
```

---

# User Flow: Generate Flashcards from Document

```
Student navigates to a document
  ↓
Clicks "Generate Flashcards"
  ↓
POST /api/v1/documents/:id/flashcards/generate { count: 20 }
  ↓
Returns 202
  ↓
BullMQ worker calls AI Platform /flashcards/generate with document content
  ↓
AI generates front/back pairs
  ↓
Flashcards stored in MongoDB
  ↓
Student accesses via GET /api/v1/documents/:id/flashcards
```

---

# User Flow: Review Flashcards

```
Student navigates to Flashcards section
  ↓
GET /api/v1/flashcards (all flashcards, filterable by topic and source)
  ↓
Frontend displays card (front)
  ↓
Student flips card to see back
  ↓
Behaviour event: flashcard_reviewed recorded
  ↓
Student moves to next card
```

---

# Database Dependencies

- flashcards
- behaviour_events
- documents (for source reference)
- lessons (for source reference)

---

# API Dependencies

- POST /api/v1/documents/:id/flashcards/generate
- GET /api/v1/documents/:id/flashcards
- GET /api/v1/flashcards
- DELETE /api/v1/flashcards/:id
- Internal: POST /ai/v1/flashcards/generate

---

# Acceptance Criteria

- [ ] Student can generate flashcards from a document
- [ ] Student can generate flashcards from a lesson
- [ ] Generation is asynchronous
- [ ] Flashcards have a front and back
- [ ] Student can review all flashcards in a card-flip interface
- [ ] Student can filter flashcards by topic and source
- [ ] Student can delete individual flashcards
- [ ] Flashcard review is tracked as a behaviour event
- [ ] Student cannot access another student's flashcards

---

# Future Enhancements

- Spaced repetition scheduling (SM-2 algorithm)
- Confidence rating per flashcard (easy / hard / again)
- Flashcard decks and organisation
- Export flashcards to Anki format

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
