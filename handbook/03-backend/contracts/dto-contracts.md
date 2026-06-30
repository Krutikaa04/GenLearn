# Document Metadata

**Document ID:** BE-CON-01

**Title:** DTO Contracts

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** High

---

# Purpose

Define the TypeScript Data Transfer Object (DTO) contracts used across the GenLearn backend.

DTOs validate all incoming request data. They are implemented using `class-validator` decorators and are enforced by NestJS `ValidationPipe`.

---

# Conventions

- All DTOs use `class-validator` decorators.
- Properties use camelCase.
- Optional properties are annotated with `@IsOptional()`.
- Enums are validated with `@IsEnum()`.
- Strings are trimmed and sanitised.
- Passwords are never included in response DTOs.

---

# Auth DTOs

## RegisterDto

```typescript
export class RegisterDto {
  @IsEmail()
  @IsLowercase()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}
```

## LoginDto

```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

## ForgotPasswordDto

```typescript
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

## ResetPasswordDto

```typescript
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  newPassword: string;
}
```

## UpdateProfileDto

```typescript
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningGoals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  preferredDifficulty?: string;
}
```

---

# Lesson DTOs

## GenerateLessonDto

```typescript
export class GenerateLessonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  topic: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  learningGoal?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}
```

## CompleteLessonDto

```typescript
export class CompleteLessonDto {
  @IsNumber()
  @Min(0)
  timeSpentSeconds: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
```

---

# Quiz DTOs

## GenerateQuizDto

```typescript
export class GenerateQuizDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  topic: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(20)
  questionCount?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(['mcq', 'true_false', 'fill_blank', 'short_answer'], { each: true })
  questionTypes?: string[];

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}
```

## SubmitQuizDto

```typescript
export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers: SubmittedAnswerDto[];

  @IsNumber()
  @Min(0)
  totalTimeSeconds: number;
}

export class SubmittedAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeTakenSeconds?: number;

  @IsOptional()
  @IsBoolean()
  hintUsed?: boolean;
}
```

---

# Document DTOs

## DocumentAskDto

```typescript
export class DocumentAskDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  question: string;
}
```

## GenerateFlashcardsDto

```typescript
export class GenerateFlashcardsDto {
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  count?: number;
}
```

---

# AI Conversation DTOs

## CreateConversationDto

```typescript
export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}
```

## SendMessageDto

```typescript
export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}
```

---

# Admin DTOs

## ChangeRoleDto

```typescript
export class ChangeRoleDto {
  @IsEnum(['student', 'admin'])
  role: string;
}
```

## SuspendUserDto

```typescript
export class SuspendUserDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
```

---

# Pagination DTO

```typescript
export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial DTO contracts created. |
