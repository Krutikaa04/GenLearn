# Feature Specification: Progress Tracking

**Document ID:** FS-010

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** High

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the student progress tracking feature — providing visual and data-driven insight into learning advancement, topic mastery, and study patterns.

---

# Scope

- Overall Progress Dashboard
- Topic-Level Mastery Tracking
- Learning Streak
- Completion Statistics
- Study Time Tracking
- Mastery Trend Visualisation

---

# Business Rules

1. Progress is computed from behaviour events — it is never manually entered.
2. A learning streak increments when the student completes at least one lesson or quiz per day.
3. The streak resets if a day is missed.
4. Progress data is read-only for students.
5. Mastery scores are computed and owned by the adaptive engine.
6. Progress records are updated asynchronously after LessonCompleted and QuizCompleted events.
7. Admins can view any student's progress.
8. Progress is personal — students cannot see each other's progress.

---

# Progress Data Points

| Metric | Source |
|--------|--------|
| Overall mastery score | Adaptive engine |
| Mastery level | Adaptive engine |
| Lessons completed | LessonCompleted events |
| Quizzes completed | QuizCompleted events |
| Average quiz score | Quiz attempts |
| Documents uploaded | DocumentUploaded events |
| Flashcards reviewed | Behaviour events |
| Learning streak | Daily activity tracking |
| Study time | Session duration events |
| Weak topics | Adaptive engine |
| Strong topics | Adaptive engine |
| Mastery trend | Historical adaptive score snapshots |

---

# User Flow: Progress Dashboard

```
Student navigates to Progress
  ↓
GET /api/v1/progress
  ↓
Dashboard renders:
  - Mastery score ring (0–100%)
  - Learning streak counter
  - Lessons / Quizzes completed this week
  - Topic breakdown chart (strong vs weak)
  - Mastery trend line graph (last 30 days)
  - Recent activity feed
```

---

# Database Dependencies

- progress
- behaviour_events
- quiz_attempts
- lessons
- student_profiles (adaptiveScore, masteryLevel)

---

# API Dependencies

- GET /api/v1/progress
- GET /api/v1/progress/summary
- GET /api/v1/analytics/topics
- GET /api/v1/analytics/summary

---

# Acceptance Criteria

- [ ] Student can view overall mastery score and level
- [ ] Mastery trend is displayed as a line graph over time
- [ ] Learning streak is tracked and displayed
- [ ] Topic breakdown shows strong and weak topics
- [ ] Lesson and quiz completion counts are accurate
- [ ] Average quiz score is displayed
- [ ] Study time is tracked
- [ ] Progress data updates after lesson and quiz completion
- [ ] Student cannot see another student's progress

---

# Future Enhancements

- Weekly and monthly progress reports via email
- Goal setting with progress tracking
- Comparison with anonymised peer averages
- Calendar heatmap of study activity
- XP and achievement system

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
