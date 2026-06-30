# Document Metadata

**Document ID:** DEV-02

**Title:** Git Workflow

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Development

**Priority:** High

---

# Purpose

Define the Git branching strategy, commit message conventions, and pull request process for the GenLearn project.

---

# Branch Strategy

## Long-Running Branches

| Branch | Purpose |
|--------|---------|
| main | Production-ready code. Protected. |
| develop | Integration branch for completed features. |

## Short-Lived Branches

| Pattern | Purpose | Example |
|---------|---------|---------|
| feature/* | New features | `feature/auth-module` |
| bugfix/* | Bug fixes | `bugfix/refresh-token-rotation` |
| hotfix/* | Critical production fixes | `hotfix/login-500-error` |
| docs/* | Documentation only | `docs/update-learning-api` |
| refactor/* | Refactoring | `refactor/lesson-service` |

---

# Branch Rules

- `main` is protected — no direct pushes.
- `develop` is protected — no direct pushes.
- All work happens on feature branches.
- Feature branches are created from `develop`.
- Hotfixes are created from `main` and merged into both `main` and `develop`.
- Branches are deleted after merging.

---

# Commit Message Convention

GenLearn uses Conventional Commits.

Format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types

| Type | Use |
|------|-----|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| refactor | Code change that neither fixes a bug nor adds a feature |
| test | Adding or updating tests |
| chore | Build process or tooling changes |
| perf | Performance improvement |
| style | Formatting, missing semicolons — no logic change |
| ci | CI/CD changes |

## Scope Examples

```
auth, lesson, quiz, document, flashcard, recommendation, analytics, admin, ai, rag, adaptive, infra, config
```

## Examples

```
feat(auth): implement JWT refresh token rotation

fix(rag): correct cosine similarity threshold for chunk retrieval

docs(api): add Learning API endpoints to handbook

refactor(lesson): extract lesson mapper into separate class

test(quiz): add unit tests for quiz submission service

chore(docker): add health check to backend container
```

## Rules

- Description is lowercase, no period at the end.
- Description is imperative mood: "add" not "adds", "fix" not "fixed".
- Keep the subject line under 72 characters.
- Body explains WHY the change was made, not WHAT.
- Do not reference internal task IDs unless using a public tracker.

---

# Pull Request Process

## Creating a PR

1. Create a feature branch from `develop`.
2. Make commits following Conventional Commits.
3. Open a Pull Request targeting `develop`.
4. Fill in the PR template (see below).
5. Ensure all checks pass before requesting review.

## PR Template

```markdown
## What

Brief description of what this PR does.

## Why

Why this change is needed.

## Changes

- Bullet list of key changes.

## Testing

How the changes were tested.

## Documentation Updated

- [ ] Handbook updated if architecture changed
- [ ] API doc updated if endpoints changed
- [ ] Feature spec updated if behaviour changed
```

## PR Rules

- PRs must not break existing tests.
- PRs must pass lint and type checks.
- PRs must not include unrelated changes.
- PRs should be focused — one feature or fix per PR.
- Large features should be broken into smaller PRs where possible.

---

# Merge Strategy

- Squash and merge for feature branches (keeps develop history clean).
- Merge commit for hotfixes (preserves the hotfix boundary).
- Never force-push to `develop` or `main`.
- Never rebase public branches.

---

# Tag and Release Strategy

| Tag | Purpose |
|-----|---------|
| v0.x.x | Pre-release development |
| v1.0.0 | First production release |
| v1.x.x | Patch releases |
| v2.0.0 | Major version with breaking changes |

Tags are applied to `main` after deployment.

---

# .gitignore Rules

Always exclude:

```
node_modules/
dist/
.env
.env.local
*.env
__pycache__/
.venv/
*.pyc
.DS_Store
coverage/
```

Never commit API keys, credentials, or environment-specific configuration.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Git workflow document created. |
