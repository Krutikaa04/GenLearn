# ==============================================================================
# PROJECT CONTEXT FOR CLAUDE
# ==============================================================================
#
# Project Name:
# GenLearn
#
# Full Title:
# GenLearn – A Real-Time Adaptive Learning Platform Using Generative AI
# and Behavioral Feedback
#
# Owners:
# - Rishi Mahajan
# - Krutika Wagh
#
# Current Version:
# Planning Phase
#
# Document Version:
# 1.0
#
# Last Updated:
# June 2026
#
# ==============================================================================
#
# IMPORTANT
#
# This document is the SINGLE SOURCE OF TRUTH for the GenLearn project.
#
# Before making ANY architectural, implementation or documentation decision,
# read this document completely.
#
# Do NOT assume anything that contradicts this document.
#
# If this document conflicts with generated code,
# THIS DOCUMENT WINS.
#
# ==============================================================================

# AI OPERATING DIRECTIVE

You are joining an EXISTING enterprise software project.

This project has already gone through weeks of architectural planning,
technology evaluation, system design, documentation planning,
feature planning and implementation strategy discussions.

You are NOT starting a new project.

You are CONTINUING an existing project.

Treat this repository as though an experienced software architecture team
has already completed the design phase.

Your responsibility is to continue the work,
not redesign it.

Every architectural decision documented here has been intentionally made
after evaluating alternatives.

Do NOT replace technologies.

Do NOT simplify the architecture.

Do NOT redesign the frontend.

Do NOT remove features.

Do NOT introduce shortcuts.

Do NOT replace enterprise architecture with beginner architecture.

Whenever unsure,

FOLLOW THIS DOCUMENT.

==============================================================================

# NON-NEGOTIABLE DECISIONS

The following decisions are LOCKED.

These decisions must NEVER be changed unless explicitly instructed by
the project owners.

────────────────────────────────────────────────────────

PROJECT

Name:

GenLearn

Full Name:

GenLearn
A Real-Time Adaptive Learning Platform Using Generative AI
and Behavioral Feedback

────────────────────────────────────────────────────────

PROJECT CATEGORY

This is a

Generative AI Project

NOT

• CRUD Project

NOT

• LMS

NOT

• Simple Learning Portal

The AI layer is the heart of the platform.

Every major feature should leverage AI whenever appropriate.

────────────────────────────────────────────────────────

ARCHITECTURE

Architecture is LOCKED.

We use

Domain Driven Design

Clean Architecture

Repository Pattern

Provider Abstraction

Modular Monolith

Event Driven Architecture

Future Microservice Ready

These decisions MUST remain.

────────────────────────────────────────────────────────

BACKEND

Backend is

NestJS

TypeScript

Do NOT replace with Express.

Express was considered during initial planning.

NestJS was selected because:

• Modular Architecture
• Dependency Injection
• Enterprise conventions
• Better scalability
• Better testing
• Better maintainability

This decision is final.

────────────────────────────────────────────────────────

AI PLATFORM

AI must exist as an independent service.

Technology:

FastAPI

Python

LangChain

Never merge AI logic into the backend.

Backend orchestrates.

AI generates intelligence.

────────────────────────────────────────────────────────

DATABASE

Primary Database

MongoDB Atlas

Reasons:

• Flexible schema

• AI friendly

• Document storage

• Atlas Vector Search

• Better suited for RAG

• Easier evolution of data model

Supabase was evaluated.

It was intentionally rejected.

Do not replace MongoDB.

────────────────────────────────────────────────────────

CACHE

Redis is mandatory.

Redis responsibilities

• Session cache

• Queue backend

• AI response cache

• Rate limiting

• Future distributed locks

Redis is NOT the primary database.

────────────────────────────────────────────────────────

BACKGROUND JOBS

BullMQ

Mandatory.

Used for

• Embedding generation

• Document processing

• Flashcard generation

• AI analytics

• Email

• Notifications

Never execute expensive AI operations synchronously if background
processing is appropriate.

────────────────────────────────────────────────────────

CONTAINERIZATION

Docker

Mandatory.

Entire project must run using Docker Compose.

Future Kubernetes support is planned.

────────────────────────────────────────────────────────

AI PROVIDER

Current MVP

Google Gemini API

Reason:

Free tier.

Suitable for portfolio project.

Architecture must support future providers.

Provider abstraction is mandatory.

Future supported providers

• OpenAI

• Anthropic

• Groq

• Azure OpenAI

• Ollama

• Local models

Claude must never tightly couple AI implementation to Gemini.

────────────────────────────────────────────────────────

RAG

Retrieval Augmented Generation

Mandatory.

NOT OPTIONAL.

Students upload

PDF

Research papers

Notes

Lecture material

AI must answer using uploaded material.

The AI must not rely only on model knowledge.

────────────────────────────────────────────────────────

AUTHENTICATION

JWT

Refresh Tokens

RBAC

bcrypt

Role Based Access Control

Mandatory.

No Firebase Auth.

No Clerk.

No Supabase Auth.

Everything handled by NestJS.

────────────────────────────────────────────────────────

FRONTEND

The existing frontend UI created previously is considered GOOD.

The UI must remain.

Only backend integration changes.

Never redesign.

Never downgrade.

Never replace animations.

Never replace visual hierarchy.

The frontend should continue feeling like

Duolingo

+

ChatGPT

+

Modern Educational SaaS

────────────────────────────────────────────────────────

STATE MANAGEMENT

TanStack Query

React Context

TypeScript

Preferred.

────────────────────────────────────────────────────────

DOCUMENTATION

Documentation first.

Implementation second.

Every architectural decision must be documented.

Every new feature requires documentation.

Every major decision requires an ADR.

This handbook is considered part of the product.

==============================================================================

# EXECUTIVE SUMMARY

GenLearn is an enterprise-grade AI-native adaptive learning platform.

It combines

Generative AI

Behavioral Analytics

Adaptive Learning

Retrieval Augmented Generation

Document Intelligence

AI Tutoring

Knowledge Retrieval

Educational Analytics

into one unified platform.

The project has been designed with three equally important goals.

1.

Final Year Project

The project should be technically superior to typical academic projects.

2.

Portfolio Project

It should demonstrate senior-level software engineering capability.

3.

Research Platform

The architecture should support research publication in Generative AI
for Education.

==============================================================================

# PROJECT VISION

Traditional e-learning systems deliver static educational content.

Every student receives exactly the same explanation,
same lesson,
same quiz,
same learning path.

GenLearn changes this.

Every learner receives

personalized lessons

personalized quizzes

personalized tutoring

personalized recommendations

personalized revision

based on

their performance

their behavior

their uploaded study material

their learning history

their weaknesses

their strengths

their goals.

AI is no longer a chatbot.

AI becomes a personal learning companion.

==============================================================================

# PROJECT MISSION

Build an AI-first educational platform that demonstrates how modern
Generative AI technologies can improve learning outcomes through
adaptive instruction, behavioral analytics and Retrieval Augmented
Generation while following enterprise software architecture principles.

==============================================================================

# PROJECT OBJECTIVES

Primary Objectives

• Build a real enterprise-grade application.

• Demonstrate Domain Driven Design.

• Demonstrate Clean Architecture.

• Demonstrate AI integration.

• Demonstrate RAG.

• Demonstrate behavioral analytics.

• Demonstrate adaptive learning.

• Demonstrate cloud-native architecture.

• Demonstrate scalable backend architecture.

• Demonstrate modern frontend engineering.

• Demonstrate DevOps best practices.

• Demonstrate production-ready documentation.

Secondary Objectives

• Final Year Project

• Hackathon Submission

• Research Publication

• GitHub Portfolio

• Resume Showcase

==============================================================================

# TARGET USERS

Current MVP

Student

Administrator

Future Versions

Teacher

Parent

Institution

Organization

School

University

Enterprise Learning

==============================================================================

# CURRENT PROJECT STATUS

Current Phase

Architecture & Documentation

Implementation has NOT started.

Reason

The project follows a documentation-first methodology.

Architecture must be completed before implementation begins.

This avoids

architecture drift

technical debt

poor module boundaries

inconsistent APIs

documentation gaps.

==============================================================================

END OF PART 1
Continue with:
PART 2 — Complete Project History, Decision Log & Technology Selection
==============================================================================
PROJECT HISTORY
==============================================================================

This section documents the evolution of the GenLearn project.

The purpose is to provide future AI assistants with the reasoning behind
every important architectural decision.

Do NOT treat this project as if it started with the current architecture.

The architecture evolved through multiple iterations.

This history explains WHY every major decision exists.

==============================================================================

PROJECT ORIGIN

The project began as a Final Year Project idea focused on applying
Generative AI in Education.

From the beginning, the project owners did NOT want to build another
traditional Learning Management System (LMS).

The goal was never to create:

• Moodle Clone
• Google Classroom Clone
• Canvas Clone
• Basic Quiz Application
• CRUD Student Portal

Instead, the objective was to create something that demonstrates
modern AI engineering while solving a meaningful educational problem.

Very early in planning, the following principles were established:

• AI must be the core of the platform.
• The project must feel like a real SaaS product.
• The architecture must resemble production software.
• Documentation quality must exceed typical student projects.
• The project should be suitable for research publication.
• The project should be suitable for hackathons.
• The project should become a portfolio centerpiece.

==============================================================================

EVOLUTION OF THE PROJECT

Version 0 — Initial Idea

The earliest concept focused on:

• AI Lesson Generation
• AI Quiz Generation
• Progress Tracking

At this stage, the project resembled a smart LMS.

However, this was considered insufficient.

Reason:

Many projects already generate lessons using ChatGPT.

There was not enough differentiation.

==============================================================================

Version 1 — Adaptive Learning

The project evolved into an adaptive learning platform.

Behavior tracking was introduced.

Instead of only storing quiz scores, the system would also observe:

• Time spent
• Number of attempts
• Hint requests
• Scroll behaviour
• Session duration

These behavioural signals would estimate learner proficiency.

The AI would dynamically adjust future lessons and quizzes.

This significantly increased the research value of the project.

==============================================================================

Version 2 — AI Tutor

The next enhancement introduced an AI Tutor.

Instead of simply generating content, the platform would support
conversational learning.

Students could ask:

"Explain recursion."

"Give another example."

"I still don't understand."

The AI would respond like a personal tutor.

This transformed GenLearn from a content generator into an
interactive learning companion.

==============================================================================

Version 3 — RAG

One of the biggest architectural decisions.

The project owners decided that relying solely on LLM knowledge was not
sufficient.

Reasons:

LLMs hallucinate.

Students often study from institution-specific material.

Teachers use different notes.

Exams follow prescribed textbooks.

Therefore:

Students should upload:

• PDFs
• Lecture Notes
• Study Material
• Research Papers
• Text Documents

The AI must learn from those documents.

The AI must answer using retrieved knowledge.

This became one of the strongest differentiators of GenLearn.

==============================================================================

Version 4 — Enterprise Architecture

Initially, a simpler Express backend was considered.

However, after evaluating long-term maintainability, the decision was
made to redesign the architecture before implementation.

The project moved toward:

Domain Driven Design

