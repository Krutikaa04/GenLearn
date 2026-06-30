# Feature Specification: Quiz Generation

**Document ID:** FS-006

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** Critical

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the AI-powered quiz generation and assessment feature.

Quizzes test student understanding, feed the adaptive learning engine, and provide detailed per-question analysis with explanations.

---

# Scope

- Quiz Generation
- Adaptive Difficulty
- Quiz Submission and Evaluation
- Per-Question Results with Explanations
- Adaptive Profile Update on Completion
- Attempt History

---

# Business Rules

1. Quiz generation is asynchronous.
2. Difficulty defaults to the student's adaptive level.
3. Questions can come from multiple types: MCQ, True/False, Fill in the Blank, Short Answer.
4. Correct answers are never exposed until after submission.
5. Each submission is an attempt — a student may attempt the same quiz multiple times.
6. Quiz evaluation is performed by the AI Platform, not the backend.
7. Every quiz submission triggers an adaptive profile update via BullMQ.
8. Hint usage is recorded and factors into the adaptive engine.
9. Time per question is tracked and used as a performance signal.
10. Students are rate-limited to 20 quiz generations per hour.

---

# Question Types

| Type | Description |
|------|-------------|
| mcq | Multiple choice — one correct answer from 4 options |
| true_false | True or False |
| fill_blank | Fill in the blank — student types the answer |
| short_answer | Short written answer — evaluated by AI |

---

# User Flow: Quiz Generation

```
Student clicks "Generate Quiz"
  ↓
Enters topic + optional difficulty, question count, question types
  ↓
Optionally links to a lesson or documents
  ↓
POST /api/v1/quizzes/generate
  ↓
Backend creates quiz record (status: generating)
  ↓
Returns 202 with quizId
  ↓
BullMQ worker calls AI Platform /quizzes/generate
  ↓
Quiz questions generated with correct answers (stored server-side)
  ↓
Status updated to: ready
  ↓
Frontend polls and then loads quiz screen
```

---

# User Flow: Quiz Attempt

```
Student opens quiz
  ↓
GET /api/v1/quizzes/:id (questions returned, no correct answers)
  ↓
Student answers each question
  ↓
Student requests hint → behaviour event recorded
  ↓
Student submits
  ↓
POST /api/v1/quizzes/:id/attempts { answers, totalTimeSeconds }
  ↓
Backend calls AI Platform /quizzes/evaluate
  ↓
Per-question results returned with explanations
  ↓
Attempt record created
  ↓
QuizCompleted event published
  ↓
BullMQ updates adaptive profile
  ↓
Frontend shows results: score, per-question breakdown, feedback
```

---

# Evaluation Logic

The AI Platform evaluates each answer:

- MCQ / True-False: exact match comparison
- Fill-in-blank: AI semantic matching (minor spelling variations allowed)
- Short answer: AI semantic scoring with explanation

The AI also generates:

- Overall feedback paragraph
- Per-question explanation of why the answer is correct or incorrect
- Next topic recommendation based on performance

---

# Adaptive Signals from Quiz

The adaptive engine receives:

- Overall score
- Per-question correctness
- Time spent per question
- Hints used per question
- Attempts count
- Question difficulty

These signals update:

- Mastery score per topic
- Overall adaptive score
- Recommended difficulty for next quiz

---

# Database Dependencies

- quizzes
- quiz_attempts
- behaviour_events
- progress

---

# API Dependencies

- POST /api/v1/quizzes/generate
- GET /api/v1/quizzes
- GET /api/v1/quizzes/:id
- POST /api/v1/quizzes/:id/attempts
- GET /api/v1/quizzes/:id/attempts
- GET /api/v1/attempts/:id
- Internal: POST /ai/v1/quizzes/generate
- Internal: POST /ai/v1/quizzes/evaluate

---

# Acceptance Criteria

- [ ] Student can generate a quiz on any topic
- [ ] Generation returns 202 immediately
- [ ] Quiz status progresses: generating → ready
- [ ] Questions are returned without correct answers
- [ ] Student can submit answers
- [ ] Results include per-question correctness and explanations
- [ ] Score and percentage are calculated correctly
- [ ] Adaptive profile updates after each submission
- [ ] Hint usage is recorded
- [ ] Time per question is tracked
- [ ] Student can view attempt history for any quiz
- [ ] Student cannot access another student's quizzes

---

# Future Enhancements

- Timed quiz mode
- Scenario-based questions
- Coding challenges
- Group quizzes
- Question bank reuse

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
