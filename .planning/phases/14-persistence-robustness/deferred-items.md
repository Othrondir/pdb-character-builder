# Phase 14 — Deferred Items

Out-of-scope discoveries surfaced during plan execution. Tracked here so they can be picked up in a follow-up plan or environment fix.

## 14-03 + 14-05 — `dexie` module-resolution failure (worktree env)

- **Discovered:** 2026-04-25 during 14-03 + 14-05 parallel execution (independently surfaced by both plans).
- **Symptom:**
  - vitest: `Failed to resolve import "dexie" from "apps/planner/src/features/persistence/dexie-db.ts"`
  - `tsc --noEmit`: errors at `dexie-db.ts:1,30,50,64` (already tracked as baseline per STATE.md).
- **Root cause (verified):** parallel-executor worktrees have their own `node_modules/` lacking the `dexie` symlink. Repo pnpm store at `<repo>/node_modules/.pnpm/dexie@4.4.2/` is present but not surfaced into the worktree-local `node_modules`.
- **Pre-existing:** verified via `git stash --keep-index` baseline reproduction on `3053dcf` (both 14-03 and 14-05 confirmed independently). No relation to either plan's source changes.
- **Tests blocked (all env-only, not plan changes):**
  - `tests/phase-08/share-url.spec.ts`
  - `tests/phase-12.9/resumen-identity-dedup.spec.tsx`
  - `tests/phase-12.9/resumen-progresion-full-width.spec.tsx`
  - +1 additional phase-12.9 spec failing the same import.
- **Tests NOT blocked:** round-trip identity for `build.name` (14-03) fully covered by `tests/phase-14/hydrate-build-name.spec.ts` B7 + `tests/phase-08/hydrate-build-document.spec.ts`; `abilityModifier` consolidation (14-05) covered by `tests/phase-14/ability-modifier.spec.ts`.
- **Recommended fix (separate plan):** run `pnpm install` from inside the worktree, OR document that wave executors must run from the repo root and rely on hoisted `node_modules`. Likely a 14-X follow-up plan or pre-execute environment guard.