Clean Architecture

Repository Pattern

Provider Abstraction

Modular Monolith

Event Driven Design

Future Microservice Readiness

This significantly increased engineering quality.

==============================================================================

Version 5 — Documentation First

One of the most important project decisions.

Instead of writing code immediately,
the owners decided to completely document the architecture.

Reason:

Large AI-assisted projects quickly become inconsistent without
documentation.

The project therefore follows:

Documentation

↓

Architecture

↓

Feature Specifications

↓

Implementation

↓

Testing

↓

Deployment

Documentation is considered a core deliverable,
not an afterthought.

==============================================================================

TECHNOLOGY EVALUATION

The following sections explain every major technology decision.

==============================================================================

FRONTEND

Initially considered:

React

Next.js

Angular

Vue

Decision:

React + Vite

Reason:

• Faster startup
• Simpler deployment
• Excellent ecosystem
• Perfect for SPA architecture
• Easier Claude-assisted development
• Strong TypeScript support

Next.js was intentionally rejected.

Reason:

The project does not require server-side rendering.

The additional complexity was unnecessary.

==============================================================================

BACKEND

Initially considered:

Express

NestJS

Fastify

Decision:

NestJS

Reasons:

Enterprise architecture

Dependency Injection

Excellent modularity

Guards

Interceptors

Pipes

Testing support

Clear project organization

Scalable codebase

Express remains underneath NestJS,
providing the same performance benefits while adding structure.

==============================================================================

AI PLATFORM

Initially considered:

Python Flask

FastAPI

Node.js

Decision:

FastAPI

Reasons:

Best Python developer experience

Excellent async support

Automatic OpenAPI generation

AI ecosystem compatibility

LangChain support

High performance

Clean architecture

The AI Platform must remain independent of the backend.

==============================================================================

DATABASE

Initially considered:

PostgreSQL

Supabase

Firebase

MongoDB Atlas

Decision:

MongoDB Atlas

Reasons:

Flexible schema

AI friendly

Excellent document model

Atlas Vector Search

Natural support for uploaded educational material

Easy evolution

Excellent cloud tooling

==============================================================================

WHY SUPABASE WAS REJECTED

Supabase is an excellent Backend-as-a-Service.

However, GenLearn is not a CRUD application.

Reasons for rejection:

Document-heavy workload

Vector Search requirements

Complex AI metadata

Flexible schemas

Independent backend architecture

Avoiding platform coupling

The team wanted complete backend ownership.

Therefore MongoDB Atlas became the better choice.

==============================================================================

WHY POSTGRESQL WAS REJECTED

PostgreSQL is technically excellent.

However,

GenLearn stores:

AI conversations

Prompt metadata

Large generated lessons

Uploaded document metadata

Knowledge chunks

Embedding references

Behaviour events

Nested analytics

MongoDB models these naturally.

Relational modelling would introduce unnecessary complexity.

==============================================================================

CACHE LAYER

Decision:

Redis

Reasons:

Caching

Rate limiting

Sessions

Queue backend

Temporary AI cache

Future distributed locking

Redis is mandatory.

==============================================================================

BACKGROUND PROCESSING

Decision:

BullMQ

Reasons:

Reliable

Redis integration

Excellent TypeScript support

Retries

Dead-letter queues

Scheduling

Suitable for:

Embedding generation

Document processing

Flashcard generation

Summary generation

Email delivery

Analytics aggregation

==============================================================================

CONTAINERIZATION

Decision:

Docker

Reasons:

Identical environments

Simple onboarding

Deployment consistency

Future Kubernetes support

Every service must be containerized.

==============================================================================

AI PROVIDER DECISION

The project owners discussed OpenAI extensively.

OpenAI would provide excellent output quality.

However,

The project is currently a portfolio project.

API cost matters.

Decision:

Gemini API

Reason:

Generous free tier.

Strong model quality.

Easy migration later.

IMPORTANT

Architecture must remain provider independent.

Claude must never tightly couple the implementation
to Gemini.

Future providers include:

OpenAI

Anthropic

Groq

Azure OpenAI

Local models

==============================================================================

PROVIDER ABSTRACTION

This decision was intentionally made very early.

Never call Gemini directly from business logic.

Instead

AI Platform

↓

Provider Interface

↓

Gemini Provider

Future

↓

OpenAI Provider

↓

Anthropic Provider

↓

Groq Provider

↓

Ollama Provider

This allows changing providers without changing business logic.

==============================================================================

FRONTEND DECISION

A frontend mock application was previously generated.

The project owners liked:

Animations

Visual hierarchy

Student experience

Dashboard

Landing page

Tutor experience

Therefore

The frontend must remain visually identical.

Implementation changes are allowed.

Visual redesign is NOT.

==============================================================================

END OF PART 2

Continue with

PART 3

Complete Architecture Overview
Backend
Frontend
AI Platform
Database
Redis
BullMQ
Docker
DDD
Clean Architecture
Provider Abstraction
RAG
Adaptive Learning
==============================================================================
COMPLETE ARCHITECTURE OVERVIEW
==============================================================================

This section defines the complete technical architecture of GenLearn.

This architecture has already been finalized.

Future implementation MUST follow this architecture.

Do NOT redesign.

Do NOT simplify.

Do NOT replace architectural patterns.

==============================================================================

ARCHITECTURAL PHILOSOPHY

GenLearn is NOT a CRUD application.

It is an AI-native enterprise software platform.

The architecture has been intentionally designed to resemble
real-world SaaS products.

Every layer has a clearly defined responsibility.

Every module has a bounded context.

Every service owns a single responsibility.

The platform follows:

• Domain Driven Design
• Clean Architecture
• Repository Pattern
• Event Driven Architecture
• Provider Abstraction
• SOLID Principles
• Modular Monolith (MVP)
• Future Microservice Ready

==============================================================================

SYSTEM ARCHITECTURE

The complete platform consists of five primary systems.

                    Users
                      │
                      ▼
              React Frontend
                      │
                      ▼
              NestJS Backend API
          ┌───────────┼────────────┐
          │           │            │
          ▼           ▼            ▼
     MongoDB       Redis       FastAPI AI
       Atlas                     Platform
                                   │
                     ┌─────────────┼─────────────┐
                     ▼             ▼             ▼
                 Gemini API   Atlas Vector   LangChain
                                 Search

The frontend NEVER communicates directly with:

• MongoDB
• Redis
• Gemini
• LangChain
• Vector Search

Everything flows through the backend.

==============================================================================

WHY THIS ARCHITECTURE

The architecture separates concerns.

Frontend

↓

Presentation

Backend

↓

Business Orchestration

AI Platform

↓

Intelligence

MongoDB

↓

Persistence

Redis

↓

Performance

Each layer owns ONE responsibility.

==============================================================================

LAYERED ARCHITECTURE

Layer 1

Presentation Layer

Technology

React

Responsibilities

• User Interface
• Navigation
• Forms
• API Calls
• State Management
• Animations

Never:

• Generate prompts
• Access database
• Call Gemini
• Implement business logic

==============================================================================

Layer 2

Application Layer

Technology

NestJS

Responsibilities

• Authentication
• Authorization
• API orchestration
• Validation
• Business workflows
• Event publishing
• Queue management

Never:

• Generate AI responses
• Store frontend state
• Contain prompt templates

==============================================================================

Layer 3

Domain Layer

Technology

Pure TypeScript

Responsibilities

Business Rules

Entities

Aggregates

Value Objects

Domain Services

Domain Events

The Domain Layer must remain framework independent.

This is one of the most important architectural rules.

==============================================================================

Layer 4

AI Platform

Technology

Python

FastAPI

LangChain

Responsibilities

AI Tutor

Lesson Generation

Quiz Generation

RAG

Flashcards

Summaries

Recommendations

Adaptive Learning

Context Assembly

Prompt Management

Provider Abstraction

Never:

Authenticate users.

Store user sessions.

Implement RBAC.

==============================================================================

Layer 5

Infrastructure

Responsibilities

Persistence

Caching

Queues

Logging

Monitoring

Object Storage

External APIs

Email

==============================================================================

DOMAIN DRIVEN DESIGN

The platform follows Domain Driven Design.

Bounded Contexts

Identity

Learning

Assessment

Knowledge

AI

Analytics

Administration

Each bounded context owns:

Entities

Repositories

Services

Events

DTOs

Controllers

==============================================================================

MODULAR MONOLITH

The MVP is NOT microservices.

It is a

Modular Monolith.

Reason

Simpler deployment.

Lower complexity.

Faster development.

Better debugging.

Lower infrastructure cost.

However

Every module is designed so it can later become an independent service.

==============================================================================

BACKEND MODULES

The backend contains:

Authentication

Users

Students

Lessons

Quizzes

Assessments

Progress

Documents

Flashcards

Recommendations

Analytics

Notifications

Administration

Shared

Infrastructure

Every module owns:

Controller

Service

Repository

DTOs

Validators

Interfaces

Events

Tests

==============================================================================

REQUEST FLOW

Every request follows exactly this lifecycle.

User

↓

React

↓

API Client

↓

NestJS Controller

↓

Guard

↓

Validation

↓

Application Service

↓

Domain Service

↓

Repository

↓

MongoDB

↓

Application Service

↓

Response DTO

↓

Frontend

No shortcuts.

==============================================================================

AI REQUEST FLOW

When AI is required:

Frontend

↓

NestJS

↓

AI Service

↓

Context Builder

↓

Prompt Manager

↓

RAG Engine (optional)

↓

Provider Adapter

↓

Gemini

↓

Response Validator

↓

NestJS

↓

Frontend

Never bypass the AI Platform.

==============================================================================

PROVIDER ABSTRACTION

One of the most important architectural decisions.

Never write code like:

Gemini.generate(...)

Instead:

AI Provider Interface

↓

Gemini Provider

Later

↓

OpenAI Provider

↓

Anthropic Provider

↓

Groq Provider

↓

Ollama Provider

Business logic must NEVER know which provider is used.

==============================================================================

REPOSITORY PATTERN

Repositories own persistence.

Only repositories communicate with MongoDB.

Services NEVER execute MongoDB queries directly.

Controllers NEVER execute MongoDB queries.

Frontend NEVER executes MongoDB queries.

==============================================================================

EVENT DRIVEN ARCHITECTURE

Business events include:

UserRegistered

LessonGenerated

QuizCompleted

DocumentUploaded

KnowledgeIndexed

FlashcardsGenerated

AdaptiveProfileUpdated

RecommendationGenerated

Events are published AFTER successful transactions.

BullMQ workers consume these events asynchronously.

==============================================================================

REDIS RESPONSIBILITIES

Redis is NOT a database.

Redis stores temporary information.

Current responsibilities:

Authentication sessions

Refresh token cache

Rate limiting

Queue backend

AI response cache

Dashboard cache

Future:

Distributed locks

Leader election

Real-time collaboration

==============================================================================

BULLMQ RESPONSIBILITIES

BullMQ executes expensive tasks.

Examples

Document chunking

Embedding generation

Flashcard generation

Summary generation

AI analytics

Email delivery

Notification delivery

Retry processing

Never block user requests for expensive background work.

