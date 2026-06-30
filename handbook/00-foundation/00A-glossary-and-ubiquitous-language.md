# Document Metadata

**Document ID:** 00A

**Title:** Glossary & Ubiquitous Language

**Version:** 1.0.0

**Status:** DRAFT

**Owner:** Rishi Mahajan

**Category:** Foundation

**Priority:** Critical

**Dependencies:**

- Document 00 – Project Constitution

**Related Documents:**

- Document 01 – Project Vision & Scope
- Document 02 – Product Requirements Document
- Document 05 – High-Level Architecture
- Document 06 – Low-Level Design
- Document 07 – Domain Model

---

# Purpose

The purpose of this document is to establish the official vocabulary used throughout the GenLearn platform.

Every engineer, designer, researcher, tester, technical writer, and AI coding assistant must use the terminology defined in this document when discussing, designing, implementing, or documenting the platform.

This glossary follows the principles of **Domain-Driven Design (DDD)** by defining a **Ubiquitous Language** that removes ambiguity and ensures consistency across the entire project.

If conflicting terminology appears in any future document, the definitions contained within this glossary take precedence.

---

# Scope

This document defines the official terminology for:

- Learner Domain
- Identity Domain
- Assessment Domain
- Knowledge Domain
- Artificial Intelligence Domain
- Analytics Domain
- Platform Domain
- Infrastructure Domain
- Development Domain

It also establishes naming conventions, approved terminology, deprecated terminology, abbreviations, and reserved words.

Implementation details are intentionally excluded and will be covered in subsequent handbook documents.

---

# Intended Audience

This document is intended for:

- Software Architects
- Backend Engineers
- Frontend Engineers
- AI Engineers
- DevOps Engineers
- UI/UX Designers
- QA Engineers
- Researchers
- Claude Code
- Other AI Coding Assistants
- Future Contributors

---

# Table of Contents

1. Introduction
2. Naming Philosophy
3. Learner Domain
4. Identity Domain
5. Assessment Domain
6. Knowledge Domain
7. AI Domain
8. Analytics Domain
9. Platform Domain
10. Infrastructure Domain
11. Development Domain
12. Naming Standards
13. Reserved Terminology
14. Abbreviations
15. Quick Reference Tables
16. Design Decisions
17. Open Questions
18. Future Enhancements
19. Claude Code Implementation Instructions
20. Revision History

---

# Introduction

As software systems evolve, inconsistent terminology becomes one of the primary sources of architectural confusion.

For example, one developer may refer to a "Course," another to a "Lesson," while a third refers to a "Module." Although these terms appear similar, they may represent entirely different concepts within the platform.

This inconsistency propagates into:

- Database schemas
- REST APIs
- Frontend components
- AI prompts
- Documentation
- Research papers
- Source code

To eliminate this ambiguity, GenLearn adopts a **Ubiquitous Language**.

Every significant concept within the platform is assigned one official name.

That name must be used consistently throughout the project.

---

# Naming Philosophy

The GenLearn platform follows these naming principles.

## Principle 1 — One Concept, One Name

Every concept shall have exactly one official name.

Example:

✅ Student

❌ Learner

❌ Candidate

❌ User (when referring specifically to a student)

---

## Principle 2 — Business Before Technology

Names should describe business intent rather than implementation.

Example:

✅ Knowledge Source

❌ Uploaded PDF

The platform may later support:

- PDF
- DOCX
- Images
- Audio
- Video
- Web Pages

The business concept remains a Knowledge Source regardless of file type.

---

## Principle 3 — Platform Over Features

Prefer reusable platform terminology.

Example:

✅ Assessment Platform

❌ Quiz Module

---

✅ Knowledge Platform

❌ PDF Upload System

---

✅ Conversational AI Engine

❌ Chatbot

---

## Principle 4 — Future Compatibility

Terminology should remain valid as the platform evolves.

Avoid names tied to specific vendors, technologies, or implementations.

Example:

✅ AI Provider

❌ Gemini Service

---

✅ Vector Store

❌ Pinecone Database

---

## Principle 5 — Provider Independence

No business terminology should depend upon a specific technology provider.

Examples include:

- AI Provider
- Embedding Provider
- Storage Provider
- Notification Provider

This enables future migration without changing the language of the platform.

---

## Principle 6 — Consistency Over Preference

Personal naming preferences must never override official terminology.

If this glossary defines:

Learning Session

then future documents must not substitute:

- Study Session
- Practice Session
- Revision Session

unless those represent different business concepts.

---

## Principle 7 — Platform as the Core Product

GenLearn is an AI Learning Platform.

Terminology should describe reusable platform capabilities rather than isolated user interface features.

The platform consists of engines, services, pipelines, and domains rather than pages or modules.

---

# Domain Structure

The glossary is organized according to the core business domains of the GenLearn platform.

The domains are listed in order of business importance.

| Domain | Description |
|---------|-------------|
| Learner Domain | Represents the learner and their educational journey. |
| Identity Domain | Authentication, authorization, roles, and profiles. |
| Assessment Domain | Quizzes, evaluations, attempts, and mastery. |
| Knowledge Domain | Educational content, documents, flashcards, and study materials. |
| AI Domain | Generative AI capabilities and provider abstraction. |
| Analytics Domain | Behaviour tracking, progress, and insights. |
| Platform Domain | Shared platform services and capabilities. |
| Infrastructure Domain | Deployment, storage, caching, and operations. |
| Development Domain | Engineering terminology and development practices. |

---

# Term Definition Format

Every glossary entry follows the same structure.

---

## TERM-XXX

**Official Name**

...

**Category**

...

**Definition**

...

**Responsibilities**

...

**Related Terms**

...

**Deprecated Synonyms**

...

**Notes**

...

---

The remaining sections of this document define the official terminology for each domain using this standardized format.
---

# Learner Domain

The Learner Domain represents the core business domain of the GenLearn platform.

Every other domain exists to support, enhance, or manage the learner's educational journey. Consequently, the Learner Domain forms the heart of the platform and should be regarded as the primary domain when designing features, APIs, database schemas, and AI workflows.

The terminology defined within this section shall be used consistently throughout the project.

---

## TERM-001

### Official Name

Student

### Category

Learner Domain

### Definition

A Student is a registered user of the GenLearn platform whose primary objective is to learn through AI-assisted educational experiences.

Students interact with AI-generated lessons, adaptive assessments, conversational tutoring, knowledge retrieval, behavioural analytics, and personalized learning recommendations.

Every Student possesses a unique educational identity represented by a Student Profile.

### Responsibilities

- Complete authentication
- Participate in learning sessions
- Generate AI lessons
- Attempt assessments
- Upload study materials
- Interact with the AI Tutor
- Review progress analytics
- Receive adaptive recommendations

### Related Terms

- User
- Student Profile
- Learning Session
- Assessment
- Progress
- AI Tutor

### Deprecated Synonyms

- Learner
- Candidate
- End User

### Notes

Within GenLearn, the term **Student** shall always be used when referring to a learner.

---

## TERM-002

### Official Name

Student Profile

### Category

Learner Domain

### Definition

A Student Profile represents the persistent educational identity of a Student.

Unlike an authentication account, the Student Profile stores learning-specific information such as educational preferences, grade level, interests, adaptive scores, completed lessons, behavioural history, and personalization settings.

The Student Profile evolves continuously as the learner interacts with the platform.

### Responsibilities

- Store educational preferences
- Maintain learner interests
- Track adaptive metrics
- Support personalization
- Maintain learning history

### Related Terms

- Student
- Adaptive Profile
- Progress
- Learning Goal

### Deprecated Synonyms

- User Profile

---

## TERM-003

### Official Name

Learning Session

### Category

Learner Domain

### Definition

A Learning Session is a continuous period during which a Student actively interacts with the GenLearn platform.

A session may include multiple educational activities including lesson generation, AI conversations, quizzes, document analysis, and progress reviews.

Behavioural analytics are collected throughout every Learning Session.

### Responsibilities

- Record educational activity
- Track behavioural metrics
- Measure engagement
- Support adaptive learning

