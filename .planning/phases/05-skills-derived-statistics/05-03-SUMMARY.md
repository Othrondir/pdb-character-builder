---
phase: 05-skills-derived-statistics
plan: 03
subsystem: ui
tags: [react, typescript, zustand, vitest, skills, summary-panel, stats-route]
requires:
  - phase: 05-01
    provides: compiled skill catalog, evaluation helpers, and revalidation helpers
  - phase: 05-02
    provides: routed habilidades editor and shared skill selector pipeline
provides:
  - read-only Estadisticas route projected from the evaluated skill snapshot
  - shared skill summary selector for shell severity and plan-state labels
  - synchronization coverage across Habilidades, Estadisticas, and the shell summary
affects: [phase-05, skills, shell-summary, stats]
tech-stack:
  added: []
  patterns: [shared selector projections over evaluated skill snapshots, read-only technical board fed by rules-engine view models]
key-files:
  created:
    - packages/rules-engine/src/skills/skill-derived-stats.ts
    - apps/planner/src/features/skills/skill-stats-board.tsx
    - tests/phase-05/skill-stats-sync.spec.tsx
  modified:
    - apps/planner/src/routes/stats.tsx
    - apps/planner/src/components/shell/summary-panel.tsx
    - apps/planner/src/lib/copy/es.ts
    - apps/planner/src/styles/app.css
    - apps/planner/src/features/skills/selectors.ts
    - tests/phase-05/skill-allocation-flow.spec.tsx
key-decisions:
  - "Estadisticas reuses the active skill snapshot from the shared selector pipeline instead of recomputing caps, costs, or issues in JSX."
  - "The shell summary only lets progression override skill state when progression is actually blocked or illegal, so Phase 5 repair states remain visible during normal in-progress planning."
patterns-established:
  - "Rules-engine projection first: derive technical stats in pure TypeScript, then localize and format in planner selectors."
  - "Cross-surface synchronization tests should assert the same snapshot facts in Habilidades, Estadisticas, and the shell summary."
requirements-completed: [SKIL-02, SKIL-03]
duration: 12 min
completed: 2026-03-31
---

# Phase 05 Plan 03: Skills-Derived Statistics Summary

**Read-only Estadisticas panels and shell summary severity now project the same evaluated skill snapshot that drives Habilidades**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-31T11:48:05Z
- **Completed:** 2026-03-31T12:00:17Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added `deriveSkillStatsView(...)` and `selectSkillStatsView(...)` so the active skill snapshot can be rendered as a read-only technical board without route-local math.
- Replaced the placeholder `Estadisticas` route with `SkillStatsBoard`, including totals, caps or costs, and penalty or blocked-reason panels synchronized with the active Habilidades level.
- Added `selectSkillSummary(...)` and updated the shell summary so Phase 5 plan-state labels and repair severity stay aligned with skill edits and upstream progression repairs.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the shared derived-statistics projection and the read-only stats route** - `d6cfb32` (feat)
2. **Task 2: Synchronize shell summary severity with the Phase 5 skill state** - `4d36611` (feat)

**Additional auto-fix:** `61cdf47` (fix) resolved post-task type regressions found by full-plan verification.

## Files Created/Modified

- `packages/rules-engine/src/skills/skill-derived-stats.ts` - Pure derived-stat projection for totals, caps, costs, and penalties.
- `apps/planner/src/features/skills/selectors.ts` - Shared stats and summary selectors over the evaluated skill snapshot.
- `apps/planner/src/features/skills/skill-stats-board.tsx` - Read-only technical stats board for the `Estadisticas` route.
- `apps/planner/src/routes/stats.tsx` - Route ownership for the real stats screen.
- `apps/planner/src/components/shell/summary-panel.tsx` - Persistent summary integration for Phase 5 plan state and repair severity.
- `apps/planner/src/lib/copy/es.ts` - Spanish copy for stats groups and Phase 5 summary labels.
- `apps/planner/src/styles/app.css` - NWN1-styled stats board panels and rows.
- `tests/phase-05/skill-stats-sync.spec.tsx` - Sync coverage spanning Habilidades, Estadisticas, and the shell summary.
- `tests/phase-05/skill-allocation-flow.spec.tsx` - Updated summary assertion for Phase 5 repair vocabulary.

## Decisions Made

- Kept `Estadisticas` strictly read-only and technical by projecting one active-level view model from selectors instead of exposing an alternative editing surface.
- Used a dedicated `selectSkillSummary(...)` selector for Phase 5 plan-state vocabulary so the shell summary no longer infers skills from ad hoc rail scans alone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript regressions introduced by the new stats projection**
- **Found during:** Final verification
- **Issue:** Full `tsc` failed after task commits because a renamed selector view type and new derived penalty IDs did not align with canonical-id typing.
- **Fix:** Corrected the selector view-type reference and cast derived penalty `affectedIds` to canonical skill IDs inside the rules-engine projection.
- **Files modified:** `apps/planner/src/features/skills/selectors.ts`, `packages/rules-engine/src/skills/skill-derived-stats.ts`
- **Verification:** `corepack pnpm exec tsc -p tsconfig.base.json --noEmit`, `corepack pnpm vitest --run tests/phase-05/skill-stats-sync.spec.tsx tests/phase-05/skill-allocation-flow.spec.tsx --reporter=dot`, `corepack pnpm build:planner`
- **Committed in:** `61cdf47`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was required to make the plan pass workspace typecheck. No scope expansion.

## Issues Encountered

- Parallel git metadata checks returned stale hashes while commits were being created, so final commit recording was taken from explicit follow-up `git log` output instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 is now complete: Habilidades, Estadisticas, and the shell summary share one evaluated skill-state pipeline.
- Phase 6 can build feats and proficiencies on top of the now-stable Phase 5 legality and summary vocabulary.

## Self-Check

PASSED

---
*Phase: 05-skills-derived-statistics*
*Completed: 2026-03-31*