==============================================================================

MONGODB RESPONSIBILITIES

MongoDB Atlas is the source of truth.

Stores

Users

Profiles

Lessons

Quizzes

Attempts

Progress

Documents

Chunks

Flashcards

AI Chats

Analytics

Audit Logs

System Metrics

MongoDB is the only persistent database.

==============================================================================

ATLAS VECTOR SEARCH

Vector Search is mandatory.

Pipeline

Upload Document

↓

Extract Text

↓

Chunk

↓

Generate Embeddings

↓

Store Embeddings

↓

Semantic Search

↓

Context Retrieval

↓

LLM

This is the foundation of RAG.

==============================================================================

RAG ARCHITECTURE

The RAG pipeline works as follows.

Student uploads document.

↓

Text extraction.

↓

Chunking.

↓

Embedding generation.

↓

Store embeddings.

↓

Student asks question.

↓

Relevant chunks retrieved.

↓

Prompt assembled.

↓

Gemini receives:

Question

+

Retrieved Context

↓

Answer generated.

The AI should answer using uploaded material whenever possible.

==============================================================================

ADAPTIVE LEARNING ENGINE

Adaptive learning is one of the primary differentiators.

The engine evaluates:

Quiz Scores

Time per Question

Attempts

Hint Requests

Lesson Completion

AI Tutor Usage

Revision Frequency

Scroll Behaviour

Session Duration

These signals estimate learner mastery.

Future lessons become easier or harder accordingly.

==============================================================================

AI TUTOR

The tutor is conversational.

Responsibilities

Answer questions.

Explain concepts.

Suggest revision.

Recommend lessons.

Guide learners.

Encourage deeper understanding.

The tutor should behave like an experienced teacher,
not a search engine.

==============================================================================

LESSON GENERATION

Inputs

Topic

Difficulty

Learning Goal

Student Profile

Adaptive Profile

Optional RAG Context

Outputs

Lesson

Examples

Summary

Key Points

Revision Questions

==============================================================================

QUIZ GENERATION

Question Types

MCQ

True/False

Fill in the blanks

Short Answer

Scenario Based

Difficulty adapts based on student performance.

==============================================================================

FLASHCARD GENERATION

Generated from

Lessons

Documents

Summaries

Tutor Sessions

Future:

Spaced repetition support.

==============================================================================

SUMMARY GENERATION

Generate:

Short summary

Exam revision notes

Key concepts

Important definitions

Takeaways

==============================================================================

BEHAVIOUR ANALYTICS

Every learning action generates analytics.

Examples

Lesson viewed.

Lesson completed.

Quiz started.

Quiz completed.

Hint requested.

Tutor opened.

Tutor message sent.

Document uploaded.

Flashcards reviewed.

Analytics become inputs for adaptive learning.

==============================================================================

SECURITY MODEL

Authentication

↓

Authorization

↓

Validation

↓

Business Logic

↓

Persistence

Security is enforced before business logic executes.

==============================================================================

SCALABILITY STRATEGY

Current

Modular Monolith

↓

Future

Independent Services

↓

Container Orchestration

↓

Horizontal Scaling

The architecture is intentionally designed for future growth.

==============================================================================

END OF PART 3

Continue with

PART 4

Complete AI Platform

Prompt Engineering

Context Builder

RAG Internals

Gemini Integration

Adaptive Engine

Evaluation

Token Tracking

Cost Strategy

Future AI Roadmap
==============================================================================
AI PLATFORM OVERVIEW
==============================================================================

The AI Platform is the heart of GenLearn.

The backend manages the application.

The frontend manages the user experience.

The AI Platform manages intelligence.

This separation is intentional.

The AI Platform must always remain independently deployable.

It should be possible to scale the AI Platform without scaling the
backend.

Likewise, the backend should continue operating even if AI services are
temporarily unavailable.

==============================================================================

AI PLATFORM GOALS

The AI Platform exists to deliver intelligent educational experiences.

Its responsibilities include:

• AI Lesson Generation
• AI Tutor
• AI Quiz Generation
• Adaptive Learning
• Retrieval Augmented Generation (RAG)
• Flashcard Generation
• Summary Generation
• Personalized Recommendations
• Learning Path Suggestions
• AI Analytics
• Token Usage Tracking
• Provider Abstraction

Anything involving intelligence belongs inside this platform.

==============================================================================

AI PHILOSOPHY

One of the most important design principles.

The AI should NEVER behave like ChatGPT.

The AI should behave like an experienced teacher.

Good AI response:

──────────────────────────

Concept

↓

Simple Explanation

↓

Example

↓

Real-world Analogy

↓

Key Points

↓

Practice Question

↓

Next Topic Recommendation

──────────────────────────

The goal is teaching.

Not answering.

==============================================================================

AI PLATFORM MODULES

The AI service is divided into independent modules.

ai-service/

├── api/
├── providers/
├── prompts/
├── context/
├── rag/
├── embeddings/
├── tutor/
├── lessons/
├── quizzes/
├── flashcards/
├── summaries/
├── adaptive/
├── recommendations/
├── analytics/
├── evaluation/
├── workers/
├── shared/
└── config/

Each module owns one responsibility.

==============================================================================

WORKFLOW ROUTER

Every incoming request first reaches the Workflow Router.

Example

Generate Lesson

↓

Lesson Generator

Generate Quiz

↓

Quiz Generator

Tutor Question

↓

Tutor

Flashcards

↓

Flashcard Generator

Summary

↓

Summary Generator

Recommendations

↓

Recommendation Engine

Adaptive Score

↓

Adaptive Engine

This keeps the AI Platform modular.

==============================================================================

PROMPT MANAGER

Prompt engineering is NOT hardcoded.

Prompt templates are first-class assets.

Responsibilities

Select template.

Inject variables.

Insert RAG context.

Insert adaptive profile.

Insert difficulty.

Insert system instructions.

Insert formatting rules.

Future:

Prompt versioning.

Prompt A/B testing.

Prompt analytics.

Prompt optimization.

==============================================================================

PROMPT DESIGN PHILOSOPHY

Prompts should never simply ask:

"Explain recursion."

Instead:

You are an experienced computer science teacher.

The learner is studying recursion.

Difficulty:
Intermediate.

Learning goal:
Understand recursion conceptually.

Teaching style:

Explain

↓

Example

↓

Analogy

↓

Common mistakes

↓

Summary

↓

Practice Question

↓

Next Topic

Every prompt follows structured educational pedagogy.

==============================================================================

CONTEXT BUILDER

One of the most important components.

The Context Builder gathers everything required before AI inference.

Possible context:

Student Profile

Learning Goal

Current Topic

Difficulty

Adaptive Score

Quiz History

Conversation History

Retrieved Documents

Uploaded Notes

Prompt Template

System Instructions

The provider receives ONE assembled context object.

==============================================================================

RETRIEVAL AUGMENTED GENERATION (RAG)

RAG is mandatory.

This is one of the strongest differentiators of GenLearn.

Pipeline

Student uploads PDF

↓

Extract text

↓

Clean text

↓

Chunk text

↓

Generate embeddings

↓

Store vectors

↓

Student asks question

↓

Semantic Search

↓

Top-K Chunks

↓

Context Builder

↓

Prompt Manager

↓

Gemini

↓

Grounded Answer

==============================================================================

TEXT EXTRACTION

Supported formats

PDF

DOCX

TXT

Markdown

Future

PowerPoint

Images (OCR)

EPUB

Extraction must preserve headings whenever possible.

==============================================================================

DOCUMENT CHUNKING

Documents are split into manageable chunks.

Chunks should:

Maintain context.

Avoid sentence breaks.

Preserve paragraph meaning.

Store metadata.

Metadata includes:

Document ID

Page

Heading

Section

Chunk Index

==============================================================================

EMBEDDINGS

Embedding generation is asynchronous.

Pipeline

Upload

↓

Queue

↓

Worker

↓

Embedding Model

↓

Vector Storage

↓

Ready

Embedding generation must never block uploads.

==============================================================================

VECTOR DATABASE

Current Decision

MongoDB Atlas Vector Search

Reasons

Integrated platform.

No additional infrastructure.

Suitable for MVP.

Future support

Pinecone

Qdrant

Weaviate

ChromaDB

Provider abstraction should hide vector implementation.

==============================================================================

SEMANTIC SEARCH

When the learner asks:

"Explain recursion from my uploaded notes."

System performs

Embedding Search

↓

Retrieve Relevant Chunks

↓

Rank

↓

Remove duplicates

↓

Context Builder

↓

LLM

The AI should answer from retrieved knowledge first.

==============================================================================

AI TUTOR

The tutor is persistent.

Conversation history matters.

The tutor should:

Remember earlier questions.

Avoid repeating itself.

Escalate explanations gradually.

Recommend revision.

Encourage learner engagement.

Never simply dump information.

==============================================================================

LESSON GENERATION

Input

Topic

Difficulty

Learning Goal

Adaptive Score

Optional Documents

Output

Learning Objectives

Concept Explanation

Examples

Analogies

Code Samples (if relevant)

Summary

Practice Questions

Revision Notes

==============================================================================

QUIZ GENERATION

Question Types

MCQ

True/False

Fill Blanks

Scenario

Coding

Subjective

Difficulty

Beginner

Intermediate

Advanced

Adaptive Learning decides which level to generate.

==============================================================================

FLASHCARD GENERATION

Flashcards generated from

Lessons

Uploaded Notes

Tutor Sessions

Summaries

Future

Spaced repetition scheduling.

==============================================================================

SUMMARY GENERATION

Outputs

Short Summary

Detailed Summary

Revision Notes

Exam Notes

Cheat Sheet

Mind Map Structure (future)

==============================================================================

RECOMMENDATION ENGINE

Recommendations use

Adaptive Score

Quiz Performance

Behaviour Events

Learning Goals

Weak Topics

Document Topics

Future recommendations include

Videos

Research Papers

Exercises

==============================================================================

ADAPTIVE LEARNING ENGINE

One of the biggest research contributions.

Inputs

Quiz Scores

Attempts

Time Per Question

Hint Usage

Session Duration

AI Tutor Usage

Lesson Completion

Revision Frequency

Outputs

Mastery Score

Difficulty Recommendation

Learning Path

Suggested Revision

Weak Topics

Strong Topics

==============================================================================

BEHAVIOURAL ANALYTICS

Every interaction becomes a signal.

Examples

Lesson opened

Lesson completed

Question answered

Hint requested

AI Tutor used

Document uploaded

Flashcards reviewed

Session ended

The adaptive engine consumes these events.

==============================================================================

AI RESPONSE VALIDATION

Every AI response must be validated.

Checks include

JSON Schema

Required Fields

Formatting

Safety

Length

Educational Completeness

Responses failing validation should be retried.

==============================================================================

TOKEN TRACKING

Track

Input Tokens

Output Tokens

Latency

Estimated Cost

Provider

Model Version

Workflow

User

This enables future cost optimization.

==============================================================================

AI COST STRATEGY

Current Goal

Near-zero operational cost.

Current Provider

Gemini Free Tier.

Architecture allows switching providers.

Future

Gemini Pro