### Related Terms

- Student
- Behaviour Log
- Progress
- Analytics

### Deprecated Synonyms

- Study Session
- Practice Session

---

## TERM-004

### Official Name

Learning Goal

### Category

Learner Domain

### Definition

A Learning Goal defines the educational objective that a Student intends to achieve.

Learning Goals influence lesson generation, adaptive recommendations, assessment difficulty, and personalized study planning.

Examples include:

- Prepare for examination
- Master recursion
- Improve mathematics
- Revise operating systems

### Responsibilities

- Guide personalization
- Influence AI lesson generation
- Support adaptive recommendations

### Related Terms

- Student
- Learning Path
- Recommendation

### Deprecated Synonyms

None

---

## TERM-005

### Official Name

Learning Path

### Category

Learner Domain

### Definition

A Learning Path is a structured sequence of educational activities recommended by the Adaptive Learning Engine.

Learning Paths are dynamically generated using behavioural analytics, previous assessments, learner preferences, and AI recommendations.

Learning Paths are personalized for every Student.

### Responsibilities

- Organize educational progression
- Recommend future lessons
- Improve long-term learning outcomes

### Related Terms

- Learning Goal
- Recommendation
- Adaptive Learning Engine

### Deprecated Synonyms

- Study Plan
- Curriculum

---

## TERM-006

### Official Name

Lesson

### Category

Learner Domain

### Definition

A Lesson is a structured educational resource generated or curated by the platform to teach one or more concepts.

Lessons may be generated by Generative AI, retrieved using RAG, or created from uploaded educational material.

Every Lesson contains learning objectives, explanations, examples, summaries, and optional assessments.

### Responsibilities

- Teach concepts
- Present examples
- Support revision
- Prepare learners for assessments

### Related Terms

- Topic
- Concept
- AI Lesson
- Knowledge Source

### Deprecated Synonyms

- Chapter
- Module

---

## TERM-007

### Official Name

Topic

### Category

Learner Domain

### Definition

A Topic represents a specific subject area within a Lesson.

Examples include:

- Binary Trees
- Operating Systems
- Normalization
- Sorting Algorithms
- Newton's Laws

Topics are the primary input for AI lesson generation and assessment generation.

### Responsibilities

- Organize educational content
- Define lesson scope
- Support AI generation

### Related Terms

- Lesson
- Concept
- Knowledge Unit

### Deprecated Synonyms

None

---

## TERM-008

### Official Name

Concept

### Category

Learner Domain

### Definition

A Concept is the smallest meaningful educational idea that a Student is expected to understand.

Examples include:

- Stack Overflow
- Polymorphism
- ACID Properties
- Recursion
- Big O Notation

Lessons are composed of multiple Concepts.

Concept mastery is measured independently by the Adaptive Learning Engine.

### Responsibilities

- Measure understanding
- Support mastery evaluation
- Enable adaptive recommendations

### Related Terms

- Lesson
- Topic
- Mastery

### Deprecated Synonyms

None

---

## TERM-009

### Official Name

Knowledge Unit

### Category

Learner Domain

### Definition

A Knowledge Unit represents a reusable educational fragment that can be independently retrieved, taught, assessed, or revised.

Knowledge Units form the atomic educational building blocks used by the AI platform.

They may originate from generated content, uploaded documents, or curated educational resources.

### Responsibilities

- Enable modular learning
- Support RAG retrieval
- Improve content reuse

### Related Terms

- Concept
- Knowledge Source
- Lesson
- RAG

### Deprecated Synonyms

Learning Object

---

## TERM-010

### Official Name

Progress

### Category

Learner Domain

### Definition

Progress represents the measurable advancement of a Student toward achieving their Learning Goals.

Progress is calculated using multiple educational signals including completed lessons, assessments, behavioural analytics, mastery scores, and AI interactions.

Progress is continuously updated throughout the learner's journey.

### Responsibilities

- Measure educational growth
- Track completion
- Support analytics
- Guide recommendations

### Related Terms

- Mastery
- Assessment
- Learning Goal
- Adaptive Learning Engine

### Deprecated Synonyms

Completion Status
---

## TERM-011

### Official Name

Mastery

### Category

Learner Domain

### Definition

Mastery represents the platform's confidence that a Student has achieved a satisfactory understanding of a specific Concept, Topic, or Learning Goal.

Unlike a quiz score, Mastery is a continuously evolving metric derived from multiple educational signals including assessment performance, behavioural analytics, AI interactions, revision frequency, and long-term retention.

Mastery is one of the primary inputs to the Adaptive Learning Engine.

### Responsibilities

- Measure conceptual understanding
- Guide adaptive recommendations
- Identify knowledge gaps
- Support long-term learning analytics

### Related Terms

- Progress
- Assessment
- Concept
- Adaptive Learning Engine

### Deprecated Synonyms

- Proficiency
- Skill Level

### Notes

Mastery is not equivalent to marks or percentages.

---

## TERM-012

### Official Name

Milestone

### Category

Learner Domain

### Definition

A Milestone represents a significant achievement in a Student's learning journey.

Milestones are awarded when predefined educational objectives have been completed, such as mastering a topic, completing a learning path, or achieving consistent assessment performance.

Milestones serve as motivational checkpoints rather than academic evaluations.

### Responsibilities

- Encourage learner engagement
- Mark educational achievements
- Track long-term progression

### Related Terms

- Achievement
- Progress
- Learning Path

### Deprecated Synonyms

None

---

## TERM-013

### Official Name

Achievement

### Category

Learner Domain

### Definition

An Achievement is a recognition granted to a Student for completing a meaningful educational activity or demonstrating consistent learning behaviour.

Achievements may be awarded for academic performance, learning consistency, platform engagement, or successful completion of challenges.

Achievements are motivational indicators and do not directly affect adaptive learning decisions.

### Responsibilities

- Encourage engagement
- Reward positive behaviour
- Improve learner motivation

### Related Terms

- Milestone
- Progress
- Student

### Deprecated Synonyms

- Badge
- Reward

---

## TERM-014

### Official Name

Recommendation

### Category

Learner Domain

### Definition

A Recommendation is an AI-generated educational suggestion provided to a Student based on behavioural analytics, learning history, assessment performance, and adaptive scoring.

Recommendations may include:

- Next lesson
- Revision topics
- Additional practice
- Flashcards
- AI Tutor sessions
- Study schedule adjustments

Recommendations are personalized for every Student.

### Responsibilities

- Personalize learning
- Improve educational outcomes
- Guide future activities

### Related Terms

- Adaptive Learning Engine
- Learning Path
- Progress
- Mastery

### Deprecated Synonyms

- Suggestion

---

## TERM-015

### Official Name

Revision

### Category

Learner Domain

### Definition

Revision refers to the process of reviewing previously learned educational content to reinforce understanding and improve long-term retention.

Revision activities may be initiated by the Student or recommended automatically by the Adaptive Learning Engine based on mastery decay, assessment performance, or elapsed time since the original learning session.

### Responsibilities

- Reinforce knowledge
- Improve retention
- Reduce forgetting

### Related Terms

- Lesson
- Flashcards
- Recommendation
- Mastery

### Deprecated Synonyms

- Review Session

---

## TERM-016

### Official Name

Learning Resource

### Category

Learner Domain

### Definition

A Learning Resource is any educational material consumed by a Student during the learning process.

Learning Resources may originate from AI-generated content, uploaded study materials, curated educational resources, or retrieved knowledge through the RAG pipeline.

Examples include:

- Lessons
- Flashcards
- Summaries
- Documents
- Quizzes
- AI Conversations

### Responsibilities

- Deliver educational content
- Support learning objectives
- Enable knowledge acquisition

### Related Terms

- Knowledge Source
- Lesson
- Flashcards
- Summary

### Deprecated Synonyms

- Material

---

## TERM-017

### Official Name

Learning Preference

### Category

Learner Domain

### Definition

A Learning Preference represents the preferred learning style or educational configuration selected by a Student.

Preferences influence AI lesson generation, content presentation, recommendation strategies, and adaptive learning decisions.

