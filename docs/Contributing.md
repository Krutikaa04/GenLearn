# Contributing

## Getting set up

Follow [Environment Setup](EnvironmentSetup.md) to run the stack locally, then
read the [Developer Guide](DeveloperGuide.md) for how the code is organized and
how to add features.

## Workflow

1. Branch from `master`.
2. Make focused changes that match existing conventions (see
   [Developer Guide](DeveloperGuide.md#coding-conventions-already-in-use)).
3. Add or update co-located tests.
4. Run the relevant checks before opening a PR:

   ```bash
   cd backend    && pnpm lint && pnpm test
   cd frontend   && pnpm lint && pnpm test && pnpm build
   cd ai-service && pytest
   ```
5. Open a pull request. The repository provides issue templates
   (`.github/ISSUE_TEMPLATE/`) and a CI workflow (`.github/workflows/ci.yml`)
   that runs on PRs.

## Conventions to respect

- Keep controllers thin; put logic in services.
- Preserve the `{ data }` / `{ error }` response envelopes.
- Default new adaptive/AI behavior **off** behind a feature flag so existing
  behavior is unchanged until enabled.
- Use soft deletes (`deletedAt`) for user-owned data.
- Reuse shared frontend UI primitives instead of duplicating markup.
- Never commit secrets; `.env` files are gitignored and documented via
  `.env.example`.

## Documentation

When a change affects behavior, structure, APIs, schema, or deployment, update
the relevant file in `docs/` in the same PR. Keep docs implementation-accurate
and cross-reference rather than duplicate.

## Commit messages

Write clear, imperative commit messages describing the change and its intent.

## Related documents
- [Developer Guide](DeveloperGuide.md) · [Backend](Backend.md) · [Frontend](Frontend.md)