OpenAI

Anthropic

Groq

Azure OpenAI

Claude must never tightly couple code to Gemini.

==============================================================================

AI ANALYTICS

Track

Most used prompts

Most requested topics

Tutor usage

Lesson generation

Quiz generation

Flashcards

Token consumption

Latency

Failure rates

These analytics improve future prompt optimization.

==============================================================================

FAILURE STRATEGY

If AI fails

Retry

↓

Fallback Provider (future)

↓

Cached Response (if appropriate)

↓

Graceful Error

The application should continue functioning.

==============================================================================

FUTURE AI ROADMAP

Version 2

Model Routing

Choose best model per task.

Version 3

Multi-Agent Architecture

Tutor Agent

Quiz Agent

Planner Agent

Research Agent

Revision Agent

Version 4

Voice Tutor

Speech Recognition

Text-to-Speech

Real-time Tutoring

==============================================================================

MOST IMPORTANT AI RULES

• AI Platform remains independent.

• Never call Gemini from frontend.

• Never embed prompts inside controllers.

• Never bypass Provider Abstraction.

• Prompt templates remain external.

• RAG is preferred over model memory.

• AI should teach, not answer.

• AI responses must be validated.

• Behaviour drives personalization.

• AI should evolve without changing business logic.

==============================================================================

END OF PART 4

Continue with

PART 5

Database Design

MongoDB Collections

Redis Strategy

Caching

Indexes

Repositories

Data Lifecycle

Persistence Philosophy
==============================================================================
DATABASE & PERSISTENCE PHILOSOPHY
==============================================================================

The persistence layer of GenLearn is designed around the Domain Model.

The database is NOT the application.

The database stores business state.

Business rules exist inside the Domain Layer.

Persistence exists only to store and retrieve domain state.

Never put business logic inside MongoDB models.

Never bypass repositories.

Never query MongoDB directly from controllers.

Never query MongoDB directly from frontend code.

==============================================================================

DATABASE SELECTION

Primary Database

MongoDB Atlas

Current Status

LOCKED

This decision has already been made after evaluating multiple
alternatives.

Reasons

• Flexible schema
• Excellent for AI applications
• Native document model
• Atlas Vector Search
• Easy cloud deployment
• Excellent TypeScript support
• Easy schema evolution
• Better handling of generated AI content

==============================================================================

DATABASE RESPONSIBILITIES

MongoDB stores every piece of persistent business data.

Examples

Users

Student Profiles

Lessons

Generated Quizzes

Quiz Attempts

Learning Progress

Behaviour Events

Uploaded Documents

Document Chunks

Flashcards

AI Conversations

AI Messages

Recommendations

Notifications

Audit Logs

AI Usage

Prompt Metadata

System Metrics

MongoDB is the single source of truth.

==============================================================================

DATABASE PHILOSOPHY

Think in

Business Aggregates

NOT

Tables.

Every collection originates from a Domain Aggregate.

The Domain Model comes first.

Database collections come second.

Never design the database first.

==============================================================================

PRIMARY COLLECTIONS

The MVP contains the following collections.

users

student_profiles

refresh_tokens

lessons

quizzes

quiz_attempts

progress

documents

document_chunks

flashcards

summaries

recommendations

ai_conversations

ai_messages

behaviour_events

notifications

audit_logs

prompt_templates

ai_usage_logs

system_metrics

Future versions may introduce additional collections without affecting
existing modules.

==============================================================================

USERS COLLECTION

Purpose

Authentication identity.

Contains

User ID

Email

Password Hash

Role

Status

Verification State

Created At

Updated At

Rules

Email is unique.

Passwords are never stored in plain text.

Passwords use bcrypt.

==============================================================================

STUDENT PROFILE

Purpose

Educational identity.

Contains

Grade

Learning Goals

Interests

Adaptive Score

Mastery Level

Preferences

Study Statistics

Every authenticated student owns exactly one profile.

==============================================================================

LESSONS

Purpose

Store AI generated lessons.

Contains

Topic

Difficulty

Learning Objectives

Generated Content

Examples

Summary

Revision Notes

AI Metadata

Lessons are permanent educational assets.

==============================================================================

QUIZZES

Purpose

Store generated quizzes.

Contains

Question Set

Difficulty

Topic

Question Type

Generation Metadata

Reference Lesson

==============================================================================

QUIZ ATTEMPTS

Purpose

Track learner performance.

Contains

Answers

Score

Completion Time

Attempts

Hint Usage

Time Per Question

Evaluation Metadata

Quiz Attempts become input for adaptive learning.

==============================================================================

PROGRESS

Purpose

Overall learner progression.

Contains

Completion Rate

Mastery Score

Weak Topics

Strong Topics

Current Recommendations

Learning Streak

Adaptive Profile Summary

==============================================================================

DOCUMENTS

Purpose

Store uploaded learning material.

Contains

Owner

File Name

File Type

Storage Path

Upload Time

Processing Status

Document Metadata

Documents themselves may live in object storage.

MongoDB stores metadata.

==============================================================================

DOCUMENT CHUNKS

Purpose

Store processed text chunks.

Contains

Chunk

Metadata

Embedding Reference

Heading

Page Number

Document ID

Chunk Order

These are the foundation of RAG.

==============================================================================

FLASHCARDS

Purpose

Generated revision material.

Generated From

Lessons

Tutor Sessions

Uploaded Documents

Summaries

Future

Spaced repetition scheduling.

==============================================================================

AI CONVERSATIONS

Purpose

Persistent tutoring history.

Contains

Conversation ID

Student

Messages

Topic

Context

Last Updated

Future

Conversation summarization.

==============================================================================

AI MESSAGES

Purpose

Individual tutor messages.

Contains

Role

Content

Timestamp

References

Retrieved Chunks

Token Usage

==============================================================================

BEHAVIOUR EVENTS

Purpose

Analytics.

Events include

Lesson Opened

Lesson Completed

Quiz Started

Quiz Submitted

Hint Requested

Tutor Opened

Tutor Question

Flashcards Reviewed

Document Uploaded

Behaviour Events are immutable.

==============================================================================

AUDIT LOGS

Purpose

Administrative accountability.

Tracks

User Created

Role Changed

User Deleted

User Suspended

Configuration Changed

Audit Logs are immutable.

==============================================================================

ATLAS VECTOR SEARCH

Current Decision

MongoDB Atlas Vector Search

Purpose

Semantic retrieval.

Pipeline

Chunk

↓

Embedding

↓

Vector Index

↓

Similarity Search

↓

Top K Results

↓

Prompt Context

Future vector providers remain supported through abstraction.

==============================================================================

REDIS PHILOSOPHY

Redis is NOT a database.

Redis stores temporary information.

If Redis disappears,

the application should continue operating.

Only performance is affected.

==============================================================================

REDIS RESPONSIBILITIES

Authentication Cache

Refresh Tokens

Rate Limiting

BullMQ Backend

Dashboard Cache

Frequently Accessed Lessons

Recommendation Cache

Temporary AI Response Cache

Future

Real-time collaboration

Distributed locking

==============================================================================

CACHING STRATEGY

Cache only

Frequently accessed

Expensive

Temporary

Never cache permanently changing business state unless invalidation rules
exist.

==============================================================================

REPOSITORY PATTERN

Every collection has a repository.

Example

LessonRepository

QuizRepository

DocumentRepository

ProgressRepository

UserRepository

Repositories own persistence.

Services own business logic.

Controllers own HTTP.

==============================================================================

INDEXING STRATEGY

Indexes are mandatory.

Examples

Email

User ID

Topic

Timestamp

Adaptive Score

Conversation ID

Upload Date

Document ID

Quiz ID

Lesson ID

Compound indexes will be created where query performance requires them.

==============================================================================

TTL INDEXES

Temporary collections use TTL.

Examples

Password Reset Tokens

Email Verification Tokens

Temporary Upload Sessions

Cached AI Responses (optional)

==============================================================================

DATA VALIDATION

Validation exists in three layers.

DTO Validation

↓

Domain Validation

↓

MongoDB Schema Validation

Never rely on database validation alone.

==============================================================================

BACKUP STRATEGY

MongoDB Atlas Backups

Daily Snapshot

Point-in-Time Recovery

Weekly Full Backup

Monthly Archive

Future

Cross-region replication.

==============================================================================

RECOVERY STRATEGY

Recovery Priority

Authentication

↓

Student Profiles

↓

Progress

↓

Documents

↓

Lessons

↓

AI Conversations

↓

Analytics

==============================================================================

DATA RETENTION

Permanent

Lessons

Progress

Student Profiles

Documents

Flashcards

Configurable

Behaviour Events

Audit Logs

AI Usage Logs

Temporary

Password Reset Tokens

Verification Tokens

Sessions

==============================================================================

SOFT DELETE STRATEGY

Default

Soft Delete

Fields

deletedAt

deletedBy

deletionReason

Hard Delete

Only for

Expired Tokens

Temporary Sessions

Expired Cache

==============================================================================

SECURITY

Passwords

bcrypt

API Keys

Environment Variables

TLS

HTTPS

Encryption At Rest

MongoDB Atlas

Sensitive fields are never logged.

==============================================================================

MOST IMPORTANT DATABASE RULES

• MongoDB is the source of truth.

• Redis is temporary.

• Controllers never query MongoDB.

• Services never bypass repositories.

• Business logic never lives in repositories.

• AI Platform never directly modifies authentication data.

• Atlas Vector Search is mandatory for RAG.

• Collections originate from the Domain Model.

• Validation occurs before persistence.

• Database schema follows business aggregates.

==============================================================================

END OF PART 5

Continue with

PART 6

Backend Architecture

NestJS

Modules

Authentication

RBAC

Repositories

Services

DTOs

Validation

API Standards

Development Workflow
==============================================================================
BACKEND ARCHITECTURE
==============================================================================

The backend is the central orchestration layer of GenLearn.

It does NOT generate AI responses.

It does NOT contain prompt engineering.

It does NOT perform vector search.

Its responsibility is to orchestrate the application.

Think of the backend as the operating system of GenLearn.

==============================================================================

BACKEND TECHNOLOGY

Framework

NestJS

Language

TypeScript

Package Manager

pnpm (preferred)

Runtime

Node.js LTS

Validation

class-validator

class-transformer

Authentication

JWT

Refresh Tokens

bcrypt

ODM

Mongoose

API Documentation

Swagger (OpenAPI)

Testing

Jest

==============================================================================

BACKEND RESPONSIBILITIES

The backend owns:

Authentication

Authorization

RBAC

Business Workflows

REST APIs

Database Access

Repository Layer

Queue Management

Redis Communication

AI Service Orchestration

Notification Orchestration

Audit Logging

Analytics Aggregation

System Configuration

Health Checks

The backend DOES NOT own intelligence.

==============================================================================

BACKEND FOLDER STRUCTURE

backend/

src/

app.module.ts

config/

common/

modules/

identity/

students/

learning/

assessment/

knowledge/

ai/

analytics/

administration/

notifications/

shared/

database/

queues/

events/

middlewares/

interceptors/

filters/

guards/

decorators/

pipes/

utils/

