# Release Notes

GenLearn is feature-complete across its planned sprints. This document summarizes
the delivered platform. It reflects the current implementation only — no
roadmap or unfinished items.

## Platform summary

A three-service AI learning platform: a React SPA, a NestJS backend
(system of record + orchestrator), and a FastAPI AI service wrapping Google
Gemini. Data is stored in MongoDB (including RAG vectors); Redis backs BullMQ job
queues. See [Architecture](Architecture.md).

## Core learning features

- **Document ingestion & RAG** — upload PDF/DOCX/TXT/MD; documents are extracted,
  chunked, embedded, and made searchable via MongoDB vector search.
- **AI lesson generation** — structured lessons with sections, key points, code
  examples, and takeaways.
- **Quiz generation & grading** — multiple-choice quizzes with explanations,
  server-side scoring, review, and a timed challenge mode.
- **Flashcards** — generated sets with SM-2 spaced-repetition scheduling and a
  "due" review flow.
- **AI tutor & conversations** — document-grounded conversational tutoring with
  persistent history.
- **Progress & gamification** — streaks, XP, badges, and topic mastery.
- **Classrooms** — teacher-created classrooms, student join codes, class
  dashboards, and per-student reports.
- **Admin** — platform statistics and user management.

## Intelligence systems

- **Adaptive Learning** — every quiz submission updates the learner model and
  regenerates the next-session plan. See [Adaptive Learning](AdaptiveLearning.md).
- **Cognitive Engine** — a uniform backend API to all generative capabilities
  (quiz, lesson, flashcard, tutor, RAG, study plan, document processing),
  decoupled from the AI service transport via the AI Gateway.
- **Persistent Learner Intelligence** — durable per-learner profiles, per-concept
  mastery/confidence, misconception flags, trends, retention, and a learning
  timeline (`learner_profiles`, `concept_mastery`, `learner_timeline`).
- **Autonomous Learning Planner** — maintains a per-learner plan (objective,
  target concepts, recommended lesson/quiz/flashcards, reason codes) surfaced as
  "Continue Learning".
- **Explainable Intelligence** — recommendations carry a rationale, supporting
  evidence, expected outcome, and confidence level.
- **Learning Prediction (LIPS)** — concept progress, revision forecasts,
  retention/mastery predictions, an AI-coach summary, and weekly summaries.

## Engineering

- Versioned REST API under `/api/v1` with uniform response/error envelopes,
  global JWT + role guards, validation, rate limiting, and Swagger (non-prod).
- Asynchronous processing via BullMQ workers with status-polling endpoints.
- Adaptive/AI features gated behind feature flags (default off) for safe rollout.
- Deployable on Vercel (frontend) + Render (backend and AI service) with MongoDB
  Atlas and managed Redis; `render.yaml` blueprint and Docker Compose for local.
- Test suites across all three services (Jest, Vitest, pytest).

## Related documents
- [README](../README.md) · [Architecture](Architecture.md) · [Adaptive Learning](AdaptiveLearning.md) · [API](API.md)
