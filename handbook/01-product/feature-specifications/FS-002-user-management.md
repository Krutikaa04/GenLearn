# Feature Specification: User Management

**Document ID:** FS-002

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** High

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define user profile management for students and administrative user management capabilities for admins.

---

# Scope

- Student Profile Setup and Update
- Student Preferences
- Admin User Listing
- Admin User Suspension and Restoration
- Admin Role Changes
- Admin User Deletion

---

# Business Rules

1. Every registered user automatically receives a student profile on registration.
2. A student profile is linked 1:1 with a user account.
3. Students can update their profile at any time.
4. Admins can view all users and their profiles.
5. Admins can suspend users — suspended users cannot log in.
6. Admins can restore suspended users.
7. Admins can change user roles.
8. User deletion is always soft — data is retained for audit purposes.
9. Admins cannot delete or suspend other admins.
10. All admin actions create audit log entries.

---

# Student Profile Fields

| Field | Type | Description |
|-------|------|-------------|
| grade | string | Academic grade or year |
| learningGoals | string[] | Topics the student wants to learn |
| interests | string[] | Subject areas of interest |
| preferredDifficulty | enum | beginner / intermediate / advanced |
| adaptiveScore | float | System-managed mastery score (0.0–1.0) |
| masteryLevel | enum | System-managed: beginner / intermediate / advanced |

---

# User Flow: Profile Update (Student)

```
Student navigates to Profile page
  ↓
Edits first name, last name, grade, learning goals, interests
  ↓
Frontend validates with Zod
  ↓
PATCH /api/v1/auth/me
  ↓
Backend validates and updates
  ↓
Returns updated profile
```

---

# User Flow: Admin User Management

```
Admin navigates to Users section
  ↓
GET /api/v1/admin/users (paginated, searchable)
  ↓
Admin searches or filters
  ↓
Admin clicks a user to view details
  ↓
GET /api/v1/admin/users/:userId
  ↓
Admin can: Change Role / Suspend / Restore / Delete
```

---

# Admin: Suspend User

```
Admin clicks Suspend
  ↓
Enters suspension reason
  ↓
POST /api/v1/admin/users/:userId/suspend { reason }
  ↓
User status updated to: suspended
  ↓
All refresh tokens invalidated (user forced out)
  ↓
Audit log entry created
```

---

# Database Dependencies

- users
- student_profiles
- audit_logs

---

# API Dependencies

- GET /api/v1/auth/me
- PATCH /api/v1/auth/me
- GET /api/v1/admin/users
- GET /api/v1/admin/users/:userId
- PATCH /api/v1/admin/users/:userId/role
- POST /api/v1/admin/users/:userId/suspend
- POST /api/v1/admin/users/:userId/restore
- DELETE /api/v1/admin/users/:userId

---

# Acceptance Criteria

- [ ] Student can update first name, last name, grade, learning goals, and interests
- [ ] Student cannot change their own role or email
- [ ] Adaptive score and mastery level are read-only on the student profile
- [ ] Admin can list all users with search and pagination
- [ ] Admin can view any user's full profile
- [ ] Admin can suspend a user with a reason
- [ ] Suspended user is immediately logged out
- [ ] Admin can restore a suspended user
- [ ] Admin can change a student to admin role
- [ ] Admin cannot suspend another admin
- [ ] All admin actions create audit log entries

---

# Future Enhancements

- Student avatar upload
- Learning goal suggestions from AI
- Profile completeness indicator
- Teacher role and profile

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
