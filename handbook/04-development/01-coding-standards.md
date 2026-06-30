# Document Metadata

**Document ID:** DEV-01

**Title:** Coding Standards

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Development

**Priority:** High

---

# Purpose

Define the coding standards, naming conventions, and code quality rules that apply across the entire GenLearn codebase.

Every developer and every AI assistant working on this project must follow these standards without exception.

---

# Guiding Principles

- SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- DRY: Do not repeat logic — extract, reuse, abstract
- KISS: Prefer simple solutions over clever ones
- YAGNI: Do not implement features that are not yet required
- Clean Code: Code should be self-explanatory without excessive comments

---

# Languages

| Layer | Language | Config |
|-------|----------|--------|
| Frontend | TypeScript | strict: true |
| Backend | TypeScript | strict: true |
| AI Platform | Python | type hints required |

---

# Naming Conventions

## TypeScript / JavaScript

| Construct | Convention | Example |
|-----------|-----------|---------|
| Variables | camelCase | `studentScore` |
| Functions | camelCase | `calculateMastery()` |
| Classes | PascalCase | `LessonRepository` |
| Interfaces | PascalCase | `ILessonRepository` |
| Types | PascalCase | `LessonDto` |
| Enums | PascalCase | `DifficultyLevel` |
| Enum values | UPPER_SNAKE_CASE | `DIFFICULTY_LEVEL.BEGINNER` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE_MB` |
| Files | kebab-case | `lesson-repository.ts` |
| Folders | kebab-case | `lesson-generation/` |

## Python (AI Platform)

| Construct | Convention |
|-----------|-----------|
| Variables | snake_case |
| Functions | snake_case |
| Classes | PascalCase |
| Constants | UPPER_SNAKE_CASE |
| Files | snake_case |
| Folders | snake_case |

## Database

| Construct | Convention | Example |
|-----------|-----------|---------|
| Collections | snake_case | `quiz_attempts` |
| Fields | camelCase | `createdAt` |
| Indexes | descriptive | `idx_userId_createdAt` |

## API

| Construct | Convention | Example |
|-----------|-----------|---------|
| Routes | kebab-case | `/api/v1/quiz-attempts` |
| Query params | camelCase | `?pageSize=20` |
| JSON fields | camelCase | `"lessonId": "..."` |

---

# File Organisation

- Each file has a single responsibility.
- Files should not exceed 300–500 lines where avoidable.
- Large modules are split logically, not arbitrarily.
- Never create a `utils.ts` that becomes a dumping ground.
- Group by feature, not by type.

---

# TypeScript Standards

```typescript
// Always use explicit return types on public methods
async generateLesson(dto: GenerateLessonDto): Promise<LessonResponseDto> { }

// Avoid 'any' — always type properly
// Bad:
const data: any = response.data;
// Good:
const data: LessonDto = response.data;

// Use optional chaining and nullish coalescing
const score = student?.adaptiveScore ?? 0;

// Prefer readonly where appropriate
readonly lessonId: string;

// Destructure for clarity
const { topic, difficulty, learningGoal } = dto;
```

---

# Python Standards

```python
# All functions must have type hints
async def generate_lesson(topic: str, difficulty: str, context: StudentContext) -> LessonResponse:
    ...

# Use dataclasses or Pydantic models for structured data
class LessonRequest(BaseModel):
    topic: str
    difficulty: DifficultyLevel
    learning_goal: Optional[str] = None

# Avoid mutable default arguments
# Bad:
def process(items=[]):
# Good:
def process(items: list | None = None):
    items = items or []
```

---

# Comments

Comments explain WHY, not WHAT.

```typescript
// Good — explains non-obvious reasoning:
// Rotate refresh token before issuing new one to prevent replay attacks
await this.invalidateRefreshToken(oldToken);

// Bad — explains obvious code:
// Get the lesson by ID
const lesson = await this.lessonRepository.findById(lessonId);
```

Do not write:
- Commented-out code (use git history)
- Redundant comments
- TODO comments without a tracking reference

---

# Error Handling

```typescript
// Use typed domain exceptions
throw new LessonNotFoundException(lessonId);
throw new DocumentNotReadyException(documentId);

// Never swallow errors silently
// Bad:
try { ... } catch (e) { }

// Always log unexpected errors
// Good:
try { ... } catch (error) {
  this.logger.error('Lesson generation failed', { lessonId, error });
  throw new LessonGenerationFailedException(lessonId);
}
```

---

# Logging

```typescript
// Use the NestJS Logger — never use console.log in production code
private readonly logger = new Logger(LessonService.name);

// Log with structured context
this.logger.log('Lesson generated', { lessonId, topic, tokensUsed });
this.logger.warn('Generation slow', { lessonId, latencyMs });
this.logger.error('Generation failed', { lessonId, error: error.message });
```

Never log:
- Passwords
- JWT tokens
- API keys
- Personal data beyond user IDs

---

# Imports

```typescript
// Group imports: external → internal → relative
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { LessonRepository } from '../repositories/lesson.repository';
import { GenerateLessonDto } from '../dto/generate-lesson.dto';

import { LessonMapper } from './lesson.mapper';
```

---

# Dependency Management

- Prefer existing project dependencies over new ones.
- Every new dependency requires justification.
- Never introduce a library for a problem solvable in 10 lines.
- Lock dependency versions in package.json.

---

# Code Review Checklist

Before submitting any code:

- [ ] TypeScript strict mode satisfied (no `any`, no implicit types)
- [ ] Naming conventions followed
- [ ] No business logic in controllers
- [ ] No database queries outside repositories
- [ ] No hardcoded values or secrets
- [ ] Error handling implemented
- [ ] Logging added for meaningful events
- [ ] Validation present on all inputs
- [ ] Tests written for the new logic
- [ ] Documentation updated if architecture changed

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial coding standards created. |
