# Feature Specification: AI Tutor

**Document ID:** FS-003

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** Critical

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the AI Tutor feature — a conversational, pedagogically structured AI assistant that teaches students using their uploaded material and adaptive learning profile.

The AI Tutor is one of the primary differentiators of GenLearn. It must feel like a patient, knowledgeable teacher — not a search engine or chatbot.

---

# Scope

- Conversational AI Tutoring
- Context-Aware Responses
- RAG-Powered Answers from Uploaded Documents
- Conversation Persistence
- Adaptive Tutor Behaviour
- Source Citation
- Suggested Follow-up Questions

---

# Business Rules

1. Every conversation is persisted — students can resume previous sessions.
2. The AI Tutor always responds in a structured educational format.
3. When the student's documents are relevant, the tutor grounds the response in retrieved content.
4. The tutor never simply answers — it teaches.
5. The tutor adapts its explanation complexity to the student's mastery level.
6. The tutor suggests follow-up questions after every response.
7. When answering from documents, sources are cited.
8. Conversation history is injected into the prompt for continuity.
9. Each student may have multiple conversations (by topic or document set).
10. Tutor usage is tracked as a behaviour event for the adaptive engine.

---

# Teaching Philosophy

The AI Tutor behaves like an experienced educator who:

- Builds on prior knowledge
- Uses real-world analogies
- Checks understanding with practice questions
- Never dumps raw information
- Escalates explanation depth gradually
- Encourages the student

---

# Tutor Response Structure

Every tutor response follows this structure:

```
1. Acknowledge the question
2. Concept introduction
3. Clear explanation
4. Concrete example
5. Real-world analogy
6. Key points (bulleted)
7. Common mistakes to avoid
8. Practice question
9. Suggested next topics
```

---

# User Flow

```
Student opens Tutor
  ↓
Selects or creates a conversation
  ↓
Optionally attaches documents
  ↓
Types a message
  ↓
POST /api/v1/ai/conversations/:id/messages
  ↓
Backend fetches conversation history
  ↓
Backend calls AI Platform /tutor/chat
  ↓
AI Platform: assembles context (history + profile + RAG chunks)
  ↓
AI Platform: generates structured response
  ↓
Backend stores message pair
  ↓
Frontend renders: response + sources + follow-up suggestions
  ↓
Behaviour event recorded: tutor_message_sent
```

---

# Database Dependencies

- ai_conversations
- ai_messages
- document_chunks (for RAG source references)
- behaviour_events

---

# API Dependencies

- POST /api/v1/ai/conversations
- GET /api/v1/ai/conversations
- GET /api/v1/ai/conversations/:id
- DELETE /api/v1/ai/conversations/:id
- POST /api/v1/ai/conversations/:id/messages
- GET /api/v1/ai/conversations/:id/messages

---

# Frontend Requirements

- Typing indicator while AI generates response
- Source cards showing cited document chunks
- Suggested follow-up questions as clickable chips
- Markdown rendering for AI responses
- Code block rendering
- Empty state with suggested starter questions

---

# Acceptance Criteria

- [ ] Student can start a new conversation with an optional topic
- [ ] Student can attach documents to a conversation
- [ ] AI responds in structured teaching format
- [ ] AI responses are grounded in attached documents when available
- [ ] Sources are cited when RAG is used
- [ ] Conversation history persists across sessions
- [ ] Tutor remembers earlier messages within a conversation
- [ ] Suggested follow-up questions are returned
- [ ] Behaviour events are recorded for tutor usage
- [ ] Token usage is tracked per message

---

# Future Enhancements

- Streaming responses (token-by-token)
- Voice input and text-to-speech
- Conversation summarisation for long sessions
- Tutor tone settings

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