tests/

Every module must follow the same structure.

==============================================================================

MODULE STRUCTURE

Example

modules/learning/

learning.module.ts

controllers/

services/

repositories/

entities/

dto/

interfaces/

events/

validators/

mappers/

tests/

No shortcuts.

==============================================================================

MODULE RESPONSIBILITIES

Identity

Authentication

JWT

RBAC

Users

Sessions

Email Verification

Password Reset

---------------------------------------------

Learning

Lessons

Recommendations

Progress

Learning History

---------------------------------------------

Assessment

Quiz Generation

Quiz Submission

Evaluation

Attempt History

---------------------------------------------

Knowledge

Documents

RAG Metadata

Flashcards

Summaries

Embeddings Metadata

---------------------------------------------

AI

Gateway to FastAPI

Prompt Requests

Response Validation

Token Tracking

Provider Metadata

---------------------------------------------

Analytics

Behaviour Events

Student Metrics

Platform Metrics

Reports

---------------------------------------------

Administration

User Management

Roles

Permissions

Audit Logs

Dashboard

==============================================================================

REQUEST LIFECYCLE

Every request follows this pipeline.

Client

↓

NestJS Controller

↓

Authentication Guard

↓

RBAC Guard

↓

Validation Pipe

↓

Application Service

↓

Domain Service

↓

Repository

↓

MongoDB

↓

Mapper

↓

Response DTO

↓

Client

Every endpoint follows this lifecycle.

==============================================================================

CONTROLLERS

Controllers should be extremely small.

Controllers only:

Receive Request

Validate DTO

Call Service

Return Response

Controllers NEVER

Contain business logic.

Contain MongoDB queries.

Call Gemini.

Generate prompts.

==============================================================================

SERVICES

Application Services orchestrate business workflows.

Responsibilities

Validate business rules

Coordinate repositories

Publish events

Invoke AI Platform

Manage transactions

Services do NOT contain persistence logic.

==============================================================================

DOMAIN SERVICES

Domain Services contain business logic.

Examples

Adaptive Learning Rules

Progress Calculation

Recommendation Logic

Mastery Evaluation

These services remain framework independent.

==============================================================================

REPOSITORIES

Repositories own persistence.

Example

UserRepository

LessonRepository

QuizRepository

ProgressRepository

DocumentRepository

Repositories never contain business rules.

==============================================================================

DTOS

Every endpoint requires DTOs.

Request DTO

Validation

Transformation

Response DTO

Never expose database entities directly.

==============================================================================

VALIDATION

Every request validates:

Required fields

Types

Ranges

Enums

Business constraints

Validation occurs before services execute.

==============================================================================

MAPPERS

Entities should never be returned directly.

Entity

↓

Mapper

↓

Response DTO

This keeps internal models independent.

==============================================================================

GUARDS

Authentication Guard

Verifies JWT.

RBAC Guard

Checks permissions.

Future

Subscription Guard

Institution Guard

==============================================================================

INTERCEPTORS

Logging

Performance

Response Mapping

Correlation IDs

Caching

==============================================================================

EXCEPTION FILTERS

Every exception returns standardized responses.

Example

{
  "success": false,
  "error": {
      "code": "...",
      "message": "...",
      "details": []
  }
}

Never leak stack traces.

==============================================================================

CONFIGURATION

Never hardcode configuration.

Use ConfigModule.

Environment Variables

JWT Secret

Redis URL

Mongo URI

Gemini Key

SMTP

Object Storage

==============================================================================

EVENTS

Every important business action publishes events.

Examples

LessonGenerated

QuizCompleted

DocumentUploaded

UserRegistered

FlashcardsGenerated

Events are processed asynchronously.

==============================================================================

QUEUE STRATEGY

BullMQ Queues

Embeddings

Flashcards

Summaries

Notifications

Email

Analytics

Recommendations

Heavy operations should be queued.

==============================================================================

LOGGING

Every request logs

Correlation ID

User

Latency

Route

Method

Status

Errors

Future

Structured JSON Logging

==============================================================================

API VERSIONING

Version

v1

Every endpoint

/api/v1/

Future versions

/api/v2/

Breaking changes require versioning.

==============================================================================

API DOCUMENTATION

Swagger

Every endpoint requires

Summary

Description

Authentication

Request Example

Response Example

Error Responses

==============================================================================

AUTHENTICATION

JWT Access Token

Short-lived

Refresh Token

Long-lived

Stored securely

Passwords

bcrypt

Never store plaintext passwords.

==============================================================================

ROLE-BASED ACCESS CONTROL

Roles

Student

Administrator

Future

Teacher

Institution

Every protected endpoint declares required roles.

==============================================================================

SECURITY

Helmet

Rate Limiting

CORS

Input Sanitization

Mongo Sanitization

XSS Protection

Request Validation

Audit Logging

==============================================================================

TESTING STRATEGY

Unit Tests

Application Services

Repositories

Controllers

Integration Tests

API Endpoints

Future

End-to-End Tests

==============================================================================

CODE QUALITY

TypeScript Strict Mode

ESLint

Prettier

Conventional Commits

Husky

Lint Staged

==============================================================================

DEVELOPMENT WORKFLOW

Every new feature follows this order.

1.

Read Handbook

↓

2.

Read Feature Specification

↓

3.

Create Domain Objects

↓

4.

Create DTOs

↓

5.

Create Repository

↓

6.

Create Service

↓

7.

Create Controller

↓

8.

Create Tests

↓

9.

Update Documentation

↓

10.

Commit

Never skip documentation.

==============================================================================

IMPLEMENTATION PRIORITY

Backend implementation order

1.

Identity

↓

2.

Learning

↓

3.

Assessment

↓

4.

Knowledge

↓

5.

AI Gateway

↓

6.

Analytics

↓

7.

Administration

This order minimizes dependency issues.

==============================================================================

MOST IMPORTANT BACKEND RULES

• Controllers remain thin.

• Services orchestrate.

• Domain Services own business rules.

• Repositories own persistence.

• DTOs validate requests.

• Guards protect endpoints.

• Events are asynchronous.

• MongoDB queries stay inside repositories.

• AI calls go through the AI Gateway.

• Every endpoint is documented.

• Every module has tests.

==============================================================================

CURRENT IMPLEMENTATION STATUS

As of this document

No production backend code has been written.

The architecture has been completed.

The handbook is still being completed.

Implementation begins only after the handbook reaches an acceptable level of completion.

==============================================================================

END OF PART 6

Continue with

PART 7

Frontend Architecture

React

Vite

Folder Structure

Routing

State Management

TanStack Query

Component Standards

Animation Philosophy

UI Preservation Rules

Frontend Development Workflow
==============================================================================
FRONTEND ARCHITECTURE
==============================================================================

The frontend is the face of GenLearn.

It is responsible for delivering an intuitive, premium, modern and highly
interactive learning experience while remaining completely separated from
business logic.

The frontend should never become responsible for AI logic,
authentication logic,
database operations,
or application orchestration.

Its responsibility is presentation.

==============================================================================

CURRENT FRONTEND STATUS

A frontend prototype already exists.

The project owners are satisfied with the current UI.

The following are considered LOCKED:

• Landing Page
• Student Dashboard
• Navigation
• User Flow
• Page Layouts
• Animations
• Visual Hierarchy
• Premium Design Language
• Overall User Experience

Implementation changes are allowed.

Visual redesigns are NOT.

==============================================================================

MOST IMPORTANT FRONTEND RULE

The frontend is NOT being rebuilt.

The frontend is being CONNECTED.

Claude must preserve:

Colors

Spacing

Typography

Animation Timing

Component Layout

Navigation Flow

Interaction Design

Only replace:

Mock APIs

Dummy Data

Placeholder AI

Temporary Authentication

==============================================================================

DESIGN PHILOSOPHY

The desired experience is inspired by

Duolingo

+

ChatGPT

+

Notion

+

Linear

+

Modern SaaS Applications

The application should feel

Fast

Clean

Minimal

Premium

Intelligent

Interactive

Educational

==============================================================================

TECHNOLOGY STACK

Framework

React

Bundler

Vite

Language

TypeScript

Styling

TailwindCSS

Animation

Framer Motion

Routing

React Router

Server State

TanStack Query

Forms

React Hook Form

Validation

Zod

Icons

Lucide React

Future

PWA

==============================================================================

FRONTEND RESPONSIBILITIES

Presentation

Routing

Animations

Forms

API Consumption

Client Validation

Optimistic Updates

Theme Management

Notifications

Loading States

Error States

Accessibility

Responsive Layouts

==============================================================================

FRONTEND MUST NEVER

Call MongoDB

Call Gemini

Generate Prompts

Perform Business Logic

Store Permanent Data

Access Redis

Implement Authentication Logic

Generate AI Responses

==============================================================================

FOLDER STRUCTURE

frontend/

src/

app/

components/

features/

pages/

layouts/

hooks/

services/

contexts/

store/

types/

utils/

constants/

assets/

styles/

animations/

routes/

Every feature should remain isolated.

==============================================================================

FEATURE MODULES

identity/

learning/

assessment/

knowledge/

tutor/

analytics/

profile/

dashboard/

administration/

Each feature owns

Components

Hooks

API Hooks

Types

Utilities

==============================================================================

ROUTING

Routes should remain simple.

Landing

/

Authentication

/login

/register

Student

/dashboard

/lessons

/quizzes

/tutor

/documents

/flashcards

/progress

/profile

Administrator

/admin

/admin/users

/admin/statistics

/admin/content

==============================================================================

LAYOUT SYSTEM

Shared Layout

Navbar

Sidebar

Page Container

Content Wrapper

Footer (Landing only)

Layouts should remain reusable.

==============================================================================

STATE MANAGEMENT

Client State

React Context

Server State

TanStack Query

Temporary UI

Component State

Never duplicate server state.

==============================================================================

API COMMUNICATION

All requests go through a centralized API client.

Frontend

↓

API Client

↓

NestJS Backend

↓

Response

Never call services directly.

==============================================================================

AUTHENTICATION FLOW

Register

↓

Backend

↓

JWT

↓

Frontend Stores Token

↓

Protected Routes

↓

Authenticated User

Refresh Tokens should be handled automatically.

==============================================================================

COMPONENT PHILOSOPHY

Components should be

Reusable

Composable

Small

Typed

Independent

Avoid large monolithic components.

==============================================================================

UI COMPONENT CATEGORIES

Base Components

Buttons

Inputs

Cards

Badges

Dialogs

Feature Components

Lesson Card

Quiz Card

Tutor Panel

Progress Graph

Flashcard Viewer

Document Viewer

Page Components

Dashboard

Lesson Screen

Quiz Screen

Tutor Screen

==============================================================================

DESIGN SYSTEM

Visual principles

Large whitespace

Rounded corners

Soft shadows

Gradient accents

Subtle animations

Accessible typography

Consistent spacing

Animations should feel smooth,
never distracting.

==============================================================================

ANIMATION PHILOSOPHY

Framer Motion is part of the product.

Animations communicate state.

Examples

Page transitions

Card hover

Modal opening

Loading skeletons

Progress updates

Tutor typing

Lesson generation

