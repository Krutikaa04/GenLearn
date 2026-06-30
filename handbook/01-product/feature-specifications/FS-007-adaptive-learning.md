# Feature Specification: Adaptive Learning Engine

**Document ID:** FS-007

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** Critical

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the Adaptive Learning Engine — the intelligence layer that personalises every student's learning experience based on their behaviour, performance, and engagement patterns.

The adaptive engine is one of the primary research contributions of GenLearn and a core differentiator from traditional LMS platforms.

---

# Scope

- Behaviour Signal Collection
- Mastery Score Calculation
- Adaptive Profile Maintenance
- Difficulty Recommendation
- Weak Topic Identification
- Strong Topic Identification
- Learning Path Adjustment

---

# Business Rules

1. The adaptive engine is event-driven — it does not run in real time; it processes behaviour events asynchronously.
2. Every significant learning action generates a behaviour event consumed by the adaptive engine.
3. Mastery scores range from 0.0 to 1.0.
4. Mastery levels: beginner (0.0–0.39), intermediate (0.40–0.74), advanced (0.75–1.0).
5. A topic is classified as weak if its mastery score falls below 0.5.
6. A topic is classified as strong if its mastery score exceeds 0.75.
7. The adaptive engine influences lesson difficulty, quiz difficulty, and recommendations.
8. Adaptive scores decay slightly if a topic has not been studied recently (future enhancement).
9. The adaptive profile is never manually edited by the student.
10. Admins can view adaptive profiles but cannot edit them.

---

# Behaviour Signals

The engine consumes these signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Quiz score | High | Primary mastery indicator |
| Quiz completion time | Medium | Fast + correct = mastery, fast + wrong = guessing |
| Hint usage | Medium | More hints = lower mastery |
| Lesson completion | Low | Indicates topic engagement |
| Tutor session on topic | Medium | Indicates difficulty understanding |
| Revision frequency | Medium | High revision = topic is difficult |
| Attempt count | Medium | Multiple attempts needed = lower mastery |

---

# Mastery Score Update Algorithm

When a QuizCompleted event is received:

```
1. Retrieve current mastery score for the topic
2. Calculate performance score:
   performanceScore = (correctAnswers / totalQuestions) * 100
   timeBonus = if avgTimePerQuestion < expectedTime then +0.05 else 0
   hintPenalty = hintCount * 0.02
   adjustedScore = performanceScore + timeBonus - hintPenalty

3. Update mastery score using weighted average:
   newMastery = (currentMastery * 0.6) + (adjustedScore/100 * 0.4)

4. Clamp to [0.0, 1.0]
5. Update mastery level (beginner / intermediate / advanced)
6. Update recommended difficulty for next quiz on this topic
7. Update weak/strong topic lists
8. Store updated adaptive profile
```

---

# Adaptive Profile Structure

```json
{
  "studentId": "string",
  "overallMasteryScore": 0.65,
  "masteryLevel": "intermediate",
  "recommendedDifficulty": "intermediate",
  "topicScores": [
    {
      "topic": "string",
      "masteryScore": 0.80,
      "strength": "strong",
      "lastStudied": "ISO8601",
      "quizAttempts": 3,
      "avgQuizScore": 82
    }
  ],
  "weakTopics": ["string"],
  "strongTopics": ["string"],
  "updatedAt": "ISO8601"
}
```

---

# User Flow: Adaptive Update

```
Student submits quiz
  ↓
QuizCompleted event published
  ↓
BullMQ worker receives event
  ↓
Worker sends event data to AI Platform /adaptive/score
  ↓
AI Platform calculates new mastery score
  ↓
Worker updates student_profiles.adaptiveScore
  ↓
Worker updates progress.weakTopics and strongTopics
  ↓
Worker refreshes recommendation cache in Redis
  ↓
Next lesson/quiz request uses updated adaptive profile
```

---

# Difficulty Mapping

| Mastery Score | Recommended Difficulty |
|---------------|----------------------|
| 0.0 – 0.39 | beginner |
| 0.40 – 0.74 | intermediate |
| 0.75 – 1.0 | advanced |

---

# Database Dependencies

- student_profiles (adaptiveScore, masteryLevel)
- progress (weakTopics, strongTopics)
- behaviour_events
- quiz_attempts

---

# API Dependencies

No direct student-facing endpoints for the adaptive engine itself.

The engine is invoked by:

- BullMQ workers consuming QuizCompleted events
- BullMQ workers consuming LessonCompleted events

Results surface via:

- GET /api/v1/progress
- GET /api/v1/recommendations
- GET /api/v1/auth/me (adaptiveScore, masteryLevel)

---

# Acceptance Criteria

- [ ] Quiz completion triggers an adaptive profile update
- [ ] Lesson completion triggers an adaptive profile update
- [ ] Mastery score is updated after each quiz based on score, time, and hint usage
- [ ] Topics with score below 0.5 appear in weakTopics
- [ ] Topics with score above 0.75 appear in strongTopics
- [ ] Recommended difficulty for next lesson/quiz reflects current mastery
- [ ] Adaptive update is asynchronous — does not block quiz submission response
- [ ] Student cannot manually edit their adaptive profile

---

# Future Enhancements

- Mastery score decay for inactive topics
- Spaced repetition integration
- Learning velocity tracking (rate of improvement)
- Predictive difficulty adjustment using ML model
- Multi-dimensional mastery (recall, application, analysis)

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
