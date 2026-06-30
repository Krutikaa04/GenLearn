# Feature Specification: Authentication

**Document ID:** FS-001

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** Critical

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the complete authentication and session management feature for GenLearn.

Authentication is the entry point of the platform. Every other feature depends on a verified, authenticated identity.

---

# Scope

- User Registration
- Email Verification
- Login
- JWT Access Tokens
- Refresh Token Rotation
- Logout
- Password Reset Flow
- Password Change
- Account Suspension

---

# Business Rules

1. Users must verify their email before accessing any protected feature.
2. Passwords must be at least 8 characters with at least one uppercase letter and one digit.
3. Passwords are stored as bcrypt hashes (rounds: 12). Plaintext passwords are never stored.
4. Access tokens expire after 15 minutes.
5. Refresh tokens expire after 7 days.
6. Refresh tokens are rotated on every use — old tokens are immediately invalidated.
7. A password reset invalidates all existing refresh tokens for the user.
8. Suspended accounts cannot log in.
9. Unverified accounts cannot log in.
10. Email addresses are unique across the platform.

---

# User Flow: Registration

```
Student enters: First name, Last name, Email, Password, Confirm Password
  ↓
Frontend validation (Zod)
  ↓
POST /api/v1/auth/register
  ↓
Backend validation (class-validator)
  ↓
Email uniqueness check
  ↓
bcrypt hash password
  ↓
Create user record (status: pending_verification)
  ↓
Create student profile record
  ↓
Publish UserRegistered event
  ↓
BullMQ sends verification email
  ↓
Return 201 — "Check your email"
```

---

# User Flow: Email Verification

```
Student receives email with verification link
  ↓
Clicks link → frontend extracts token from URL
  ↓
POST /api/v1/auth/verify-email { token }
  ↓
Token validated and checked for expiry
  ↓
User status updated to: active
  ↓
Return 200 — "Email verified"
```

---

# User Flow: Login

```
Student enters Email and Password
  ↓
Frontend validation
  ↓
POST /api/v1/auth/login
  ↓
User lookup by email
  ↓
bcrypt comparison
  ↓
Check: email verified, account active
  ↓
Issue access token (JWT, 15 min)
  ↓
Issue refresh token (opaque, 7 days, hashed in Redis)
  ↓
Return tokens + user object
  ↓
Frontend stores: access token in memory, refresh token in HttpOnly cookie
```

---

# User Flow: Token Refresh

```
Access token nearing expiry (or 401 received)
  ↓
POST /api/v1/auth/refresh { refreshToken }
  ↓
Validate refresh token against Redis hash
  ↓
Rotate: invalidate old token, issue new refresh token
  ↓
Issue new access token
  ↓
Return new token pair
```

---

# User Flow: Password Reset

```
Student clicks "Forgot Password"
  ↓
POST /api/v1/auth/forgot-password { email }
  ↓
Backend always returns 200 (prevents enumeration)
  ↓
If user exists: generate reset token (TTL: 1 hour)
  ↓
BullMQ sends reset email
  ↓
Student clicks reset link → frontend extracts token
  ↓
POST /api/v1/auth/reset-password { token, newPassword, confirmPassword }
  ↓
Token validated
  ↓
Password hashed and updated
  ↓
All refresh tokens invalidated
  ↓
BullMQ sends "password changed" email
```

---

# Security Requirements

- Passwords hashed with bcrypt, rounds: 12
- JWT signed with RS256 or HS256 (configured via environment)
- Refresh tokens stored as SHA-256 hashes in Redis, never in plaintext
- Reset and verification tokens are cryptographically random (32 bytes)
- All token lookups use constant-time comparison
- Login endpoint rate-limited: 10 requests / 15 minutes per IP
- Verification and reset endpoints rate-limited: 3 requests / hour per email
- HTTPS enforced in production
- Access token stored in memory only — never in localStorage

---

# RBAC Roles

| Role | Description |
|------|-------------|
| student | Default role on registration |
| admin | Platform administrator |

---

# Database Dependencies

Collections:

- users
- student_profiles
- refresh_tokens (Redis)
- password_reset_tokens (TTL index)
- email_verification_tokens (TTL index)

---

# API Dependencies

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/refresh
- POST /api/v1/auth/verify-email
- POST /api/v1/auth/resend-verification
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password
- GET /api/v1/auth/me
- PATCH /api/v1/auth/me
- PATCH /api/v1/auth/change-password

---

# Acceptance Criteria

- [ ] A student can register with a valid email and password
- [ ] Duplicate email registration is rejected with a 409 error
- [ ] Verification email is sent on registration
- [ ] Student cannot log in before verifying email
- [ ] Student can log in with correct credentials after verification
- [ ] Incorrect credentials return 401
- [ ] Suspended accounts return 403
- [ ] Access tokens expire after 15 minutes
- [ ] Refresh tokens rotate on use
- [ ] Password reset works end-to-end
- [ ] All refresh tokens are invalidated after password reset
- [ ] Rate limiting is enforced on login and reset endpoints

---

# Future Enhancements

- OAuth (Google, GitHub)
- Two-Factor Authentication (TOTP)
- Magic Link login
- Session management dashboard (view and revoke devices)

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