Examples include:

- Beginner-friendly explanations
- Visual learning
- Step-by-step instruction
- Concise summaries
- Practice-first approach

### Responsibilities

- Personalize AI responses
- Improve learner experience
- Support adaptive delivery

### Related Terms

- Student Profile
- AI Lesson
- Recommendation

### Deprecated Synonyms

- User Preference

---

## TERM-018

### Official Name

Learning History

### Category

Learner Domain

### Definition

Learning History is the chronological record of all educational activities performed by a Student throughout their journey on the platform.

This includes generated lessons, completed assessments, uploaded resources, AI tutor conversations, behavioural events, and adaptive recommendations.

Learning History provides long-term context for personalization and analytics.

### Responsibilities

- Preserve educational records
- Support adaptive learning
- Enable progress analytics

### Related Terms

- Progress
- Learning Session
- Behaviour Log
- Student Profile

### Deprecated Synonyms

None

---

## TERM-019

### Official Name

Retention

### Category

Learner Domain

### Definition

Retention represents the platform's estimation of how well a Student remembers previously learned Concepts over time.

Retention is influenced by revision frequency, assessment performance, time elapsed since learning, and behavioural engagement.

Retention metrics are used to recommend revision schedules and reinforce long-term learning.

### Responsibilities

- Estimate memory strength
- Schedule revisions
- Improve long-term understanding

### Related Terms

- Revision
- Mastery
- Adaptive Learning Engine

### Deprecated Synonyms

- Memory Score

---

## TERM-020

### Official Name

Adaptive Profile

### Category

Learner Domain

### Definition

The Adaptive Profile is the continuously evolving educational model maintained for every Student.

It aggregates behavioural data, assessment outcomes, mastery estimates, learning preferences, AI interactions, and engagement metrics to support intelligent personalization across the platform.

The Adaptive Profile is the primary source of context used by the Adaptive Learning Engine.

### Responsibilities

- Maintain learner intelligence
- Support personalization
- Guide adaptive recommendations
- Improve AI decision-making

### Related Terms

- Student Profile
- Mastery
- Progress
- Behaviour Analytics
- Adaptive Learning Engine

### Deprecated Synonyms

- Learning Model
- Student Model

### Notes

The Adaptive Profile is an internal platform construct and is not directly editable by Students.

---

# Identity Domain

The Identity Domain governs how users are identified, authenticated, authorized, and managed within the GenLearn platform.

It defines the terminology related to user identity, account lifecycle, access control, authentication, authorization, and security context.

Every secured interaction within the platform depends upon the concepts defined in this domain.

The Identity Domain works closely with the Authentication & Security architecture described in **Document 10**.

---

## TERM-021

### Official Name

User

### Category

Identity Domain

### Definition

A User is any individual who possesses a registered account within the GenLearn platform.

The User entity represents the authentication identity of a person rather than their educational identity.

Every Student and every Administrator is a User.

### Responsibilities

- Authenticate with the platform
- Maintain account credentials
- Own one or more platform roles
- Access authorized platform resources

### Related Terms

- Student
- Administrator
- Role
- Authentication

### Deprecated Synonyms

- Account Holder

### Notes

Use the term **User** only when referring to authentication or identity-related concepts.

---

## TERM-022

### Official Name

Administrator

### Category

Identity Domain

### Definition

An Administrator is a privileged User responsible for managing the GenLearn platform.

Administrators oversee user management, AI usage monitoring, analytics, platform configuration, moderation, and operational oversight.

Administrators do not participate in adaptive learning workflows.

### Responsibilities

- Manage users
- Monitor platform health
- Review analytics
- Manage educational content
- Configure platform settings

### Related Terms

- User
- Role
- Permission

### Deprecated Synonyms

- Admin
- Super User

---

## TERM-023

### Official Name

Authentication

### Category

Identity Domain

### Definition

Authentication is the process of verifying the identity of a User before granting access to the platform.

Authentication confirms *who* the User is.

Successful authentication results in an authenticated security context for subsequent requests.

### Responsibilities

- Verify identity
- Issue tokens
- Initiate secure sessions

### Related Terms

- Authorization
- Access Token
- Refresh Token
- Session

### Deprecated Synonyms

- Login Validation

---

## TERM-024

### Official Name

Authorization

### Category

Identity Domain

### Definition

Authorization is the process of determining which resources and operations an authenticated User is permitted to access.

Authorization answers the question:

"What is this User allowed to do?"

### Responsibilities

- Validate permissions
- Enforce access control
- Protect platform resources

### Related Terms

- Authentication
- Role
- Permission
- RBAC

### Deprecated Synonyms

None

---

## TERM-025

### Official Name

Role

### Category

Identity Domain

### Definition

A Role represents a predefined collection of permissions assigned to a User.

Roles simplify access control by grouping related permissions together.

Current platform roles include:

- Student
- Administrator

Future versions may introduce additional roles without changing the authorization model.

### Responsibilities

- Group permissions
- Simplify authorization
- Define platform responsibilities

### Related Terms

- Permission
- RBAC
- User

### Deprecated Synonyms

- User Type

---

## TERM-026

### Official Name

Permission

### Category

Identity Domain

### Definition

A Permission defines a specific action that a User is authorized to perform within the platform.

Examples include:

- Generate Lesson
- Delete User
- View Analytics
- Upload Document
- Manage Content

Permissions are assigned to Roles rather than directly to Users.

### Responsibilities

- Protect platform resources
- Support fine-grained authorization
- Enable RBAC

### Related Terms

- Role
- Authorization
- RBAC

### Deprecated Synonyms

- Privilege

---

## TERM-027

### Official Name

Role-Based Access Control (RBAC)

### Category

Identity Domain

### Definition

Role-Based Access Control (RBAC) is the authorization model used by GenLearn.

Users receive Roles.

Roles contain Permissions.

Access decisions are based upon assigned Roles rather than individual user-specific rules.

### Responsibilities

- Centralize authorization
- Simplify permission management
- Improve security

### Related Terms

- Role
- Permission
- Authorization

### Deprecated Synonyms

None

---

## TERM-028

### Official Name

Session

### Category

Identity Domain

### Definition

A Session represents the authenticated interaction period between a User and the GenLearn platform.

A Session begins after successful authentication and ends when the User logs out, the refresh token expires, or the session is invalidated.

Sessions are used for security, auditing, and user experience.

### Responsibilities

- Maintain authenticated state
- Support secure interactions
- Enable auditing

### Related Terms

- Authentication
- Access Token
- Refresh Token

### Deprecated Synonyms

- Login Session

---

## TERM-029

### Official Name

Access Token

### Category

Identity Domain

### Definition

An Access Token is a short-lived security token issued after successful authentication.

It is attached to API requests to prove the identity of the authenticated User.

Access Tokens should never contain sensitive business information.

### Responsibilities

- Authenticate API requests
- Maintain secure communication
- Support stateless authentication

### Related Terms

- Refresh Token
- Authentication
- Session

### Deprecated Synonyms

- JWT Token

### Notes

JWT is the implementation technology.

Access Token is the business term.

---

## TERM-030

### Official Name

Refresh Token

### Category

Identity Domain

### Definition

A Refresh Token is a long-lived credential used to obtain new Access Tokens without requiring the User to authenticate again.

Refresh Tokens improve user experience while maintaining security.

The platform implements Refresh Token rotation to reduce security risks.

### Responsibilities

- Renew Access Tokens
- Maintain secure sessions
- Support long-term authentication

### Related Terms

- Access Token
- Authentication
- Session

### Deprecated Synonyms

None

---

## TERM-031

### Official Name

Account Status

### Category

Identity Domain

### Definition

Account Status represents the operational state of a User account.

Typical statuses include:

- Active
- Pending Verification
- Suspended
- Disabled
- Deleted

Account Status determines whether authentication and platform access are permitted.

### Responsibilities

- Manage account lifecycle
- Support moderation
- Improve security

### Related Terms

- User
- Authentication
- Administrator

### Deprecated Synonyms

None

---

## TERM-032

### Official Name

