# Document Metadata

**Document ID:** DEV-04

**Title:** Code Review Standards

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Development

**Priority:** High

---

# Purpose

Define the code review process, reviewer responsibilities, and quality gates for the GenLearn project.

---

# Why Code Review Matters

- Catches bugs before they reach develop
- Shares knowledge between team members
- Enforces consistent standards
- Documents reasoning in commit and PR history

---

# Review Process

## Submitter Responsibilities

Before requesting a review:

- [ ] PR passes all automated checks (lint, type-check, tests)
- [ ] PR description is complete (what, why, how tested)
- [ ] Self-review completed — read your own diff
- [ ] No unrelated changes in the PR
- [ ] Relevant handbook docs updated if applicable
- [ ] No debug code, no commented-out code, no console.log

## Reviewer Responsibilities

- Review within 24 hours of assignment.
- Comment on the code, not the person.
- Distinguish between required changes and suggestions.
- Mark comments clearly: `[required]`, `[suggestion]`, `[question]`, `[nit]`.

---

# Review Focus Areas

## Correctness

- Does the code do what the PR description claims?
- Are edge cases handled?
- Are inputs validated?
- Are errors handled correctly?

## Architecture

- Does the code follow Clean Architecture layers?
- No business logic in controllers?
- No database queries outside repositories?
- No coupling that violates the dependency rule?

## Security

- No hardcoded secrets or credentials
- No SQL/NoSQL injection risks
- No raw user input passed to system commands
- JWT and auth logic unchanged unless the PR is specifically about auth
- No data leaked to clients that should be server-side

## Performance

- No N+1 query patterns
- Appropriate indexes used for database queries
- No unbounded queries (missing pagination)
- Caching used where appropriate

## Testability

- Business logic is testable in isolation
- New features have tests
- Edge cases covered

## Readability

- Naming follows conventions in DEV-01
- No methods longer than ~40 lines
- Complex logic has a brief explanatory comment

---

# Comment Format

```
[required] The refresh token must be invalidated before issuing a new one — 
           otherwise the old token remains valid.

[suggestion] Consider extracting this mastery calculation into a domain service 
             so it can be tested independently.

[question] Why is the tolerance set to 0.05 here? Is this documented in the 
           adaptive engine spec?

[nit] Missing semicolon — minor, fix at your discretion.
```

---

# Merge Criteria

A PR may be merged when:

- All `[required]` comments are resolved
- At least one approval from the other team member
- All automated checks pass
- No unresolved threads

---

# What Reviewers Should NOT Do

- Block a PR over style preferences not in the coding standards
- Request architectural changes that were not part of the agreed scope
- Leave vague comments without explanation
- Take more than 48 hours to review

---

# Self-Review Checklist

Read your diff from top to bottom before requesting review. Ask yourself:

- Would I be confident explaining every line of this code?
- Is there any logic I don't fully understand?
- Is there any code I'm not proud of?
- Have I tested the happy path and at least one failure path?

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial code review standards created. |