Quiz completion

Do not remove animations.

==============================================================================

LOADING EXPERIENCE

Never show blank pages.

Use

Skeletons

Progress Indicators

Animated Placeholders

Streaming Responses (future)

==============================================================================

ERROR HANDLING

Every request should have

Loading State

Success State

Empty State

Error State

Retry State

No silent failures.

==============================================================================

FORM HANDLING

React Hook Form

+

Zod

Every form validates before submission.

==============================================================================

RESPONSIVENESS

Desktop First

Tablet

Mobile

Future

PWA

Touch Optimization

==============================================================================

ACCESSIBILITY

Keyboard Navigation

ARIA Labels

Contrast Compliance

Screen Reader Support

Focus Management

Accessibility is mandatory.

==============================================================================

AI EXPERIENCE

The AI should feel conversational.

The frontend should display

Typing Indicators

Streaming Messages (future)

Context References

Suggested Follow-up Questions

Source References (for RAG)

The tutor should feel alive.

==============================================================================

DOCUMENT EXPERIENCE

Students should be able to

Upload Documents

View Processing Status

Browse Uploaded Files

Delete Files

Preview Documents

View Flashcards

Generate Summaries

Ask Questions

The document workflow should feel seamless.

==============================================================================

PROGRESS EXPERIENCE

Progress should be visual.

Examples

Charts

Progress Rings

Learning Streaks

Mastery Levels

Weak Topics

Strong Topics

Completion Timeline

==============================================================================

ADMIN EXPERIENCE

The Admin Dashboard should feel like an enterprise management console.

Capabilities include

User Management

Analytics

Document Monitoring

AI Usage

Platform Statistics

Audit Logs

==============================================================================

PERFORMANCE PRINCIPLES

Lazy Loading

Code Splitting

Image Optimization

Memoization

Virtual Lists (future)

Request Caching

Optimistic Updates

==============================================================================

SECURITY

Never store secrets.

Never expose API keys.

Never trust frontend validation.

Always assume backend validation.

==============================================================================

TESTING

Component Tests

Hook Tests

Integration Tests

Future

Playwright End-to-End Tests

==============================================================================

FRONTEND DEVELOPMENT WORKFLOW

For every feature

Read Handbook

↓

Read Feature Specification

↓

Build Components

↓

Connect APIs

↓

Handle Loading

↓

Handle Errors

↓

Add Animations

↓

Test

↓

Update Documentation

==============================================================================

MOST IMPORTANT FRONTEND RULES

• Preserve existing UI.

• Never redesign pages.

• Replace only internals.

• API-first communication.

• Components remain reusable.

• Use TanStack Query.

• Maintain premium UX.

• Every screen handles loading, success and error states.

• Keep animations smooth.

• Accessibility is mandatory.

==============================================================================

CURRENT IMPLEMENTATION STATUS

A visually complete frontend prototype exists.

The backend integration has NOT been completed.

Authentication is currently mocked.

AI functionality is currently mocked.

All dummy data will be replaced with real APIs.

The goal is for users to feel that the application looks identical,
but is now fully functional.

==============================================================================

END OF PART 7

Continue with

PART 8

Infrastructure

Docker

Docker Compose

Redis

BullMQ

Deployment

CI/CD

Environment Variables

Git Strategy

Monitoring

Logging

Cost Estimation

Production Readiness
==============================================================================
INFRASTRUCTURE & DEVOPS
==============================================================================

GenLearn is designed as a cloud-native application.

Although the initial deployment targets free-tier cloud providers,
the architecture should be capable of scaling to enterprise deployments
without requiring significant redesign.

Infrastructure decisions prioritize:

• Portability
• Reproducibility
• Scalability
• Maintainability
• Low operational cost
• Developer productivity

==============================================================================

INFRASTRUCTURE PHILOSOPHY

Infrastructure should never be tightly coupled to a specific cloud
provider.

Every major infrastructure dependency should be replaceable.

Current deployment providers have been selected based on cost and ease
of use, not because they are permanently required.

The application should be deployable on any modern cloud platform.

==============================================================================

CURRENT INFRASTRUCTURE STACK

Frontend

React + Vite

Deployment

Vercel

---------------------------------------------

Backend

NestJS

Deployment

Render

---------------------------------------------

AI Platform

FastAPI

Deployment

Render

---------------------------------------------

Database

MongoDB Atlas

Cloud Hosted

---------------------------------------------

Cache

Redis

Deployment

Render Redis / Redis Cloud

---------------------------------------------

Queues

BullMQ

Redis Backend

---------------------------------------------

Object Storage (Future)

Cloudflare R2

or

AWS S3

Provider abstraction required.

==============================================================================

DOCKER

Docker is mandatory.

Every service must run inside its own container.

The application should behave identically on

Windows

macOS

Linux

Development

Testing

Production

==============================================================================

DOCKER CONTAINERS

The MVP consists of the following containers.

frontend

↓

backend

↓

ai-service

↓

mongodb (development only)

↓

redis

Future containers

nginx

monitoring

vector workers

analytics workers

email workers

==============================================================================

DOCKER COMPOSE

Docker Compose orchestrates all containers.

Services communicate through an internal Docker network.

No service should depend on localhost.

Instead use service names.

Example

backend

↓

http://ai-service:8000

NOT

localhost

==============================================================================

SERVICE COMMUNICATION

Frontend

↓

Backend

↓

AI Service

↓

Gemini API

Backend

↓

MongoDB Atlas

Backend

↓

Redis

Workers

↓

Redis

↓

MongoDB

↓

AI Service

==============================================================================

NETWORKING

Every service communicates over private Docker networking.

Public exposure

Frontend

Backend API

Everything else remains internal.

Redis should never be publicly accessible.

MongoDB Atlas access should be IP restricted whenever possible.

==============================================================================

ENVIRONMENT VARIABLES

Never hardcode configuration.

Every service uses its own .env file.

Examples

Backend

DATABASE_URL

JWT_SECRET

REDIS_URL

AI_SERVICE_URL

SMTP_HOST

SMTP_USER

SMTP_PASSWORD

---------------------------------------------

AI Service

GEMINI_API_KEY

EMBEDDING_PROVIDER

VECTOR_PROVIDER

MODEL_NAME

---------------------------------------------

Frontend

VITE_API_URL

==============================================================================

SECRET MANAGEMENT

Never commit

API Keys

Passwords

JWT Secrets

Database Credentials

SMTP Credentials

Secrets belong in

.env

or

Cloud Secret Managers

==============================================================================

VERSION CONTROL

Platform

Git

Repository

GitHub

Branch Strategy

main

↓

develop

↓