Email Verification

### Category

Identity Domain

### Definition

Email Verification is the process of confirming ownership of an email address before granting full platform access.

Verified email addresses improve account security and enable password recovery.

### Responsibilities

- Validate ownership
- Improve security
- Reduce fraudulent accounts

### Related Terms

- User
- Authentication
- Password Reset

### Deprecated Synonyms

Email Confirmation

---

## TERM-033

### Official Name

Password Reset

### Category

Identity Domain

### Definition

Password Reset is the secure process through which a User replaces a forgotten or compromised password.

The process requires verification of account ownership before allowing credential updates.

### Responsibilities

- Recover account access
- Improve security
- Protect user identity

### Related Terms

- Authentication
- Email Verification
- User

### Deprecated Synonyms

Forgot Password

---

## TERM-034

### Official Name

Security Context

### Category

Identity Domain

### Definition

The Security Context represents the authenticated identity, assigned roles, permissions, and session information associated with a User during request processing.

The Security Context is established after successful authentication and is evaluated during authorization checks.

### Responsibilities

- Provide identity information
- Support authorization
- Maintain request security

### Related Terms

- Authentication
- Authorization
- RBAC
- Session

### Deprecated Synonyms

None

---

## TERM-035

### Official Name

Identity Platform

### Category

Identity Domain

### Definition

The Identity Platform is the platform capability responsible for authentication, authorization, account lifecycle management, role management, session management, and security services.

It provides identity-related services to every other platform capability while remaining independent of educational workflows.

### Responsibilities

- Authenticate users
- Authorize access
- Manage roles
- Manage sessions
- Maintain account security

### Related Terms

- User
- Authentication
- Authorization
- RBAC
- Security Context

### Deprecated Synonyms

Authentication Module
User Management System

### Notes

Throughout the handbook, the term **Identity Platform** shall be used instead of "Authentication Module" to reinforce the platform-oriented architecture of GenLearn.
---

# Assessment Domain

The Assessment Domain defines the terminology related to evaluating a Student's understanding, measuring learning outcomes, identifying knowledge gaps, and supporting adaptive learning.

Assessments within GenLearn are not limited to examinations. They are continuous learning instruments that enable the platform to personalize educational experiences.

This domain provides the vocabulary used by the Assessment Platform, Adaptive Learning Engine, AI Lesson Generator, AI Quiz Generator, and Learning Analytics Platform.

---

## TERM-036

### Official Name

Assessment

### Category

Assessment Domain

### Definition

An Assessment is a structured educational activity designed to evaluate a Student's understanding of one or more Concepts or Topics.

Assessments may be generated by AI, curated by administrators, or created using uploaded educational resources through the RAG pipeline.

Assessments may contain different question formats and varying difficulty levels.

### Responsibilities

- Measure understanding
- Identify knowledge gaps
- Support adaptive learning
- Generate performance metrics

### Related Terms

- Quiz
- Question
- Score
- Mastery

### Deprecated Synonyms

- Test
- Examination

---

## TERM-037

### Official Name

Quiz

### Category

Assessment Domain

### Definition

A Quiz is a specific type of Assessment consisting of one or more Questions intended to evaluate a Student's understanding of a defined Topic or Learning Goal.

Quizzes may be adaptive, AI-generated, or document-aware through Retrieval-Augmented Generation (RAG).

### Responsibilities

- Evaluate learning
- Reinforce concepts
- Generate feedback
- Improve mastery estimation

### Related Terms

- Assessment
- Question
- Attempt

### Deprecated Synonyms

- Practice Test

---

## TERM-038

### Official Name

Question

### Category

Assessment Domain

### Definition

A Question is the smallest evaluative component of an Assessment.

Each Question measures one or more Concepts and contributes to the overall Assessment outcome.

Questions may include explanations, hints, difficulty metadata, and AI-generated feedback.

### Responsibilities

- Evaluate understanding
- Measure concept mastery
- Support adaptive assessment

### Related Terms

- Quiz
- Hint
- Explanation
- Concept

### Deprecated Synonyms

None

---

## TERM-039

### Official Name

Question Type

### Category

Assessment Domain

### Definition

Question Type defines the format used to assess a Student.

Supported types include:

- Multiple Choice Question (MCQ)
- Fill in the Blank
- True or False
- Short Answer
- Long Answer
- Code Challenge
- Scenario-Based Question
- Matching
- Ordering

The platform architecture shall allow additional question types to be introduced without modifying existing assessment logic.

### Responsibilities

- Classify questions
- Support extensibility
- Improve assessment diversity

### Related Terms

- Question
- Assessment

### Deprecated Synonyms

Question Format

---

## TERM-040

### Official Name

Difficulty Level

### Category

Assessment Domain

### Definition

Difficulty Level represents the estimated complexity of a Lesson, Question, or Assessment.

The Adaptive Learning Engine dynamically determines the appropriate difficulty level for each Student.

Standard levels include:

- Beginner
- Easy
- Intermediate
- Advanced
- Expert

### Responsibilities

- Personalize assessments
- Guide adaptive learning
- Balance challenge and engagement

### Related Terms

- Adaptive Learning Engine
- Quiz
- Recommendation

### Deprecated Synonyms

Complexity Level

---

## TERM-041

### Official Name

Attempt

### Category

Assessment Domain

### Definition

An Attempt represents a single submission by a Student for a Question or Assessment.

Multiple Attempts may be permitted depending on platform configuration and assessment objectives.

Each Attempt contributes behavioural and performance data to the Adaptive Learning Engine.

### Responsibilities

- Record learner responses
- Measure persistence
- Generate behavioural insights

### Related Terms

- Assessment
- Submission
- Behaviour Analytics

### Deprecated Synonyms

None

---

## TERM-042

### Official Name

Submission

### Category

Assessment Domain

### Definition

A Submission is the collection of responses provided by a Student for an Assessment Attempt.

A Submission is evaluated to determine correctness, feedback, and mastery contribution.

### Responsibilities

- Capture learner responses
- Trigger evaluation
- Persist assessment data

### Related Terms

- Attempt
- Evaluation
- Score

### Deprecated Synonyms

Response Sheet

---

## TERM-043

### Official Name

Evaluation

### Category

Assessment Domain

### Definition

Evaluation is the process of analyzing a Student's Submission to determine correctness, calculate performance metrics, generate explanations, and update learner progress.

Evaluation may be rule-based, AI-assisted, or hybrid depending on the assessment type.

### Responsibilities

- Calculate scores
- Generate feedback
- Update mastery
- Produce analytics

### Related Terms

- Submission
- Score
- Feedback
- Mastery

### Deprecated Synonyms

Grading

---

## TERM-044

### Official Name

Score

### Category

Assessment Domain

### Definition

A Score is the numerical or qualitative result produced after evaluating an Assessment.

Scores represent performance for a specific Assessment and should not be interpreted as long-term learning ability.

Mastery is derived from Scores but is not equivalent to them.

### Responsibilities

- Represent assessment performance
- Support analytics
- Influence adaptive learning

### Related Terms

- Evaluation
- Mastery
- Progress

### Deprecated Synonyms

Marks

---

## TERM-045

### Official Name

Hint

### Category

Assessment Domain

### Definition

A Hint is contextual guidance provided to assist a Student in solving a Question without directly revealing the correct answer.

Hint usage is recorded as behavioural data and contributes to adaptive learner modelling.

### Responsibilities

- Support learning
- Reduce learner frustration
- Generate behavioural signals

### Related Terms

- Question
- Behaviour Analytics
- Adaptive Profile

### Deprecated Synonyms

Clue

---

## TERM-046

### Official Name

Explanation

### Category

Assessment Domain

### Definition

An Explanation is a detailed educational response describing why an answer is correct or incorrect.

Explanations are intended to reinforce conceptual understanding rather than merely reveal the correct answer.

They may be AI-generated, document-aware, or curated.

### Responsibilities

- Improve conceptual understanding
- Reinforce learning
- Support revision

### Related Terms

- Feedback
- Lesson
- AI Tutor

### Deprecated Synonyms

Solution

