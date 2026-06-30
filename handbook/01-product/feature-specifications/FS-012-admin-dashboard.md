# Feature Specification: Admin Dashboard

**Document ID:** FS-012

**Version:** 1.0.0

**Status:** DRAFT

**Priority:** Medium

**Owners:** Rishi Mahajan, Krutika Wagh

---

# Purpose

Define the administrator dashboard — a management console providing platform oversight, user management, content monitoring, AI usage tracking, and system health visibility.

---

# Scope

- Platform Statistics Overview
- User Management
- Student Progress Monitoring
- Content Monitoring (Lessons, Quizzes, Documents)
- AI Usage and Cost Analytics
- Audit Logs
- System Health
- Basic Configuration

---

# Business Rules

1. The admin dashboard is accessible only to users with the admin role.
2. Admins can view any student's progress and activity.
3. Admins cannot view the content of a student's documents.
4. Admins can suspend and restore user accounts.
5. Admins can change user roles.
6. All admin actions are recorded in the audit log.
7. Audit logs are immutable — admins cannot delete audit log entries.
8. Admins can view AI usage statistics and token consumption.
9. Admins can adjust basic system configuration.
10. The dashboard must load quickly — use cached statistics for summary widgets.

---

# Dashboard Sections

## 1. Overview

Key metrics displayed as summary cards:

- Total users (and new this week)
- Active users (last 7 days)
- Lessons generated (this month)
- Quizzes generated (this month)
- Documents uploaded (this month)
- AI requests today
- Token usage this month
- Failed AI requests rate

## 2. User Management

- Searchable, paginated user table
- Columns: Name, Email, Role, Status, Mastery Level, Last Active
- Actions: View Profile, Change Role, Suspend, Restore, Delete
- User detail view: activity history, progress metrics

## 3. Content Monitoring

- List of all generated lessons (filterable by user, topic, date)
- List of all generated quizzes
- List of all uploaded documents (title, type, size, status, owner)
- No access to document content

## 4. AI Usage

- Total tokens used (input / output / total)
- Estimated cost this month
- Breakdown by workflow (lesson gen, quiz gen, tutor chat, etc.)
- Failure rate and error types
- Top users by token consumption

## 5. Audit Logs

- Chronological list of all admin actions
- Columns: Action, Actor, Target, Details, Timestamp, IP Address
- Filterable by action type and date range

## 6. System Health

- Service status: backend, AI platform, MongoDB, Redis, BullMQ
- Queue health: pending, active, completed, failed jobs per queue
- Uptime indicators

---

# User Flow: Admin Login and Dashboard

```
Admin logs in via same login flow as students
  ↓
Backend issues JWT with role: admin
  ↓
Frontend detects admin role
  ↓
Frontend routes to /admin (admin layout)
  ↓
GET /api/v1/admin/stats (cached summary)
  ↓
Dashboard renders overview cards
```

---

# Database Dependencies

- users
- student_profiles
- lessons
- quizzes
- documents
- behaviour_events
- audit_logs
- ai_usage_logs
- system_metrics

---

# API Dependencies

- GET /api/v1/admin/stats
- GET /api/v1/admin/users
- GET /api/v1/admin/users/:id
- GET /api/v1/admin/users/:id/activity
- GET /api/v1/admin/users/:id/progress
- PATCH /api/v1/admin/users/:id/role
- POST /api/v1/admin/users/:id/suspend
- POST /api/v1/admin/users/:id/restore
- DELETE /api/v1/admin/users/:id
- GET /api/v1/admin/analytics/platform
- GET /api/v1/admin/analytics/ai-usage
- GET /api/v1/admin/analytics/students
- GET /api/v1/admin/content/lessons
- GET /api/v1/admin/content/documents
- GET /api/v1/admin/audit-logs
- GET /api/v1/admin/health
- GET /api/v1/admin/health/queues
- GET /api/v1/admin/config
- PATCH /api/v1/admin/config

---

# Acceptance Criteria

- [ ] Admin can access the dashboard after logging in with admin role
- [ ] Students are redirected away from /admin
- [ ] Overview shows accurate summary statistics
- [ ] Admin can search and filter users
- [ ] Admin can view a student's activity history and progress
- [ ] Admin can suspend a user with a reason
- [ ] Admin cannot suspend another admin
- [ ] All admin actions appear in the audit log
- [ ] Admin can view AI usage breakdown
- [ ] Admin can view system health status
- [ ] Admin can view queue health

---

# Future Enhancements

- Email reports (weekly admin digest)
- Anomaly detection alerts (unusual AI usage, spike in failures)
- Content quality review interface
- Bulk user management actions
- Export data as CSV

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial feature specification created. |