feature/*

↓

bugfix/*

↓

hotfix/*

Conventional Commits preferred.

==============================================================================

GIT COMMIT CONVENTIONS

Examples

feat(auth): implement JWT authentication

fix(rag): correct chunk retrieval ordering

docs(api): update Learning API

refactor(ai): introduce provider abstraction

==============================================================================

CI/CD

Future GitHub Actions pipeline

Stages

Checkout

↓

Install

↓

Lint

↓

Type Check

↓

Unit Tests

↓

Build

↓

Docker Build

↓

Deploy

Only deploy successful builds.

==============================================================================

CODE QUALITY PIPELINE

Every pull request should pass

Lint

Type Check

Unit Tests

Integration Tests

Build Verification

==============================================================================

TEST ENVIRONMENTS

Development

Local Docker

---------------------------------------------

Testing

Dedicated Test Database

Mock AI Provider

---------------------------------------------

Production

Cloud Deployment

==============================================================================

MONITORING

Future monitoring stack

Prometheus

Grafana

OpenTelemetry

Sentry

Current MVP

Application Logs

Health Checks

Basic Metrics

==============================================================================

HEALTH CHECKS

Every service exposes

/health

Returns

Status

Version

Dependencies

Database

Redis

AI Connectivity

==============================================================================

LOGGING

Every service should log

Timestamp

Correlation ID

Request ID

User ID (if authenticated)

Latency

HTTP Method

Route

Status Code

Errors

Avoid logging sensitive information.

==============================================================================

ERROR REPORTING

Future

Sentry

Current

Structured Logs

Critical failures should include enough context for debugging.

==============================================================================

BACKUPS

MongoDB Atlas

Daily Backup

Weekly Snapshot

Point-in-Time Recovery

Future

Automated backup verification.

==============================================================================

DISASTER RECOVERY

Recovery Priority

Authentication

↓

Profiles

↓

Documents

↓

Lessons

↓

AI Conversations

↓

Analytics

==============================================================================

SCALING STRATEGY

Current

Single Instance

↓

Future

Multiple Backend Instances

↓

Multiple AI Workers

↓

Horizontal Scaling

↓

Load Balancer

The architecture should support scaling without changing business logic.

==============================================================================

FREE-TIER DEPLOYMENT STRATEGY

The project currently targets near-zero operational cost.

Chosen providers

Frontend

Vercel Free

Backend

Render Free

AI Service

Render Free

Database

MongoDB Atlas Free Tier

Redis

Redis Cloud Free Tier

AI

Google Gemini Free Tier

Reason

Portfolio project

Research

Student budget

==============================================================================

EXPECTED COST

Current MVP

Target

₹0–₹500/month

Primary recurring cost (future)

AI Provider

Current

Gemini Free Tier

Future

Gemini Paid

or

OpenAI

Storage costs expected to remain minimal during portfolio usage.

==============================================================================

FUTURE INFRASTRUCTURE ROADMAP

Version 2

Nginx Reverse Proxy

HTTPS Automation

Rate Limiting

---------------------------------------------

Version 3

Kubernetes

Horizontal Pod Autoscaling

Managed Redis

Managed Queue Workers

---------------------------------------------

Enterprise

AWS

Azure

GCP

Terraform

Helm

Service Mesh

==============================================================================

OPERATIONS PHILOSOPHY

Infrastructure should be reproducible.

A new developer should be able to clone the repository,
run Docker Compose,
and have the entire platform operational with minimal manual steps.

==============================================================================

MOST IMPORTANT INFRASTRUCTURE RULES

• Docker is mandatory.

• Every service is independently deployable.

• Never hardcode secrets.

• Infrastructure remains provider independent.

• Free-tier compatibility is maintained where practical.

• CI/CD should remain automated.

• Monitoring is part of the product.

• Every service exposes health checks.

• Logs are structured.

• Production and development remain as similar as possible.

==============================================================================

CURRENT IMPLEMENTATION STATUS

Infrastructure has been planned.

Docker configuration has not yet been implemented.

CI/CD has not yet been implemented.

Deployment has not yet been configured.

These tasks will begin after core backend modules are completed.

==============================================================================

END OF PART 8

Continue with

PART 9

Documentation Handbook

Repository Structure

Complete Folder Structure

Current Handbook Status

Feature Specifications

Architecture Decision Records

Mermaid Diagrams

Project Documentation Philosophy
==============================================================================
DOCUMENTATION PHILOSOPHY
==============================================================================

One of the most important architectural decisions made for GenLearn is that
documentation is treated as a first-class citizen.

The handbook is NOT an afterthought.

The handbook is considered part of the software product.

Every architectural decision,
every feature,
every API,
every database change,
every infrastructure decision,
must exist in documentation before implementation.

This philosophy exists because AI-assisted software development requires
clear architectural memory.

The handbook is the permanent memory of the project.

==============================================================================

WHY DOCUMENTATION FIRST

Large AI-assisted projects quickly become inconsistent.

Without documentation:

• Architecture drifts.
• APIs become inconsistent.
• Naming conventions change.
• Folder structures diverge.
• Business rules become duplicated.
• AI assistants forget previous decisions.
• Features become tightly coupled.

The handbook prevents all of these problems.

Documentation therefore comes BEFORE implementation.

==============================================================================

PROJECT DEVELOPMENT PHILOSOPHY

Every feature follows exactly this lifecycle.

Business Idea

↓

Discussion

↓

Architecture Decision

↓

Documentation

↓

Feature Specification

↓

Implementation

↓

Testing

↓

Documentation Update

↓

Merge

Nothing skips documentation.

==============================================================================

REPOSITORY STRUCTURE

The final repository structure should resemble the following.

genlearn/

├── README.md
├── PROJECT_CONTEXT_FOR_CLAUDE.md
├── CLAUDE.md
├── AGENTS.md
├── LICENSE
├── .gitignore
├── docker-compose.yml
├── .env.example
│
├── frontend/
│
├── backend/
│
├── ai-service/
│
├── handbook/
│
├── feature-specifications/
│
├── adr/
│
├── diagrams/
│
├── scripts/
│
├── docs/
│
└── assets/

This structure is considered the long-term target.

==============================================================================

HANDBOOK STRUCTURE

The handbook has been intentionally organized into multiple sections.

Current structure

handbook/

00-foundation/

01-product/

02-architecture/

03-api/

04-development/

05-diagrams/

06-operations/

07-adr/

08-feature-specifications/

Each section owns a specific responsibility.

==============================================================================

00 — FOUNDATION

Purpose

Project identity.

Contains

Vision

Mission

Objectives

Glossary

Constitution

Project Principles

These documents rarely change.

==============================================================================

01 — PRODUCT

Purpose

Product planning.

Contains

Problem Statement

Product Requirements Document

MVP Definition

Roadmap

User Personas

User Stories

Acceptance Criteria

==============================================================================

02 — ARCHITECTURE

Purpose

System design.

Contains

Technology Decisions

High-Level Architecture

Low-Level Designs

Database Design

AI Architecture

Security

RAG

Adaptive Learning

Documentation completed here becomes the implementation blueprint.

==============================================================================

03 — API

Purpose

API contracts.

Contains

API Principles

Identity API

Learning API

Assessment API

Knowledge API

AI Platform API

Analytics API

Administration API

Versioning

OpenAPI Governance

These documents define contracts between systems.

==============================================================================

04 — DEVELOPMENT

Purpose

Implementation standards.

Contains

Coding Standards

Naming Standards

Git Workflow

Branching Strategy

Testing Standards

Code Review Guidelines

Release Workflow

==============================================================================

05 — DIAGRAMS

Purpose

Visual documentation.

Contains

C4 Diagrams

ER Diagrams

Sequence Diagrams

Flow Charts

Deployment Diagrams

Component Diagrams

Mermaid Diagrams

Architecture should always have visual support.

==============================================================================

06 — OPERATIONS

Purpose

Running the platform.

Contains

Deployment Guide

Docker Guide

Monitoring

Logging

Backups

Recovery

Runbooks

Maintenance

Production Operations

==============================================================================

07 — ADR

Architecture Decision Records.

Every major architectural decision receives an ADR.

Examples

ADR-001

Choose MongoDB Atlas

ADR-002

Choose NestJS

ADR-003

Provider Abstraction

ADR-004

RAG Mandatory

ADR-005

Docker First

ADR documents preserve architectural reasoning.

==============================================================================

08 — FEATURE SPECIFICATIONS

Every significant feature has its own specification.

Examples

Authentication

Lesson Generation

Quiz Generation

AI Tutor

Flashcards

Document Upload

Adaptive Learning

Recommendations

Analytics

Admin Dashboard

Each feature specification contains

Purpose

Business Rules

User Flow

API Dependencies

Database Dependencies

Acceptance Criteria

Future Enhancements

Claude should always read the Feature Specification before implementing
the feature.

==============================================================================

CURRENT DOCUMENTATION STATUS

The handbook is currently under active development.

Completed (at the time of this document)

✓ Constitution
✓ Vision
✓ Glossary
✓ Product Vision
✓ Product Requirements
✓ MVP Roadmap
✓ Technology Decision Record
✓ C4 System Context
✓ High-Level Architecture
✓ Backend Low-Level Design
✓ Frontend Low-Level Design
✓ AI Platform Low-Level Design
✓ Domain Model
✓ Event-Driven Architecture
✓ Database Design
✓ Data Governance
✓ API Design Principles
✓ Identity API

The remaining handbook documents will continue to be created before
implementation begins.

==============================================================================

DOCUMENT TEMPLATE

Every handbook document follows the same structure.

Document Metadata

Purpose

Scope

Dependencies

Related Documents

Architecture

Design Decisions

Trade-offs

Risks

Assumptions

Constraints

Future Improvements

Claude Implementation Instructions

Revision History

Maintain this structure consistently.

==============================================================================

DIAGRAM STRATEGY

Every major architectural concept should eventually include diagrams.

Examples

System Context

Container Diagram

Component Diagram

Database Relationships

Authentication Flow

RAG Pipeline

Adaptive Learning Flow

AI Request Lifecycle

Document Upload Flow

Quiz Lifecycle

Recommendation Engine

Deployment Diagram

Mermaid is preferred because diagrams remain version controlled.

==============================================================================

DOCUMENT OWNERSHIP

Project Owners

Rishi Mahajan

Krutika Wagh

Claude assists with documentation.

Claude does not own architectural decisions.

Architectural decisions require explicit approval from the project owners.

==============================================================================

VERSIONING

Documentation should evolve with the project.

Suggested versioning

0.x

Planning

1.0

Initial implementation

2.0

Enterprise expansion

Major architecture changes require documentation updates.

==============================================================================

MOST IMPORTANT DOCUMENTATION RULES

• Documentation first.

• Architecture before implementation.

• Every feature has a specification.

• Every major decision has an ADR.

• APIs are documented before coding.

• Database changes require documentation updates.

• Handbook remains the single source of truth.

• PROJECT_CONTEXT_FOR_CLAUDE.md is updated whenever major project
  decisions are made.

• Never implement undocumented architectural changes.

==============================================================================

HOW CLAUDE SHOULD USE THE HANDBOOK

When beginning any new task

Read

PROJECT_CONTEXT_FOR_CLAUDE.md

↓

Relevant Handbook Section

↓

Feature Specification

↓

ADR (if applicable)

↓

Current Module

↓

Implement

↓

Update Documentation

↓

Commit

Never skip these steps.

==============================================================================

CURRENT PROJECT STATUS

The project is still in the planning and documentation phase.

No production-ready implementation has begun.

The architecture is considered stable.

The next major milestone is to complete the remaining handbook documents
and then begin implementation module-by-module.

==============================================================================

END OF PART 9

Continue with

PART 10

Coding Standards

Naming Standards

Git Workflow

Development Rules

Testing Philosophy

Code Quality Standards

Claude Implementation Rules

Permanent Project Rules
==============================================================================
ENGINEERING PHILOSOPHY
==============================================================================

GenLearn is being developed as if it were a production SaaS platform.

Although it is currently a Final Year Project and Portfolio Project,
engineering quality must reflect enterprise software standards.

The objective is NOT merely to produce working software.

The objective is to produce software that is:

• Maintainable
• Scalable
• Testable
• Modular
• Extensible
• Well Documented
• Production Ready

Every engineering decision should optimize for long-term maintainability.

==============================================================================

SOFTWARE ENGINEERING PRINCIPLES

The entire codebase follows:

• SOLID Principles
• DRY (Don't Repeat Yourself)
• KISS (Keep It Simple)
• YAGNI (You Aren't Gonna Need It)
• Clean Code
• Clean Architecture
• Domain Driven Design
• Separation of Concerns
• Composition over Inheritance

Never violate these principles without strong justification.

==============================================================================

LANGUAGE STANDARDS

Frontend

TypeScript

Strict Mode Enabled

Backend

TypeScript

Strict Mode Enabled

AI Platform

Python

Type Hints Required

==============================================================================

CODE STYLE

Formatting

Prettier

Linting

ESLint

Python

Black

Flake8

Imports

Sorted consistently.

Avoid wildcard imports.

==============================================================================

NAMING CONVENTIONS

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Types

PascalCase

Constants

UPPER_SNAKE_CASE

Files

kebab-case

Folders

kebab-case

Database Collections

snake_case

API Routes

kebab-case

==============================================================================

FILE ORGANIZATION

Every file should have a single responsibility.

Avoid files exceeding approximately 300–500 lines where practical.

Large modules should be split logically.

Never create "utils.ts" files that become dumping grounds.

==============================================================================

FUNCTION DESIGN

Functions should:

Perform one task.

Have descriptive names.

Avoid excessive parameters.

Return predictable outputs.

Avoid hidden side effects.

==============================================================================

COMMENTS

Code should be self-explanatory.

Do NOT comment obvious code.

Use comments only to explain:

Business reasoning

Complex algorithms

Architectural decisions

Performance considerations

Avoid redundant comments.

==============================================================================

ERROR HANDLING

Errors should never be ignored.

Use typed exceptions.

Return standardized API responses.

Log unexpected failures.

Never expose stack traces to users.

==============================================================================

LOGGING

Log meaningful events.

Examples

Authentication

Lesson Generation

Quiz Submission

Document Upload

AI Failures

Background Jobs

Avoid excessive logging.

Never log:

Passwords

JWT Tokens

API Keys

Sensitive personal information

==============================================================================

VALIDATION

Every external input must be validated.

Frontend

Client validation

Backend

DTO validation

Domain validation

Database validation

Never trust client-side validation.

==============================================================================

DEPENDENCY MANAGEMENT

Prefer existing project dependencies.

Do not introduce unnecessary libraries.

Every new dependency must have a clear justification.

==============================================================================

CONFIGURATION

Configuration belongs in environment variables.

Never hardcode:

URLs

Secrets

API Keys

Database credentials

Feature flags

==============================================================================

API DESIGN RULES

RESTful endpoints.

Plural resource names.

Consistent response envelopes.

Consistent error envelopes.

Versioned APIs.

Standard HTTP status codes.

==============================================================================

DATABASE RULES

Repositories own persistence.

Services never execute database queries directly.

Controllers never execute database queries.

Collections follow aggregate boundaries.

==============================================================================

AI RULES

Never call Gemini directly from the frontend.

Never hardcode prompts.

Always use the Prompt Manager.

Always support provider abstraction.

Always validate AI responses.

Always log token usage.

==============================================================================

FRONTEND RULES

Preserve existing UI.

Never redesign.

Use reusable components.

Maintain animations.

Handle loading states.

Handle error states.

Handle empty states.

Use TanStack Query for server state.

==============================================================================

BACKEND RULES

Controllers remain thin.

Services orchestrate.

Repositories persist.

Domain services own business rules.

Events are asynchronous.

BullMQ handles long-running jobs.

==============================================================================

TESTING PHILOSOPHY

Testing is mandatory.

Every important feature should include:

Unit Tests

Integration Tests

Future

End-to-End Tests

Testing is part of feature completion.

==============================================================================

GIT WORKFLOW

Branches

main

develop

feature/*

bugfix/*

hotfix/*

Commits

Conventional Commits

Examples

feat(ai): add lesson generation

fix(auth): resolve refresh token rotation

docs(rag): update architecture

==============================================================================

PULL REQUEST GUIDELINES

Every PR should include:

Purpose

Summary

Testing Performed

Documentation Updated

Breaking Changes (if any)

==============================================================================

CODE REVIEW CHECKLIST

Before merging:

✓ Architecture followed

✓ Naming conventions followed

✓ Tests pass

✓ Documentation updated

✓ No hardcoded values

✓ Error handling implemented

✓ Logging added

✓ Validation present

==============================================================================

PERFORMANCE PRINCIPLES

Avoid premature optimization.

Optimize after measurement.

Use caching appropriately.

Avoid unnecessary database queries.

Use pagination.

Lazy load heavy UI components.

==============================================================================

SECURITY PRINCIPLES

Least privilege.

RBAC.

JWT validation.

Input sanitization.

Output encoding.

HTTPS only.

Rate limiting.

Secure headers.

==============================================================================

ACCESSIBILITY

Keyboard navigation.

ARIA labels.

Color contrast.

Focus management.

Screen reader compatibility.

Accessibility is a requirement,
not an enhancement.

==============================================================================

DOCUMENTATION REQUIREMENTS

Every completed feature updates:

Feature Specification

API Documentation

Architecture (if changed)

ADR (if architectural)

PROJECT_CONTEXT_FOR_CLAUDE.md (if major decision)

==============================================================================

IMPLEMENTATION ORDER

The implementation order has been intentionally planned.

1.

Identity

↓

2.

Learning

↓

3.

Assessment

↓

4.

Knowledge

↓

5.

AI Platform Integration

↓

6.

Analytics

↓

7.

Administration

↓

8.

Infrastructure

↓

9.

Testing

↓

10.

Deployment

Never change this order without strong justification.

==============================================================================

PERMANENT PROJECT RULES

The following rules are considered permanent.

1. Never redesign the frontend.

2. Never replace the chosen technology stack without approval.

3. Never bypass repositories.

4. Never bypass provider abstraction.

5. Never hardcode prompts.

6. Never hardcode secrets.

7. Never use mock implementations after the real module exists.

8. Never introduce duplicate business logic.

9. Never skip documentation.

10. Never skip validation.

11. Never skip authentication.

12. Never skip authorization.

13. Never merge failing code.

14. Never expose sensitive information.

15. Never commit API keys.

16. Never tightly couple modules.

17. Never violate bounded contexts.

18. Never put business logic in controllers.

19. Never put persistence logic in services.

20. Never let AI providers leak into business logic.

21. Always think about future scalability.

22. Always maintain clean architecture.

23. Always preserve provider independence.

24. Always preserve documentation quality.

25. Always prioritize maintainability over shortcuts.

==============================================================================

CURRENT STATUS

As of this document:

The project architecture is stable.

The documentation handbook is still under construction.

Implementation has intentionally not started.

The next objective is to finish the remaining handbook documents before
moving into production implementation.

==============================================================================

END OF PART 10

Continue with

PART 11

Complete Project Roadmap

MVP Scope

Version 1

Version 2

Enterprise Vision

Research Goals

Future Features

Current Progress

Next Immediate Tasks

Conversation Memory Timeline
==============================================================================
PROJECT ROADMAP
==============================================================================

This section defines the long-term vision and implementation roadmap
for GenLearn.

The roadmap has been intentionally divided into phases.

Each phase builds upon the previous one.

The project should NEVER attempt to implement everything simultaneously.

Every phase should result in a usable, stable application.

==============================================================================

OVERALL PROJECT OBJECTIVES

GenLearn has multiple goals.

Academic Goal

Develop a technically outstanding Final Year Project demonstrating
modern software engineering and Generative AI.

------------------------------------------------------------

Portfolio Goal

Build an enterprise-grade application that showcases senior-level
software architecture, AI engineering, backend engineering, frontend
engineering and DevOps skills.

------------------------------------------------------------

Research Goal

Provide a platform that demonstrates:

• Adaptive Learning
• Behavioural Analytics
• Retrieval Augmented Generation
• Personalized AI Tutoring

with enough novelty for research publication.

------------------------------------------------------------

Product Goal

Design GenLearn so it can evolve into a commercial SaaS platform.

==============================================================================

IMPLEMENTATION PHILOSOPHY

The project should always follow:

Documentation

↓

Architecture

↓

Feature Specification

↓

Backend

↓

Frontend Integration

↓

Testing

↓

Deployment

↓

Optimization

Skipping phases creates technical debt.

==============================================================================

MVP DEFINITION

The MVP should be fully functional.

It is NOT a prototype.

It should contain:

Authentication

Student Dashboard

Lesson Generation

Quiz Generation

AI Tutor

Document Upload

RAG

Progress Tracking

Adaptive Recommendations

Admin Dashboard

Analytics

Docker Deployment

Swagger Documentation

Unit Tests

==============================================================================

MVP FEATURES

Identity

✓ Registration

✓ Login

✓ JWT

✓ Refresh Tokens

✓ RBAC

------------------------------------------------------------

Learning

✓ AI Lessons

✓ Lesson History

✓ Recommendations

------------------------------------------------------------

Assessment

✓ AI Quizzes

✓ Quiz Attempts

✓ Results

✓ Adaptive Difficulty

------------------------------------------------------------

Knowledge

✓ Document Upload

✓ PDF Processing

✓ Embeddings

✓ Flashcards

✓ Summaries

------------------------------------------------------------

AI

✓ Tutor

✓ Lesson Generation

✓ Quiz Generation

✓ Context Builder

✓ Prompt Manager

✓ Provider Abstraction

------------------------------------------------------------

Analytics

✓ Behaviour Tracking

✓ Mastery Score

✓ Weak Topics

✓ Learning Progress

------------------------------------------------------------

Administration

✓ User Management

✓ Dashboard

✓ AI Usage

✓ Platform Metrics

==============================================================================

VERSION 1.0

Target

Production-ready portfolio project.

Deliverables

Complete handbook

Complete backend

Complete frontend integration

Docker

Deployment

Documentation

Swagger

Basic monitoring

==============================================================================

VERSION 1.1

Quality improvements.

Features

Performance optimization

Improved analytics

Better recommendations

Expanded test coverage

Accessibility improvements

==============================================================================

VERSION 2.0

Advanced AI.

Features

Model routing

Multiple providers

Streaming responses

Prompt versioning

Advanced recommendations

Improved adaptive engine

==============================================================================

VERSION 3.0

Research Edition.

Features

Learning experiments

A/B testing

Behaviour prediction

Advanced learner modelling

Research dashboard

==============================================================================

VERSION 4.0

Enterprise Edition.

Features

Teacher Portal

Institution Portal

Course Management

Multi-tenancy

Subscriptions

Billing

Role expansion

==============================================================================

VERSION 5.0

AI Native Platform

Voice Tutor

Real-time collaboration

AI Study Planner

AI Exam Coach

AI Interview Preparation

Agentic AI Workflows

==============================================================================

FEATURE PRIORITY

Priority 1

Identity

Learning

Assessment

------------------------------------------------------------

Priority 2

Knowledge

RAG

AI Tutor

------------------------------------------------------------

Priority 3

Analytics

Administration

Notifications

------------------------------------------------------------

Priority 4

Operations

Monitoring

CI/CD

==============================================================================

IMPLEMENTATION ORDER

The implementation order has already been decided.

Never change this order unless required.

Phase 1

Repository Setup

Docker

Environment

------------------------------------------------------------

Phase 2

Identity Module

------------------------------------------------------------

Phase 3

Learning Module

------------------------------------------------------------

Phase 4

Assessment Module

------------------------------------------------------------

Phase 5

Knowledge Module

------------------------------------------------------------

Phase 6

AI Integration

------------------------------------------------------------

Phase 7

Analytics

------------------------------------------------------------

Phase 8

Administration

------------------------------------------------------------

Phase 9

Testing

------------------------------------------------------------

Phase 10

Deployment

==============================================================================

CURRENT PROJECT STATUS

Planning

█████████████████████████████████

Documentation

██████████████████████░░░░░░░░░░

Architecture

████████████████████████████████

Implementation

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Testing

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Deployment

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

==============================================================================

SUCCESS METRICS

Technical

• Clean Architecture
• High code quality
• Test coverage
• Documentation completeness

Academic

• Successful Final Year Project
• Strong viva performance
• Research potential

Portfolio

• Demonstrates enterprise architecture
• Demonstrates AI engineering
• Demonstrates DevOps
• Demonstrates cloud deployment

==============================================================================

KNOWN FUTURE FEATURES

These ideas have been discussed but intentionally deferred.

• Teacher accounts

• Parent dashboard

• Institution management

• AI-generated study plans

• Calendar integration

• Email reminders

• Push notifications

• Voice conversations

• OCR for handwritten notes

• Multi-language support

• Offline mode

• PWA

• Mobile applications

• Live classrooms

• AI-generated coding exercises

• Interview preparation

==============================================================================

TECHNICAL DEBT POLICY

Avoid introducing technical debt.

If shortcuts become necessary,

document them.

Every shortcut should create a future task.

==============================================================================

PROJECT MANAGEMENT PHILOSOPHY

Large milestones should be divided into:

Feature

↓

Specification

↓

Implementation

↓

Testing

↓

Documentation

↓

Review

Never build multiple unrelated features simultaneously.

==============================================================================

WHAT CLAUDE SHOULD DO NEXT

When continuing this project:

1.

Read PROJECT_CONTEXT_FOR_CLAUDE.md completely.

↓

2.

Read handbook/

↓

3.

Identify latest completed document.

↓

4.

Continue documentation from that point.

↓

5.

After handbook completion,

begin implementation.

↓

6.

Implement module-by-module.

↓

7.

Never skip documentation updates.

==============================================================================

CURRENT NEXT TASK

Continue creating handbook documents.

Immediate next document:

Learning API

Followed by:

Assessment API

Knowledge API

AI Platform API

Analytics API

Administration API

Continue until handbook reaches production quality.

Only then begin implementation.

==============================================================================

FINAL OBJECTIVE

Build a platform that demonstrates:

Enterprise Software Engineering

+

Generative AI

+

Cloud Architecture

+

Modern Frontend

+

Modern Backend

+

DevOps

+

Research Quality Documentation

The final project should be something that a senior software engineer
would be proud to present.

==============================================================================

END OF PART 11

Continue with

PART 12

Conversation Memory

Chronological Decision Log

Current Handbook Progress

Final Instructions to Claude

Context Recovery Guide

Project Handover

End of Document