---

## TERM-047

### Official Name

Feedback

### Category

Assessment Domain

### Definition

Feedback is the educational information provided to a Student after an Evaluation.

Feedback may include:

- Correctness
- Explanation
- Suggested revision
- Recommended lessons
- Mastery changes
- Personalized guidance

Feedback is personalized whenever possible.

### Responsibilities

- Guide improvement
- Encourage reflection
- Support adaptive learning

### Related Terms

- Evaluation
- Recommendation
- Explanation

### Deprecated Synonyms

Result Comments

---

## TERM-048

### Official Name

Assessment Result

### Category

Assessment Domain

### Definition

An Assessment Result is the consolidated outcome of an Assessment, including the Score, Evaluation, Feedback, behavioural metrics, and mastery updates.

Assessment Results are stored as part of the Student's Learning History.

### Responsibilities

- Preserve assessment outcomes
- Support analytics
- Enable longitudinal learning analysis

### Related Terms

- Assessment
- Submission
- Progress
- Learning History

### Deprecated Synonyms

Exam Result

---

## TERM-049

### Official Name

Question Bank

### Category

Assessment Domain

### Definition

A Question Bank is the centralized repository of Questions available to the Assessment Platform.

Questions may originate from AI generation, administrator-created content, uploaded educational resources, or curated datasets.

The Question Bank supports reuse, categorization, versioning, and adaptive selection.

### Responsibilities

- Store questions
- Support reuse
- Enable adaptive assessments

### Related Terms

- Question
- Assessment
- AI Quiz Generator

### Deprecated Synonyms

Question Repository

---

## TERM-050

### Official Name

Adaptive Assessment

### Category

Assessment Domain

### Definition

An Adaptive Assessment is an Assessment whose difficulty, question selection, or educational flow changes dynamically based on the Student's performance and behavioural profile.

Adaptive Assessments are a defining capability of GenLearn and are powered by the Adaptive Learning Engine.

### Responsibilities

- Personalize evaluation
- Improve learning efficiency
- Increase assessment accuracy

### Related Terms

- Adaptive Learning Engine
- Difficulty Level
- Recommendation
- Assessment

### Deprecated Synonyms

Dynamic Quiz

### Notes

Adaptive Assessments are one of the primary differentiators of the GenLearn platform and should be treated as a core platform capability rather than a standalone feature.

---

# Knowledge Domain

The Knowledge Domain defines the terminology associated with educational content, knowledge management, Retrieval-Augmented Generation (RAG), and document-aware learning.

Unlike traditional Learning Management Systems (LMS), GenLearn treats knowledge as a structured, searchable, reusable platform asset rather than static files.

Knowledge may originate from AI generation, uploaded educational resources, institutional content, or curated datasets.

The Knowledge Domain forms the foundation of the platform's Retrieval-Augmented Generation (RAG) architecture.

---

## TERM-051

### Official Name

Knowledge Source

### Category

Knowledge Domain

### Definition

A Knowledge Source is any educational resource that can be processed by the platform to generate learning experiences.

Knowledge Sources may include:

- PDF Documents
- Lecture Notes
- Research Papers
- DOCX Files
- Presentations
- Text Files
- Markdown Documents
- Educational Articles

Knowledge Sources are transformed into searchable knowledge through the Knowledge Platform.

### Responsibilities

- Provide educational content
- Supply context for AI generation
- Enable RAG workflows

### Related Terms

- Document
- Knowledge Base
- Knowledge Chunk

### Deprecated Synonyms

- Uploaded File
- Notes

---

## TERM-052

### Official Name

Document

### Category

Knowledge Domain

### Definition

A Document is a digital representation of a single Knowledge Source after it has been successfully uploaded into the platform.

Each Document maintains metadata including ownership, upload history, processing status, and associated knowledge chunks.

Documents are immutable educational resources; modifications create new document versions.

### Responsibilities

- Store educational information
- Maintain metadata
- Enable document management

### Related Terms

- Knowledge Source
- Document Version
- Knowledge Chunk

### Deprecated Synonyms

File

---

## TERM-053

### Official Name

Knowledge Base

### Category

Knowledge Domain

### Definition

The Knowledge Base is the logical repository of all educational knowledge available to the platform.

It includes uploaded documents, AI-generated educational resources, extracted concepts, flashcards, summaries, and indexed knowledge chunks.

The Knowledge Base is queried during Retrieval-Augmented Generation.

### Responsibilities

- Organize educational knowledge
- Support retrieval
- Enable intelligent search

### Related Terms

- Knowledge Source
- Knowledge Chunk
- Vector Store

### Deprecated Synonyms

Document Repository

---

## TERM-054

### Official Name

Knowledge Chunk

### Category

Knowledge Domain

### Definition

A Knowledge Chunk is the smallest meaningful unit of educational information extracted from a Document.

Documents are divided into multiple Knowledge Chunks to improve semantic retrieval accuracy.

Chunks retain contextual relationships with their parent document.

### Responsibilities

- Enable semantic search
- Improve retrieval precision
- Support AI generation

### Related Terms

- Document
- Embedding
- Vector Store

### Deprecated Synonyms

Chunk

---

## TERM-055

### Official Name

Embedding

### Category

Knowledge Domain

### Definition

An Embedding is the numerical vector representation of a Knowledge Chunk generated by an Embedding Provider.

Embeddings enable semantic similarity searches by representing textual meaning in a high-dimensional vector space.

Embeddings are implementation details and are never directly visible to platform users.

### Responsibilities

- Enable semantic search
- Support RAG retrieval
- Improve AI context selection

### Related Terms

- Knowledge Chunk
- Vector Store
- Embedding Provider

### Deprecated Synonyms

Vector Representation

---

## TERM-056

### Official Name

Vector Store

### Category

Knowledge Domain

### Definition

A Vector Store is the specialized storage system responsible for maintaining embeddings and performing semantic similarity searches.

The platform abstracts the Vector Store to allow interchangeable implementations such as MongoDB Atlas Vector Search or external vector databases.

### Responsibilities

- Store embeddings
- Perform similarity search
- Support retrieval operations

### Related Terms

- Embedding
- Knowledge Chunk
- Retriever

### Deprecated Synonyms

Vector Database

---

## TERM-057

### Official Name

Retriever

### Category

Knowledge Domain

### Definition

A Retriever is the platform component responsible for identifying the most relevant Knowledge Chunks for a given query.

The Retriever operates using semantic similarity rather than keyword matching.

Retrieved knowledge is supplied as context to the AI Provider.

### Responsibilities

- Search knowledge
- Rank relevant chunks
- Supply contextual information

### Related Terms

- Vector Store
- Knowledge Chunk
- Retrieval

### Deprecated Synonyms

Search Engine

---

## TERM-058

### Official Name

Retrieval

### Category

Knowledge Domain

### Definition

Retrieval is the process of selecting relevant Knowledge Chunks from the Knowledge Base based on semantic similarity to a user request.

Retrieval occurs before AI generation within the RAG pipeline.

### Responsibilities

- Identify relevant context
- Improve factual accuracy
- Reduce hallucinations

### Related Terms

- Retriever
- RAG
- Knowledge Base

### Deprecated Synonyms

Context Search

---

## TERM-059

### Official Name

Flashcard

### Category

Knowledge Domain

### Definition

A Flashcard is a concise educational resource consisting of a prompt and a corresponding answer used for active recall and revision.

Flashcards may be generated automatically by AI using uploaded educational resources or AI-generated lessons.

### Responsibilities

- Support revision
- Reinforce memory
- Improve retention

### Related Terms

- Summary
- Revision
- Knowledge Source

### Deprecated Synonyms

Study Card

---

## TERM-060

### Official Name

Summary

### Category

Knowledge Domain

### Definition

A Summary is a condensed educational representation of a Lesson, Topic, or Knowledge Source highlighting the most important information.

Summaries are designed to support rapid revision and concept reinforcement.

### Responsibilities

- Reduce cognitive load
- Enable quick revision
- Improve comprehension

### Related Terms

- Lesson
- Flashcard
- Knowledge Source

