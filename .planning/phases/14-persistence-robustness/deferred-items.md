# Phase 14 — Deferred Items

Out-of-scope discoveries surfaced during plan execution. Tracked here so they
can be picked up in a follow-up plan or environment fix.

## 14-05 — phase-12.9 dexie module-resolution failure (worktree env)

- **Discovered:** 2026-04-25 during 14-05 execution.
- **Symptom:** `Failed to resolve import "dexie" from "apps/planner/src/features/persistence/dexie-db.ts"` when running `pnpm vitest run tests/phase-12.9/`.
- **Root cause (verified):** the parallel-executor worktree at `.claude/worktrees/agent-a9fab2f979b658595` has its own `node_modules/` that lacks the `dexie` package symlink. The pnpm store at `<repo>/node_modules/.pnpm/dexie@4.4.2/` is present but not surfaced into the worktree's top-level `node_modules`.
- **Pre-existing:** confirmed by stashing 14-05 changes via `git stash --keep-index` and re-running phase-12.9 — same 3 files fail with identical resolve error before any 14-05 file is touched.
- **Out of scope for 14-05:** plan 14-05 is a pure-helper refactor; ability-modifier delegation does not import dexie. Test failures are entirely unrelated to the migration.
- **Recommended fix (separate plan):** run `pnpm install` from inside the worktree, OR document that wave executors must run from the repo root and rely on hoisted node_modules. Likely 14-X persistence-robustness follow-up plan.
- **Affected files (all environment-only, not 14-05 changes):**
  - `tests/phase-12.9/resumen-identity-dedup.spec.tsx`
  - `tests/phase-12.9/resumen-progresion-full-width.spec.tsx`
  - 1 additional phase-12.9 spec failing the same import.
