---
phase: 01-canonical-puerta-dataset
plan: 01
subsystem: data
tags: [typescript, vitest, zod, pnpm, canonical-ids, provenance, validation]
requires: []
provides:
  - root pnpm workspace scripts and lockfile for Phase 1 validation
  - stable canonical ID grammar for rules-facing entities
  - provenance-aware canonical record schema with source and evidence layers
  - executable precedence helpers and VALI-04 schema contract tests
affects: [01-02, 01-03, data-extractor, rules-engine, sharing]
tech-stack:
  added: [pnpm-workspace, typescript-5.9.2, vitest-4.0.16, zod-4.3.5]
  patterns: [compiler-first contract tests, namespaced canonical IDs, runtime-truth-vs-evidence separation]
key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - vitest.config.ts
    - .gitignore
    - packages/rules-engine/src/contracts/canonical-id.ts
    - packages/data-extractor/src/contracts/canonical-record.ts
    - packages/data-extractor/src/contracts/source-precedence.ts
    - tests/phase-01/schema-contract.spec.ts
  modified:
    - tsconfig.base.json
key-decisions:
  - "Canonical runtime entities use kind-prefixed stable IDs instead of Spanish display labels."
  - "Mechanical truth resolves manual override before Puerta snapshot before base-game data, while forum material remains evidence-only."
  - "The root typecheck config explicitly models the Vitest 4 environment and skips third-party lib checking so verification focuses on repo code."
patterns-established:
  - "Freeze extractor/runtime boundaries with Zod schemas before implementing data ingestion."
  - "Keep runtime truth layers separate from evidence layers so unverifiable forum claims cannot silently become legal planner data."
requirements-completed: [VALI-04]
duration: 10m
completed: 2026-03-29
---

# Phase 1 Plan 1: Freeze Canonical Schema, IDs, and Source Precedence Summary

**Root pnpm contract workspace with stable canonical ID schemas, provenance anchors, and executable precedence tests for Phase 1**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-29T22:19:43+02:00
- **Completed:** 2026-03-29T22:29:32+02:00
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added the root pnpm workspace, TypeScript baseline, Vitest config, and reproducible lockfile required to run Phase 1 contract checks.
- Defined canonical ID, canonical record, and source-precedence contracts that lock D-01 and D-02 into code instead of prose.
- Added `VALI-04` tests that prove stable IDs are accepted, Spanish display labels are rejected as IDs, and forum docs never become runtime truth implicitly.

## Task Commits

Each task was committed atomically:

1. **Task 1: Bootstrap the Phase 1 contract workspace and validation harness** - `232766d` (`chore`)
2. **Task 2: Define canonical record schemas, ID grammar, and precedence tests** - `35f00a7` (`feat`)

## Files Created/Modified
- `package.json` - Root workspace scripts and Phase 1 validation dependencies.
- `pnpm-workspace.yaml` - Workspace roots for `apps/*` and `packages/*`.
- `pnpm-lock.yaml` - Reproducible dependency lockfile generated via `corepack pnpm install --lockfile-only`.
- `tsconfig.base.json` - Strict root TypeScript configuration for packages and tests.
- `vitest.config.ts` - Root Vitest config scoped to `tests/phase-01/**/*.spec.ts`.
- `packages/rules-engine/src/contracts/canonical-id.ts` - Stable entity kinds, canonical ID type, and ID regex.
- `packages/data-extractor/src/contracts/canonical-record.ts` - Canonical record schema, source/evidence layers, and provenance anchor shape.
- `packages/data-extractor/src/contracts/source-precedence.ts` - Mechanical and evidence precedence exports plus runtime-truth helpers.
- `tests/phase-01/schema-contract.spec.ts` - `VALI-04` contract tests for IDs and precedence behavior.

## Decisions Made
- Stable canonical IDs are now `kind:value` identifiers and are explicitly decoupled from localized or forum-facing labels.
- Runtime truth uses only `manual-override`, `puerta-snapshot`, and `base-game`; `forum-doc` remains evidence until a curated override exists.
- The root TypeScript config includes DOM/Disposable libs and `skipLibCheck` so the Phase 1 gate typechecks this repo cleanly under Vitest 4 without being blocked by third-party declaration noise.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Bootstrapped pnpm through Corepack because pnpm was not installed**
- **Found during:** Task 1 (Bootstrap the Phase 1 contract workspace and validation harness)
- **Issue:** The environment had Node `v22.20.0` but no global `pnpm`, which blocked the required lockfile generation.
- **Fix:** Used `corepack pnpm install --lockfile-only` and `corepack pnpm install` to execute the plan with the pinned `pnpm@10.0.0` toolchain from `package.json`.
- **Files modified:** `pnpm-lock.yaml`
- **Verification:** `corepack pnpm install --lockfile-only`
- **Committed in:** `232766d`

**2. [Rule 3 - Blocking] Fixed the root TypeScript environment config so Vitest 4 declarations typecheck**
- **Found during:** Task 2 (Define canonical record schemas, ID grammar, and precedence tests)
- **Issue:** `pnpm exec tsc -p tsconfig.base.json --noEmit` failed on missing `Disposable`, `AbortSignal`, and other global types referenced from dependency declarations.
- **Fix:** Added DOM/Disposable libs and `skipLibCheck` to the root TS config so the workspace typecheck covers repo code reliably.
- **Files modified:** `tsconfig.base.json`
- **Verification:** `corepack pnpm exec tsc -p tsconfig.base.json --noEmit`
- **Committed in:** `35f00a7`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to satisfy the plan’s explicit verification gates. No scope creep.

## Issues Encountered
- `pnpm` was absent from the environment, so the workspace relies on `corepack pnpm` for verification until a global install exists.
- Vitest 4’s dependency declarations required a slightly broader root TS environment than the initial minimal config.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan `01-02` can build on a frozen canonical ID grammar, source-layer vocabulary, and reusable Phase 1 test harness.
- Plan `01-03` can reuse the runtime-truth vs evidence split when defining blocked and conflict handling.

## Self-Check: PASSED

- Verified the summary file and all 10 plan files exist on disk.
- Verified task commits `232766d` and `35f00a7` exist in git history.

---
*Phase: 01-canonical-puerta-dataset*
*Completed: 2026-03-29*