### Deprecated Synonyms

Notes

---

## TERM-061

### Official Name

Citation

### Category

Knowledge Domain

### Definition

A Citation represents the traceable reference connecting AI-generated responses to the original Knowledge Source from which supporting information was retrieved.

Citations improve transparency, trust, and educational credibility by allowing learners to verify generated explanations.

### Responsibilities

- Improve explainability
- Support traceability
- Increase learner confidence

### Related Terms

- Retrieval
- Knowledge Source
- RAG

### Deprecated Synonyms

Reference

---

## TERM-062

### Official Name

Knowledge Ingestion Pipeline

### Category

Knowledge Domain

### Definition

The Knowledge Ingestion Pipeline is the platform capability responsible for transforming uploaded Knowledge Sources into searchable educational knowledge.

The pipeline performs:

- Document validation
- Text extraction
- Chunk generation
- Embedding creation
- Metadata extraction
- Vector indexing

before making the content available for Retrieval-Augmented Generation.

### Responsibilities

- Process uploaded documents
- Create knowledge chunks
- Generate embeddings
- Populate the Knowledge Base

### Related Terms

- Knowledge Source
- Document
- Embedding
- Vector Store

### Deprecated Synonyms

Document Upload Pipeline

### Notes

Throughout the handbook, the term **Knowledge Ingestion Pipeline** shall be used instead of "Document Upload" because it reflects the complete processing lifecycle rather than a single user action.

---

# AI Domain

The AI Domain defines the terminology associated with the artificial intelligence capabilities of the GenLearn platform.

Artificial Intelligence is the core platform capability upon which lesson generation, conversational tutoring, adaptive recommendations, knowledge synthesis, assessment generation, and personalized learning experiences are built.

The AI Domain intentionally avoids dependence on any single AI provider. All terminology defined within this section remains valid regardless of whether the platform uses Google Gemini, OpenAI, Groq, Anthropic, Hugging Face, or future providers.

---

## TERM-063

### Official Name

AI Provider

### Category

AI Domain

### Definition

An AI Provider is an external or internal service responsible for performing large language model inference for the GenLearn platform.

The platform communicates with AI Providers through a provider abstraction layer to ensure portability and maintainability.

Examples include:

- Google Gemini
- OpenAI
- Groq
- Anthropic
- Hugging Face
- Self-hosted LLMs

### Responsibilities

- Generate educational content
- Answer learner questions
- Support conversational tutoring
- Perform structured AI tasks

### Related Terms

- Prompt
- AI Generation
- Prompt Manager

### Deprecated Synonyms

- LLM Service
- GPT Service

### Notes

The platform must never depend directly on a specific provider.

---

## TERM-064

### Official Name

AI Generation

### Category

AI Domain

### Definition

AI Generation is the process through which the platform requests an AI Provider to produce educational content based on structured prompts and contextual information.

Generated outputs may include:

- Lessons
- Quizzes
- Summaries
- Flashcards
- Tutor Responses
- Recommendations

### Responsibilities

- Produce educational content
- Support personalization
- Generate learning resources

### Related Terms

- Prompt
- AI Provider
- Context

### Deprecated Synonyms

Content Generation

---

## TERM-065

### Official Name

Prompt

### Category

AI Domain

### Definition

A Prompt is a structured instruction sent to an AI Provider describing the desired educational task.

Prompts may contain:

- System instructions
- Learner context
- Retrieved knowledge
- Learning objectives
- Output formatting rules

Prompts should never be generated directly by application logic and must be managed through the Prompt Manager.

### Responsibilities

- Guide AI behaviour
- Define generation objectives
- Maintain consistency

### Related Terms

- Prompt Template
- Prompt Manager
- Context

### Deprecated Synonyms

AI Request

---

## TERM-066

### Official Name

Prompt Template

### Category

AI Domain

### Definition

A Prompt Template is a reusable blueprint for constructing prompts for a specific educational task.

Prompt Templates separate prompt structure from runtime data, enabling version control, testing, and provider independence.

Examples include:

- Lesson Generation
- Quiz Generation
- Tutor Conversation
- Flashcard Generation
- Summary Generation

### Responsibilities

- Standardize prompts
- Improve maintainability
- Enable prompt versioning

### Related Terms

- Prompt
- Prompt Manager
- AI Generation

### Deprecated Synonyms

Prompt Format

---

## TERM-067

### Official Name

Prompt Manager

### Category

AI Domain

### Definition

The Prompt Manager is the platform capability responsible for managing all Prompt Templates used by the AI Platform.

It provides version control, template retrieval, prompt construction, testing, and lifecycle management.

No component within GenLearn should construct prompts independently.

### Responsibilities

- Manage prompt templates
- Build prompts
- Maintain version history
- Support prompt testing

### Related Terms

- Prompt
- Prompt Template
- AI Provider

### Deprecated Synonyms

Prompt Service

---

## TERM-068

### Official Name

AI Tutor

### Category

AI Domain

### Definition

The AI Tutor is the conversational educational assistant of the GenLearn platform.

It provides personalized explanations, answers learner questions, offers hints, recommends learning resources, and guides Students through complex concepts using conversational interactions.

The AI Tutor combines learner context, adaptive profiles, and retrieved knowledge to deliver personalized assistance.

### Responsibilities

- Answer questions
- Explain concepts
- Guide learning
- Encourage engagement

### Related Terms

- Conversational Session
- AI Provider
- Adaptive Profile

### Deprecated Synonyms

- Chatbot
- AI Chat

### Notes

Throughout the handbook, the official term shall be **AI Tutor**.

---

## TERM-069

### Official Name

AI Lesson

### Category

AI Domain

### Definition

An AI Lesson is an educational lesson generated dynamically by an AI Provider based on learner context, learning goals, and retrieved knowledge.

AI Lessons follow a structured educational format including objectives, explanations, examples, summaries, and key takeaways.

### Responsibilities

- Teach concepts
- Personalize learning
- Support adaptive education

### Related Terms

- Lesson
- AI Generation
- Learning Goal

### Deprecated Synonyms

Generated Lesson

---

## TERM-070

### Official Name

Context

### Category

AI Domain

### Definition

Context is the collection of information supplied to an AI Provider to improve the quality, relevance, and personalization of generated responses.

Context may include:

- Student Profile
- Learning Goal
- Adaptive Profile
- Previous Conversation
- Retrieved Knowledge
- Assessment Results

### Responsibilities

- Personalize AI responses
- Improve factual accuracy
- Maintain conversational continuity

### Related Terms

- Prompt
- Retrieval
- AI Tutor

### Deprecated Synonyms

Conversation Context

---

## TERM-071

### Official Name

Context Window

### Category

AI Domain

### Definition

The Context Window represents the maximum amount of information that an AI Provider can process during a single generation request.

The platform should optimize context usage to maximize educational value while minimizing token consumption.

### Responsibilities

- Define AI processing limits
- Guide prompt construction
- Improve generation efficiency

### Related Terms

- Token
- Prompt
- Context

### Deprecated Synonyms

Input Window

---

## TERM-072

### Official Name

Token

### Category

AI Domain

### Definition

A Token is the smallest unit of text processed by an AI Provider during inference.

Token usage directly influences generation cost, latency, and provider limits.

The platform tracks token usage for analytics, budgeting, and optimization.

### Responsibilities

- Measure AI usage
- Estimate cost
- Monitor efficiency

### Related Terms

- AI Provider
- Context Window
- AI Generation

### Deprecated Synonyms

None

---

## TERM-073

### Official Name

Grounding

### Category

AI Domain

### Definition

Grounding is the process of constraining AI-generated responses using trusted contextual information retrieved from the Knowledge Base.

Grounding improves factual accuracy and ensures responses align with uploaded educational materials.

Grounding is a core principle of Retrieval-Augmented Generation.

### Responsibilities

- Improve factual correctness
- Reduce hallucinations
- Increase trustworthiness

### Related Terms

- Retrieval
- Knowledge Chunk
- RAG

### Deprecated Synonyms

Context Injection

---

## TERM-074

### Official Name

