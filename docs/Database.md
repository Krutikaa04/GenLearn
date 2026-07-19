# Database

GenLearn uses **MongoDB** (via Mongoose) as the single datastore for both domain
data and RAG vectors. **Redis** backs BullMQ job queues (no domain data).
Collections below reflect the `@Schema({ collection: … })` declarations in the
backend. Most collections use Mongoose `timestamps` (`createdAt`/`updatedAt`);
user-generated content is **soft-deleted** via a `deletedAt` field.

## Identity & access

### `users`
`userId`, `email`, `passwordHash`, `firstName`, `lastName`, `role`
(`student|teacher|admin`), `status`, `emailVerified`, `emailVerificationToken`,
`passwordResetToken`, `passwordResetExpiry`, `pendingEmail`, `pendingEmailToken`,
`deletedAt`, `failedLoginAttempts`, `lockedUntil`.

### `student_profiles`
`profileId`, `studentId` → `users.userId`, `grade`, `learningGoals`, `interests`,
`preferredDifficulty`, `adaptiveScore`, `masteryLevel`.

## Learning content

### `documents`
`documentId`, `studentId`, `title`, `originalFilename`, `fileType`,
`fileSizeBytes`, `storagePath`, `status`, `processingError`, `pageCount`,
`chunkCount`, `deletedAt`.

### `document_chunks` (RAG vector store)
`chunkId`, `documentId` → `documents.documentId`, `studentId`, `content`,
`embedding` (vector), `pageNumber`, `heading`, `chunkIndex`, `tokenCount`.

### `lessons`
`lessonId`, `studentId`, `topic`, `difficulty`, `documentIds[]`, `status`,
`title`, `summary`, `sections[]` (`heading`, `content`, `keyPoints`,
`codeExample`), `keyTakeaways[]`, `estimatedReadMinutes`, `generationError`,
`deletedAt`.

### `quizzes`
`quizId`, `studentId`, `topic`, `difficulty`, `questionCount`, `documentIds[]`,
`status`, `title`, `questions[]` (`questionId`, `text`, `options`,
`correctIndex`, `explanation`, `topic`, `conceptIds`, `primaryConceptId`,
`cognitiveLevel`, `expectedSeconds`), `answers[]` (`questionId`, `selectedIndex`,
`isCorrect`), `score`, `totalQuestions`, `submittedAt`, `challengeMode`,
`adaptive`, `timeLimitMinutes`, `challengeTopics`, `generationError`,
`deletedAt`.

### `flashcard_sets`
`setId`, `studentId`, `title`, `sourceType`, `sourceId`, `status`,
`cards[]` (`cardId`, `front`, `back`, `hint`, and SM-2 fields `easeFactor`,
`interval`, `repetitions`, `nextReviewAt`), `generationError`, `deletedAt`.

### `conversations`
`conversationId`, `studentId`, `topic`, `documentIds[]`, `messages[]` (`role`,
`content`, `followUpSuggestions`, `createdAt`), `deletedAt`.

## Learner intelligence

### `learner_profiles`
`studentId` (unique), `learningIdentity`, `currentGoal`, `futureObjective`,
`learningStage`, `activeTopics[]`, `velocity`, `consistency`,
`supportDependency`, `preferences`, `trends`, `retentionSummary`,
`interventionEffectiveness`, `reflections[]`.

### `concept_mastery`
`studentId`, `conceptId`, `mastery` (0–100), `confidence` (0–1),
`evidenceCount`, `lastEvidenceAt`, `misconceptionFlags[]`, `trend`
(`new|improving|declining|stable`), `masteryHistory[]`, `lastPracticedAt`,
`interventionCount`, `reviewPriority`, `retentionTrend`.

### `learning_plans` (planner data)
`studentId` (unique), `status` (`awaiting_topic|active`), `currentGoal`,
`objective`, `topic`, `targetConcepts[]`, `recommendedLesson`,
`recommendedQuiz`, `recommendedFlashcards`, `revision` (`revise`, `reinforce`,
`advance`, `prerequisites`), `estimatedMinutes`, `expectedOutcome`,
`completionCriteria`, `nextPlannerDecision`, `reasonCodes[]`, `generatedAt`.

### `pedagogical_decisions` (intervention data)
`decisionId` (unique), `studentId`, `conceptId`, `topic`, `trigger`, `action`,
`difficulty`, `status`, `masteryBefore`, `masteryAfter`, `sourceQuizId`,
`generatedActivityId`, `selectedIntervention`, `blueprint`, `reasonCodes[]`.

### `learner_timeline` (learning history)
`eventId` (unique), `studentId`, `type`, `topic`, `conceptIds[]`, `summary`,
`data`, `occurredAt`.

## Analytics & telemetry

### `student_progress`
`studentId`, `totalQuizzesTaken`, `totalDocumentsUploaded`,
`totalLessonsGenerated`, `totalFlashcardSetsCreated`, `currentStreak`,
`longestStreak`, `lastActiveDate`, `topicMastery[]` (`topic`, `masteryScore`,
`quizzesTaken`, `averageScore`, `lastAttemptAt`), `overallMasteryScore`,
`totalFlashcardsReviewed`, `xpTotal`, `badges[]` (`badgeId`, `earnedAt`).

### `learning_events`
`studentId`, `sessionId`, `quizId`, `type`, `questionId`, `data`, `clientTs`.

### `behavior_features`
`studentId`, `sessionId`, `quizId`, `perQuestion[]` (dwell/idle/answer-change
metrics), `session` (aggregates such as `avgDwellMs`, `totalAnswerChanges`,
`abandoned`, `tabSwitchAnswerRate`).

## Classrooms

### `classrooms`
`classroomId`, `teacherId` → `users.userId`, `name`, `description`, `joinCode`,
`memberIds[]` → `users.userId`, `deletedAt`.

## Relationships (summary)

- A `user` (student) owns `documents`, `lessons`, `quizzes`, `flashcard_sets`,
  `conversations`, one `learner_profile`, one `learning_plan`, and many
  `concept_mastery` / `pedagogical_decisions` / `learner_timeline` records — all
  keyed by `studentId`.
- `document_chunks` belong to a `document`; used by RAG retrieval.
- A `classroom` is owned by a teacher and references student `memberIds`.

## Related documents
- [Backend](Backend.md) · [Adaptive Learning](AdaptiveLearning.md) · [AI Architecture](AIArchitecture.md)
