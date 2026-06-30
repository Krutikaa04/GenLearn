# Document Metadata

**Document ID:** 08A

**Title:** Data Governance, Lifecycle & Compliance

**Version:** 1.0.0

**Status:** DRAFT

**Owners:**
- Rishi Mahajan
- Krutika Wagh

**Category:** Architecture

**Priority:** High

---

# Dependencies

- Document 07 – Domain Model
- Document 07A – Event-Driven Architecture
- Document 08 – Database Design

---

# Related Documents

- Document 09 – API Specification
- Document 10 – Authentication & Security
- Document 18 – Infrastructure & Deployment

---

# Purpose

This document defines how data is classified, stored, protected, retained, archived, deleted, backed up, restored, and governed throughout its lifecycle.

It establishes the governance policies required to ensure that GenLearn remains secure, maintainable, and compliant with modern software engineering practices.

---

# Scope

This document defines:

- Data Classification
- Data Ownership
- Privacy Principles
- Retention Policies
- Deletion Policies
- Backup Strategy
- Disaster Recovery
- Encryption
- Compliance Readiness
- Audit Requirements

---

# Data Governance Philosophy

Data is one of the most valuable assets of GenLearn.

Every piece of data must have:

- A clear owner
- A defined purpose
- A retention policy
- Access controls
- A deletion strategy

No data should exist without business justification.

---

# Data Classification

## Public

Examples

- Landing page content
- Public documentation

---

## Internal

Examples

- Analytics
- Platform metrics
- Prompt templates

---

## Confidential

Examples

- Student profiles
- Learning history
- AI conversations
- Uploaded documents

---

## Restricted

Examples

- Password hashes
- Refresh tokens
- API secrets
- Encryption keys

Restricted data receives the highest level of protection.

---

# Data Ownership

| Data | Owner |
|-------|--------|
| User | Identity Platform |
| Student Profile | Learning Platform |
| Lessons | Learning Platform |
| Documents | Knowledge Platform |
| AI Chats | AI Platform |
| Analytics | Analytics Platform |
| Audit Logs | Administration Platform |

Each platform owns its data and exposes it through well-defined APIs.

---

# Data Lifecycle

Every entity follows the same lifecycle:

```
Create

↓

Active

↓

Updated

↓

Archived

↓

Deleted
```

Deletion policies differ by data classification.

---

# Retention Policy

## Permanent

- Lessons
- Progress
- Student Profiles

---

## Long-Term

Retain for 5 years

- AI Conversations
- Documents
- Quiz Attempts

---

## Medium-Term

Retain for 1 year

- Behaviour Events
- AI Usage Logs

---

## Short-Term

Retain for 30 days

- Password Reset Tokens
- Email Verification Tokens

---

# Deletion Strategy

Preferred approach:

Soft Delete

Fields

- deletedAt
- deletedBy
- deletionReason

Hard delete is reserved for:

- Temporary tokens
- Expired sessions
- Cache entries

---

# Backup Strategy

Production backups include:

- Daily snapshots
- Point-in-time recovery
- Weekly full backup
- Monthly archival backup

Critical collections receive priority.

---

# Disaster Recovery

Recovery priorities:

1. Authentication
2. Student Profiles
3. Learning Progress
4. Documents
5. AI Conversations
6. Analytics

Target objectives:

RPO: 24 hours

RTO: 4 hours

These values may be improved in future enterprise deployments.

---

# Encryption

Data in Transit

- HTTPS
- TLS 1.3

Data at Rest

- MongoDB Atlas Encryption
- Cloud storage encryption

Secrets

- Environment variables
- Secret management services in production

Passwords

- bcrypt hashing

---

# Privacy Principles

The platform follows these principles:

- Data minimization
- Purpose limitation
- Least privilege
- Transparency
- User control
- Secure processing

Only data required to deliver educational functionality should be collected.

---

# Compliance Readiness

The MVP is designed with future compliance in mind.

Potential standards:

- India's Digital Personal Data Protection Act (DPDP)
- GDPR (European Union)
- SOC 2 (future enterprise goal)

Compliance features include:

- User consent architecture
- Audit logs
- Data deletion workflows
- Access controls

Formal certification is out of scope for the MVP.

---

# Audit Requirements

The following actions must be audited:

- Login
- Role changes
- User suspension
- Document deletion
- AI provider changes
- Administrative actions

Audit logs are immutable.

---

# Data Access Rules

- Students access only their own data.
- Administrators access data according to RBAC.
- AI Platform receives only the context required for inference.
- No frontend component accesses the database directly.

---

# Risks

- Unauthorized access
- Data leakage
- Backup corruption
- Excessive retention
- Privacy violations

Mitigation strategies include encryption, RBAC, audit logging, and automated backups.

---

# Assumptions

- MongoDB Atlas provides managed backups.
- Redis is non-persistent.
- Object storage is versioned.
- Cloud providers meet baseline security standards.

---

# Constraints

- Sensitive data must never appear in logs.
- API keys must never be persisted in source code.
- Personal data must remain within controlled storage.
- Data ownership follows bounded contexts.

---

# Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Soft delete | Recoverability | Additional storage |
| Daily backups | Simplicity | Potential 24-hour data loss |
| Immutable audit logs | Accountability | Larger storage footprint |

---

# Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Hard delete only | Poor recoverability |
| No audit logs | Insufficient accountability |
| Unlimited retention | Increased storage cost and privacy risk |

---

# Future Improvements

- Automated archival
- Customer-managed encryption keys
- Field-level encryption
- Regional data residency
- Compliance dashboards
- Data lineage tracking

---

# References

- MongoDB Atlas Backup Documentation
- NIST Cybersecurity Framework
- OWASP Top 10
- DPDP Act (India)
- GDPR

---

# Claude Code Implementation Instructions

1. Respect data ownership boundaries.
2. Implement soft delete where specified.
3. Never expose restricted data.
4. Encrypt all sensitive information.
5. Record audit events for privileged operations.
6. Apply retention policies consistently.
7. Ensure backup and restore procedures remain documented.

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | June 2026 | Initial Data Governance, Lifecycle & Compliance document created. |