Hallucination

### Category

AI Domain

### Definition

A Hallucination is an AI-generated response that is factually incorrect, unsupported by available knowledge, misleading, or fabricated.

The platform should minimize hallucinations through grounding, retrieval, prompt engineering, and response validation.

### Responsibilities

- Identify AI risks
- Guide quality evaluation
- Improve AI reliability

### Related Terms

- Grounding
- Retrieval
- AI Evaluation

### Deprecated Synonyms

Fabricated Response

---

## TERM-075

### Official Name

Inference

### Category

AI Domain

### Definition

Inference is the computational process performed by an AI Provider to generate an output from a supplied Prompt and Context.

Inference represents the execution phase of an AI request.

### Responsibilities

- Execute AI requests
- Generate educational outputs
- Support conversational interactions

### Related Terms

- AI Provider
- Prompt
- AI Generation

### Deprecated Synonyms

Model Execution

---

## TERM-076

### Official Name

AI Workflow

### Category

AI Domain

### Definition

An AI Workflow is a structured sequence of AI-related operations executed to complete an educational task.

An AI Workflow may include:

- Context collection
- Retrieval
- Prompt construction
- AI inference
- Response validation
- Storage
- Analytics

AI Workflows promote modularity, observability, and provider independence.

### Responsibilities

- Coordinate AI operations
- Improve maintainability
- Standardize AI execution

### Related Terms

- Prompt Manager
- AI Provider
- Retrieval
- AI Generation

### Deprecated Synonyms

AI Pipeline

---

## TERM-077

### Official Name

AI Platform

### Category

AI Domain

### Definition

The AI Platform is the platform capability responsible for orchestrating every artificial intelligence function within GenLearn.

It manages AI Providers, Prompt Templates, conversational tutoring, lesson generation, quiz generation, adaptive recommendations, and AI analytics.

The AI Platform serves as the central intelligence layer of GenLearn.

### Responsibilities

- Coordinate AI capabilities
- Manage provider abstraction
- Deliver AI-powered educational experiences
- Support future AI services

### Related Terms

- AI Provider
- Prompt Manager
- AI Workflow
- Adaptive Learning Engine

### Deprecated Synonyms

AI Module

### Notes

The term **AI Platform** shall always be used throughout the handbook to reinforce GenLearn's platform-oriented architecture.

---

# Analytics Domain

The Analytics Domain defines the terminology associated with measuring, interpreting, and utilizing learner interactions within the GenLearn platform.

Unlike conventional analytics systems that focus on reporting, GenLearn's Analytics Platform continuously transforms behavioural data into actionable educational intelligence.

Analytics directly power the Adaptive Learning Engine, AI recommendations, and long-term learner modelling.

---

## TERM-078

### Official Name

Behaviour Analytics

### Category

Analytics Domain

### Definition

Behaviour Analytics is the continuous process of collecting, measuring, and interpreting learner interactions throughout the GenLearn platform.

Behavioural signals are used to understand engagement, identify learning patterns, estimate cognitive effort, and personalize future educational experiences.

### Responsibilities

- Collect behavioural data
- Support adaptive learning
- Generate learner insights
- Improve personalization

### Related Terms

- Behaviour Event
- Adaptive Profile
- Learning Session

### Deprecated Synonyms

User Analytics

---

## TERM-079

### Official Name

Behaviour Event

### Category

Analytics Domain

### Definition

A Behaviour Event is a single observable learner interaction recorded by the platform.

Examples include:

- Opening a lesson
- Answering a question
- Requesting a hint
- Uploading a document
- Starting an AI conversation
- Completing an assessment
- Revising a flashcard

Behaviour Events form the raw data used by the Analytics Platform.

### Responsibilities

- Capture learner interactions
- Generate behavioural history
- Support adaptive scoring

### Related Terms

- Behaviour Analytics
- Learning Session
- Event Stream

### Deprecated Synonyms

Activity Log

---

## TERM-080

### Official Name

Engagement Score

### Category

Analytics Domain

### Definition

The Engagement Score is a calculated indicator representing the level of learner participation and interaction within the platform.

The score is derived from multiple behavioural signals including:

- Session duration
- Lesson completion
- AI Tutor usage
- Assessment participation
- Revision frequency

Engagement is used to identify disengaged learners and recommend interventions.

### Responsibilities

- Measure engagement
- Support recommendations
- Identify inactive learners

### Related Terms

- Behaviour Analytics
- Learning Session
- Recommendation

### Deprecated Synonyms

Activity Score

---

## TERM-081

### Official Name

Learning Insight

### Category

Analytics Domain

### Definition

A Learning Insight is an interpretable observation generated by the Analytics Platform from learner behaviour and educational performance.

Examples include:

- Strong understanding of recursion
- Frequently struggles with normalization
- Learns more effectively using visual explanations
- Benefits from revision after 48 hours

Learning Insights guide AI personalization and learner feedback.

### Responsibilities

- Explain learner behaviour
- Guide recommendations
- Improve educational outcomes

### Related Terms

- Recommendation
- Behaviour Analytics
- Adaptive Profile

### Deprecated Synonyms

Learning Observation

---

## TERM-082

### Official Name

Adaptive Score

### Category

Analytics Domain

### Definition

The Adaptive Score is the platform's internal representation of a learner's current educational state.

It is calculated using multiple educational indicators including:

- Assessment performance
- Mastery
- Behaviour analytics
- Engagement
- Revision history
- AI interactions

Adaptive Scores are continuously recalculated throughout the learner's journey.

### Responsibilities

- Drive adaptive learning
- Personalize difficulty
- Improve recommendations

### Related Terms

- Adaptive Profile
- Mastery
- Recommendation

### Deprecated Synonyms

Learning Score

---

## TERM-083

### Official Name

Knowledge Gap

### Category

Analytics Domain

### Definition

A Knowledge Gap represents a concept, topic, or skill that the platform determines requires additional learning or revision.

Knowledge Gaps are identified through assessments, behavioural analytics, AI interactions, and learner history.

Knowledge Gaps are primary inputs to recommendation generation.

### Responsibilities

- Identify weak concepts
- Recommend revision
- Improve learning outcomes

### Related Terms

- Mastery
- Recommendation
- Adaptive Score

### Deprecated Synonyms

Weak Topic

---

## TERM-084

### Official Name

Learning Analytics Platform

### Category

Analytics Domain

### Definition

The Learning Analytics Platform is the platform capability responsible for collecting, processing, analyzing, and presenting educational data generated throughout GenLearn.

It provides analytical services to learners, administrators, and AI systems while maintaining privacy and security standards.

### Responsibilities

- Process educational data
- Generate dashboards
- Support adaptive learning
- Produce educational reports

### Related Terms

- Behaviour Analytics
- AI Platform
- Adaptive Learning Engine

### Deprecated Synonyms

Analytics Module

### Notes

The official term shall always be **Learning Analytics Platform** rather than "Analytics Dashboard" because it represents a reusable platform capability rather than a single user interface.
---

# Platform Domain

The Platform Domain defines the shared capabilities, services, and operational concepts that collectively form the GenLearn platform.

Unlike feature-specific terminology, Platform Domain concepts describe reusable capabilities that support multiple business domains simultaneously.

These concepts promote modularity, scalability, and long-term maintainability.

---

## TERM-085

### Official Name

Platform

### Category

Platform Domain

### Definition

The Platform is the complete ecosystem of interconnected services, APIs, AI capabilities, databases, and user interfaces that together provide the GenLearn experience.

A Platform is more than an application; it is a foundation upon which educational services are built and evolved.

### Responsibilities

- Host business capabilities
- Provide shared infrastructure
- Coordinate platform services
- Support future expansion

### Related Terms

- Platform Capability
- Platform Service
- Workspace

### Deprecated Synonyms

- Website
- Application

### Notes

Throughout the handbook, GenLearn shall always be referred to as a Platform rather than merely a Website or Application.

---

## TERM-086

### Official Name

Platform Capability

### Category

Platform Domain

### Definition

A Platform Capability is a high-level business function provided by GenLearn.

