# Document Metadata

**Document ID:** 09B

**Title:** Identity API

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** API Contract

**Priority:** Critical

---

# Dependencies

- Document 09A – API Design Principles
- Document 06A – Backend Low-Level Design
- Document 07 – Domain Model
- Document 10 – Authentication and Security

---

# Related Documents

- 09C – Learning API
- 09D – Assessment API
- FS-001 – Authentication Feature Specification
- FS-002 – User Management Feature Specification

---

# Purpose

This document defines every HTTP endpoint exposed by the Identity module of the GenLearn backend.

The Identity module handles user registration, authentication, session management, password reset, email verification, and profile management.

All other modules depend on the Identity module being available.

---

# Scope

- User Registration
- Login and Logout
- JWT Token Issuance and Refresh
- Password Reset Flow
- Email Verification Flow
- Profile Retrieval and Update

---

# Base Path

```
/api/v1/auth
/api/v1/users
```

---

# Authentication

Public endpoints are marked explicitly.

All other endpoints require a valid JWT Bearer token.

```
Authorization: Bearer <access_token>
```

---

# Endpoints

---

## POST /api/v1/auth/register

**Description:** Register a new student account.

**Access:** Public

**Request Body:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Validation Rules:**

- firstName: required, 2–50 characters
- lastName: required, 2–50 characters
- email: required, valid email format, must be unique
- password: required, minimum 8 characters, at least one uppercase, one digit
- confirmPassword: must match password

**Success Response — 201 Created:**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "email": "string",
    "message": "Registration successful. Please verify your email."
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | VALIDATION_ERROR | Invalid input fields |
| 409 | EMAIL_ALREADY_EXISTS | Email is already registered |

**Side Effects:**

- Creates user record in MongoDB
- Creates student profile record
- Publishes UserRegistered event
- Sends verification email via BullMQ queue

---

## POST /api/v1/auth/login

**Description:** Authenticate user and issue access and refresh tokens.

**Access:** Public

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 900,
    "user": {
      "userId": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "student | admin"
    }
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | VALIDATION_ERROR | Missing or malformed fields |
| 401 | INVALID_CREDENTIALS | Email or password incorrect |
| 401 | EMAIL_NOT_VERIFIED | Email address not yet verified |
| 403 | ACCOUNT_SUSPENDED | User account has been suspended |

**Side Effects:**

- Stores refresh token hash in Redis
- Logs authentication event

---

## POST /api/v1/auth/logout

**Description:** Invalidate the current session.

**Access:** Authenticated

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  },
  "timestamp": "ISO8601"
}
```

**Side Effects:**

- Removes refresh token from Redis
- Invalidates session cache

---

## POST /api/v1/auth/refresh

**Description:** Issue a new access token using a valid refresh token.

**Access:** Public (requires refresh token)

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 900
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 401 | INVALID_REFRESH_TOKEN | Token is invalid or expired |
| 401 | REFRESH_TOKEN_ROTATED | Token has already been used |

**Side Effects:**

- Rotates refresh token (old token invalidated, new token issued)

---

## POST /api/v1/auth/verify-email

**Description:** Verify user email using the token sent during registration.

**Access:** Public

**Request Body:**

```json
{
  "token": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully."
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | INVALID_TOKEN | Token is invalid or malformed |
| 410 | TOKEN_EXPIRED | Verification token has expired |
| 409 | ALREADY_VERIFIED | Email is already verified |

---

## POST /api/v1/auth/resend-verification

**Description:** Resend the email verification link.

**Access:** Public

**Request Body:**

```json
{
  "email": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Verification email sent if account exists."
  },
  "timestamp": "ISO8601"
}
```

**Rate Limit:** 3 requests per hour per email address.

---

## POST /api/v1/auth/forgot-password

**Description:** Request a password reset link via email.

**Access:** Public

**Request Body:**

```json
{
  "email": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "If this email is registered, a reset link has been sent."
  },
  "timestamp": "ISO8601"
}
```

**Note:** Always returns 200 regardless of whether the email exists. This prevents email enumeration attacks.

**Side Effects:**

- Generates password reset token with TTL
- Sends reset email via BullMQ queue

---

## POST /api/v1/auth/reset-password

**Description:** Reset user password using the reset token.

**Access:** Public

**Request Body:**

```json
{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully."
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | VALIDATION_ERROR | Passwords do not match or fail complexity rules |
| 400 | INVALID_TOKEN | Token is invalid or malformed |
| 410 | TOKEN_EXPIRED | Reset token has expired |

**Side Effects:**

- Invalidates all existing refresh tokens for the user
- Sends password changed confirmation email

---

## GET /api/v1/auth/me

**Description:** Retrieve the authenticated user's profile.

**Access:** Authenticated

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "student | admin",
    "emailVerified": true,
    "createdAt": "ISO8601",
    "studentProfile": {
      "grade": "string",
      "learningGoals": ["string"],
      "adaptiveScore": 0.0,
      "masteryLevel": "beginner | intermediate | advanced"
    }
  },
  "timestamp": "ISO8601"
}
```

---

## PATCH /api/v1/auth/me

**Description:** Update the authenticated user's profile.

**Access:** Authenticated

**Request Body (all fields optional):**

```json
{
  "firstName": "string",
  "lastName": "string",
  "studentProfile": {
    "grade": "string",
    "learningGoals": ["string"],
    "interests": ["string"],
    "preferredDifficulty": "beginner | intermediate | advanced"
  }
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Profile updated successfully."
  },
  "timestamp": "ISO8601"
}
```

---

## PATCH /api/v1/auth/change-password

**Description:** Change password while authenticated.

**Access:** Authenticated

**Request Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully."
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**

| Code | Error Code | Description |
|------|-----------|-------------|
| 401 | INCORRECT_PASSWORD | Current password is wrong |
| 400 | VALIDATION_ERROR | New passwords do not match |
| 400 | SAME_PASSWORD | New password is identical to current |

---

# Admin User Endpoints

---

## GET /api/v1/admin/users

**Description:** List all users.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| role | string | — | Filter by role |
| status | string | — | Filter by status (active, suspended) |
| search | string | — | Search by name or email |

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": "string",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "string",
        "status": "string",
        "createdAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  },
  "timestamp": "ISO8601"
}
```

---

## GET /api/v1/admin/users/:userId

**Description:** Retrieve a specific user's full details.

**Access:** Admin only

**Success Response — 200 OK:**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string",
    "status": "string",
    "emailVerified": true,
    "createdAt": "ISO8601",
    "studentProfile": {}
  },
  "timestamp": "ISO8601"
}
```

