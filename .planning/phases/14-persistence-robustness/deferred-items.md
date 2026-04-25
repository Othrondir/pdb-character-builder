# Phase 14 — Deferred Items

Out-of-scope discoveries logged during plan execution. Not fixed by the discovering plan; tracked here for later triage.

## From 14-03 (build.name round-trip)

### Pre-existing: `dexie` module not resolvable in vitest run

- **Discovered during:** 14-03 verification battery (`pnpm vitest run tests/phase-08/share-url.spec.ts`)
- **Symptom:** `Error: Cannot find package 'dexie' imported from .../apps/planner/src/features/persistence/dexie-db.ts`
- **Verified pre-existing:** Reproduces with my changes stashed (no local changes; same failure on baseline `3053dcf`).
- **Also surfaces as:** `tsc --noEmit` errors at `dexie-db.ts:1,30,50,64` (all tracked as baseline per STATE.md).
- **Tests blocked:** `tests/phase-08/share-url.spec.ts`
- **Tests NOT blocked:** Round-trip identity for `build.name` is fully covered by `tests/phase-14/hydrate-build-name.spec.ts` B7 + `tests/phase-08/hydrate-build-document.spec.ts` round-trip case (both passing). The share-url path encodes the same projected `BuildDocument` object that 14-03 already locks down.
- **Suggested fix:** Add `dexie` to monorepo `devDependencies` (likely just a missing `pnpm install` after a recent dependency drift). Out of scope for 14-03.