Capabilities represent what the platform can do rather than how it is implemented.

Examples include:

- Authentication
- AI Tutoring
- Lesson Generation
- Document Processing
- Adaptive Learning
- Analytics

Each capability may consist of multiple services working together.

### Responsibilities

- Deliver business functionality
- Organize services
- Support modular architecture

### Related Terms

- Platform Service
- AI Platform
- Knowledge Platform

### Deprecated Synonyms

- Feature
- Module

---

## TERM-087

### Official Name

Platform Service

### Category

Platform Domain

### Definition

A Platform Service is an independently deployable software component responsible for providing a specific technical capability.

Examples include:

- Authentication Service
- Notification Service
- AI Service
- Analytics Service
- Document Service

Platform Services expose functionality through well-defined APIs.

### Responsibilities

- Execute platform logic
- Provide reusable APIs
- Support scalability

### Related Terms

- Platform Capability
- API
- Microservice

### Deprecated Synonyms

Backend Module

---

## TERM-088

### Official Name

Workspace

### Category

Platform Domain

### Definition

A Workspace is the personalized environment through which a User interacts with the platform.

Different Workspaces may exist for different user roles.

Examples include:

- Student Workspace
- Administrator Workspace

Each Workspace aggregates the capabilities relevant to its intended users.

### Responsibilities

- Organize user interactions
- Personalize experiences
- Present platform capabilities

### Related Terms

- Dashboard
- User
- Role

### Deprecated Synonyms

Portal

---

## TERM-089

### Official Name

Dashboard

### Category

Platform Domain

### Definition

A Dashboard is the primary interface within a Workspace that presents personalized information, actions, analytics, and recommendations.

Dashboards provide summaries rather than complete functionality.

### Responsibilities

- Display insights
- Provide navigation
- Highlight important information

### Related Terms

- Workspace
- Learning Analytics Platform
- Recommendation

### Deprecated Synonyms

Home Screen

---

## TERM-090

### Official Name

Notification

### Category

Platform Domain

### Definition

A Notification is a platform-generated message informing a User about an event, recommendation, reminder, or system update.

Notifications may be delivered through:

- In-App Messages
- Email
- Push Notifications
- Future communication channels

### Responsibilities

- Inform users
- Encourage engagement
- Deliver reminders

### Related Terms

- Platform Event
- User
- Recommendation

### Deprecated Synonyms

Alert

---

## TERM-091

### Official Name

Platform Event

### Category

Platform Domain

### Definition

A Platform Event is a significant occurrence within the system that may trigger additional processing or notifications.

Examples include:

- User Registered
- Lesson Generated
- Quiz Completed
- Document Uploaded
- Recommendation Created

Platform Events support loose coupling between platform services.

### Responsibilities

- Trigger workflows
- Enable automation
- Improve extensibility

### Related Terms

- Event Queue
- Background Job
- Platform Service

### Deprecated Synonyms

System Event

---

## TERM-092

### Official Name

Background Job

### Category

Platform Domain

### Definition

A Background Job is a task executed asynchronously outside the main user request lifecycle.

Background Jobs improve responsiveness by processing long-running operations independently.

Examples include:

- Document Processing
- Embedding Generation
- Email Delivery
- Analytics Aggregation
- AI Evaluation

### Responsibilities

- Execute asynchronous tasks
- Improve responsiveness
- Enable scalability

### Related Terms

- Queue
- Worker
- Platform Event

### Deprecated Synonyms

Async Task

---

## TERM-093

### Official Name

Configuration

### Category

Platform Domain

### Definition

Configuration represents runtime settings that determine the behaviour of the platform without requiring source code changes.

Configuration includes:

- API Keys
- Environment Variables
- AI Provider Selection
- Feature Flags
- Rate Limits

Configuration must be externalized and never hardcoded.

### Responsibilities

- Control runtime behaviour
- Improve flexibility
- Support deployment

### Related Terms

- Environment
- Feature Flag
- Provider

### Deprecated Synonyms

Settings

---

## TERM-094

### Official Name

Feature Flag

### Category

Platform Domain

### Definition

A Feature Flag is a configurable switch that enables or disables specific platform capabilities without requiring a new deployment.

Feature Flags support gradual rollouts, experimentation, and safe releases.

### Responsibilities

- Control feature availability
- Support experimentation
- Reduce deployment risk

### Related Terms

- Configuration
- Deployment
- Platform Capability

### Deprecated Synonyms

Toggle

### Notes

Feature Flags should be used for operational control rather than permanent configuration.

---

# Infrastructure Domain

The Infrastructure Domain defines the terminology associated with the deployment, operation, scalability, monitoring, and runtime environment of the GenLearn platform.

Infrastructure concepts are implementation-independent wherever possible and describe the operational capabilities required to deliver a reliable, secure, and scalable AI platform.

This domain provides the vocabulary for DevOps, deployment, cloud architecture, caching, background processing, and observability.

---

## TERM-095

### Official Name

Environment

### Category

Infrastructure Domain

### Definition

An Environment is an isolated deployment of the GenLearn platform configured for a specific purpose.

Typical environments include:

- Development
- Testing
- Staging
- Production

Each Environment maintains its own configuration, secrets, infrastructure resources, and operational settings.

### Responsibilities

- Isolate deployments
- Support testing
- Protect production systems

### Related Terms

- Configuration
- Deployment
- Secrets

### Deprecated Synonyms

Server

---

## TERM-096

### Official Name

Container

### Category

Infrastructure Domain

### Definition

A Container is an isolated runtime package containing an application together with its dependencies, runtime, and configuration required for execution.

Containers provide consistency across development, testing, and production environments.

Within GenLearn, all major platform services should be containerized using Docker.

### Responsibilities

- Package applications
- Standardize deployments
- Improve portability

### Related Terms

- Service Instance
- Docker
- Deployment

### Deprecated Synonyms

Runtime Package

---

## TERM-097

### Official Name

Cache

### Category

Infrastructure Domain

### Definition

A Cache is a temporary high-speed storage layer used to reduce latency and improve platform performance by storing frequently accessed data.

Within GenLearn, Redis serves as the primary caching technology.

Cached information may include:

- User sessions
- AI responses
- Frequently accessed lessons
- Platform configuration
- Temporary analytics

### Responsibilities

- Reduce latency
- Improve scalability
- Decrease database load

### Related Terms

- Redis
- Session
- Background Job

### Deprecated Synonyms

Temporary Storage

---

## TERM-098

### Official Name

Queue

### Category

Infrastructure Domain

### Definition

A Queue is an ordered collection of tasks awaiting asynchronous execution.

Queues enable long-running operations to execute independently of user requests.

Examples include:

- Document Processing
- Embedding Generation
- Email Delivery
- AI Evaluation
- Analytics Aggregation

Within GenLearn, BullMQ is the preferred queue implementation.

### Responsibilities

- Manage asynchronous work
- Improve responsiveness
- Increase reliability

### Related Terms

- Background Job
- Worker
- Platform Event

### Deprecated Synonyms

Task Queue

---

## TERM-099

### Official Name

Worker

### Category

Infrastructure Domain

### Definition

A Worker is a background process responsible for executing tasks received from a Queue.

Workers process computationally intensive operations independently from the main application, improving scalability and user experience.

### Responsibilities

- Execute queued jobs
- Process asynchronous tasks
- Improve system throughput

### Related Terms

- Queue
- Background Job
- Platform Event

### Deprecated Synonyms

Background Process

---

## TERM-100

### Official Name

Observability

### Category

Infrastructure Domain

### Definition

Observability is the platform capability that enables engineers to understand the internal state and behaviour of GenLearn through logs, metrics, traces, and health information.

Observability is essential for diagnosing issues, monitoring AI usage, tracking performance, and maintaining platform reliability.

### Responsibilities

- Monitor platform health
- Detect failures
- Improve operational visibility
- Support incident response

### Related Terms

- Logging
- Monitoring
- Health Check

### Deprecated Synonyms

System Monitoring

### Notes

Observability combines logging, monitoring, metrics, and tracing into a unified operational capability.