---

## PATCH /api/v1/admin/users/:userId/role

**Description:** Change a user's role.

**Access:** Admin only

**Request Body:**

```json
{
  "role": "student | admin"
}
```

**Success Response — 200 OK**

---

## POST /api/v1/admin/users/:userId/suspend

**Description:** Suspend a user account.

**Access:** Admin only

**Request Body:**

```json
{
  "reason": "string"
}
```

**Success Response — 200 OK**

**Side Effects:**

- Invalidates all user sessions
- Creates audit log entry

---

## POST /api/v1/admin/users/:userId/restore

**Description:** Restore a suspended user account.

**Access:** Admin only

**Success Response — 200 OK**

---

## DELETE /api/v1/admin/users/:userId

**Description:** Soft-delete a user account.

**Access:** Admin only

**Success Response — 204 No Content**

**Side Effects:**

- Soft deletes user and student profile
- Creates audit log entry

---

# Error Codes Reference

| Error Code | Description |
|-----------|-------------|
| VALIDATION_ERROR | Input validation failed |
| EMAIL_ALREADY_EXISTS | Email is taken |
| INVALID_CREDENTIALS | Wrong email or password |
| EMAIL_NOT_VERIFIED | Email not yet confirmed |
| ACCOUNT_SUSPENDED | Account is suspended |
| INVALID_TOKEN | Token is invalid |
| TOKEN_EXPIRED | Token has expired |
| ALREADY_VERIFIED | Email already confirmed |
| INCORRECT_PASSWORD | Current password is wrong |
| SAME_PASSWORD | New password equals current |
| INVALID_REFRESH_TOKEN | Refresh token rejected |
| REFRESH_TOKEN_ROTATED | Refresh token already used |

---

# Security Notes

- Passwords are hashed with bcrypt (rounds: 12)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens are rotated on every use
- Verification and reset tokens have TTL stored in MongoDB
- All token comparisons use constant-time equality

---

# Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 10 requests / 15 minutes per IP |
| POST /auth/register | 5 requests / hour per IP |
| POST /auth/forgot-password | 3 requests / hour per email |
| POST /auth/resend-verification | 3 requests / hour per email |

---

# Claude Code Implementation Instructions

1. Implement this module first — all other modules depend on it.
2. JWT Guard must be applied globally with public route decorators for exceptions.
3. Refresh token rotation must be atomic — invalidate old before issuing new.
4. Never return different responses for existing vs non-existing emails on public endpoints.
5. Use class-validator decorators on every DTO.
6. Apply Mongoose TTL indexes on password reset and verification token collections.
7. All admin endpoints require RolesGuard checking the admin role.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Identity API contract created. |
