# Document Metadata

**Document ID:** DEV-03

**Title:** Testing Standards

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Development

**Priority:** High

---

# Purpose

Define the testing strategy, testing conventions, and acceptance criteria for code quality across the GenLearn platform.

---

# Testing Philosophy

Testing is part of feature completion — a feature is not done until it has tests.

Testing priorities, in order:

1. Application services (business logic)
2. Domain services (business rules)
3. Repositories (database access patterns)
4. Controllers (HTTP contracts)
5. AI Platform endpoints (integration)

---

# Testing Levels

## Unit Tests

Test a single unit of logic in isolation.

- Services are tested with mocked repositories and dependencies.
- Domain services are tested with pure inputs and outputs.
- No database connections.
- No HTTP calls.
- Fast — should complete in milliseconds.

## Integration Tests

Test how multiple units work together.

- Test the full request lifecycle: Controller → Service → Repository → Database.
- Use a real test database (MongoDB in test mode).
- Use a real Redis instance (test instance).
- No mocks except external AI provider calls.

## End-to-End Tests (Future)

Test complete user flows through the application.

- Playwright for frontend flows.
- Supertest for backend API flows.
- Run in a staging environment.

---

# Backend Testing (NestJS + Jest)

## File Location

```
src/modules/lesson/tests/
  lesson.service.spec.ts
  lesson.repository.spec.ts
  lesson.controller.spec.ts
```

## Naming Convention

```typescript
describe('LessonService', () => {
  describe('generateLesson', () => {
    it('should queue lesson generation when valid input is provided', async () => { });
    it('should throw ValidationException when topic is missing', async () => { });
    it('should throw RateLimitException when limit is exceeded', async () => { });
  });
});
```

## Test Structure (AAA)

```typescript
it('should update mastery score after quiz completion', async () => {
  // Arrange
  const quizAttempt = createMockQuizAttempt({ score: 80 });
  mockAdaptiveService.calculate.mockResolvedValue({ newScore: 0.75 });

  // Act
  const result = await lessonService.processQuizCompletion(quizAttempt);

  // Assert
  expect(result.masteryScore).toBe(0.75);
  expect(mockProgressRepository.update).toHaveBeenCalledWith(
    quizAttempt.studentId,
    expect.objectContaining({ masteryScore: 0.75 })
  );
});
```

## Mocking Strategy

```typescript
// Mock repositories
const mockLessonRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByStudentId: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

// Mock AI Platform calls — never call real AI in unit tests
const mockAiGateway = {
  generateLesson: jest.fn().mockResolvedValue(mockLessonContent),
};
```

## What to Test

For every service method, test:
- Happy path (valid input, expected output)
- Invalid input (expect the right exception)
- Edge cases (empty arrays, zero scores, maximum limits)
- Side effects (events published, repositories called)

---

# AI Platform Testing (Python + pytest)

## File Location

```
ai-service/tests/
  test_lesson_generator.py
  test_rag_pipeline.py
  test_adaptive_engine.py
  test_prompt_manager.py
```

## Naming Convention

```python
class TestLessonGenerator:
    def test_generates_lesson_with_valid_input(self):
        ...

    def test_raises_error_when_topic_is_empty(self):
        ...

    def test_includes_rag_context_when_documents_provided(self):
        ...
```

## Mocking AI Provider in Tests

```python
@pytest.fixture
def mock_gemini_provider(mocker):
    mock = mocker.patch('ai_service.providers.gemini.GeminiProvider.generate')
    mock.return_value = MockLessonResponse(content="...")
    return mock
```

Never call the real Gemini API in tests.

---

# Frontend Testing (React + Vitest)

## Scope (MVP)

- Component rendering tests
- Hook behaviour tests
- API client tests

## File Location

```
src/features/lesson/tests/
  LessonCard.test.tsx
  useLessons.test.ts
  lessonApi.test.ts
```

---

# What Not to Test

- NestJS framework internals (guards, pipes provided by the framework)
- Trivial getters and setters with no logic
- Generated code (Swagger output, TypeScript types)
- Third-party library behaviour

---

# Test Data

- Create factory functions for test data, not hardcoded objects.
- Never use production data in tests.
- Test databases must be seeded and torn down for each test run.

```typescript
// Test data factory
function createMockStudent(overrides: Partial<Student> = {}): Student {
  return {
    studentId: 'student-test-id',
    email: 'test@example.com',
    adaptiveScore: 0.5,
    masteryLevel: 'intermediate',
    ...overrides,
  };
}
```

---

# Coverage Targets

| Layer | Target |
|-------|--------|
| Application Services | 80%+ |
| Domain Services | 90%+ |
| Repositories | 70%+ |
| Controllers | 60%+ |
| AI Platform Services | 70%+ |

Coverage is a guide, not a goal — prioritise meaningful tests over coverage numbers.

---

# Running Tests

Backend:
```bash
pnpm test           # Unit tests
pnpm test:e2e       # Integration tests
pnpm test:cov       # Coverage report
```

AI Platform:
```bash
pytest              # All tests
pytest --cov        # With coverage
```

Frontend:
```bash
pnpm test           # Vitest unit tests
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial testing standards created. |
