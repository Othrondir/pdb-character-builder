---
phase: 05-skills-derived-statistics
plan: 02
subsystem: ui
tags: [react, zustand, vitest, skills, selectors, nw1-ui]
requires:
  - phase: 05-01
    provides: compiled skill catalog, pure skill evaluation, preserve-first revalidation
provides:
  - routed Habilidades board with rail-plus-sheet editing
  - shared skill selector projections for rail, sheet, summary, and shell severity
  - Spanish skill ledger copy and route interaction coverage
affects: [phase-05-03, shell-summary, stats-route]
tech-stack:
  added: []
  patterns: [selector-driven skill board projection, preserve-first repair status in route UI]
key-files:
  created:
    - apps/planner/src/features/skills/selectors.ts
    - apps/planner/src/features/skills/skill-board.tsx
    - apps/planner/src/features/skills/skill-rail.tsx
    - apps/planner/src/features/skills/skill-sheet.tsx
    - apps/planner/src/features/skills/skill-summary-strip.tsx
    - tests/phase-05/skill-allocation-flow.spec.tsx
  modified:
    - apps/planner/src/routes/skills.tsx
    - apps/planner/src/features/skills/store.ts
    - apps/planner/src/lib/copy/es.ts
    - apps/planner/src/styles/app.css
    - apps/planner/src/components/shell/summary-panel.tsx
key-decisions:
  - "The Habilidades route projects all editable state through shared selectors instead of route-local legality math."
  - "Shell summary severity now reflects skill repair state once the user has entered skill allocations."
patterns-established:
  - "Skill board pattern: summary strip -> rail -> active sheet over compiled dataset evaluation."
  - "Skill edits preserve downstream rows and surface inherited repair state instead of truncating later levels."
requirements-completed: [SKIL-01, SKIL-02]
duration: 12min
completed: 2026-03-31
---

# Phase 5 Plan 2: Habilidades Route Summary

**Dataset-driven Habilidades editing with a routed rail-plus-sheet board, Spanish skill ledger copy, and preserved repair visibility in the shell summary**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-31T11:32:00Z
- **Completed:** 2026-03-31T11:44:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Replaced the placeholder `Habilidades` route with a real route-owned board driven by compiled-skill selectors and mutable store setters.
- Added a level-focused skill sheet with class or transclase costs, caps, point accounting, and preserved downstream repair messaging.
- Locked the route behavior with a jsdom flow spec and projected skill severity into the shell summary for consistent repair feedback.

## Task Commits

1. **Task 1: Build the shared Habilidades selectors and route-owned board** - `8e75583` (feat)
2. **Task 2: Apply Spanish copy, NWN1 board styling, and route interaction coverage** - `8620634` (feat)
3. **Auto-fix: tighten selector typing for workspace typecheck** - `e7b4beb` (fix)

## Files Created/Modified

- `apps/planner/src/features/skills/selectors.ts` - Projects rail entries, active sheet rows, summary strip data, and board state from compiled evaluation.
- `apps/planner/src/features/skills/skill-board.tsx` - Owns the routed Habilidades layout and empty-state framing.
- `apps/planner/src/features/skills/skill-rail.tsx` - Renders the level rail with repair and issue metadata.
- `apps/planner/src/features/skills/skill-sheet.tsx` - Binds active-level rank edits to the skill store with stepper and direct-input controls.
- `apps/planner/src/features/skills/skill-summary-strip.tsx` - Shows class, points, and current severity for the active level.
- `apps/planner/src/routes/skills.tsx` - Routes `/skills` to the real board instead of the generic placeholder view.
- `apps/planner/src/features/skills/store.ts` - Adds mutable setters for direct rank, increment, and decrement edits.
- `apps/planner/src/lib/copy/es.ts` - Adds the Spanish skill-ledger vocabulary and route description copy.
- `apps/planner/src/styles/app.css` - Extends the NWN1 board styling for skill rows, steppers, and grouped active-sheet sections.
- `apps/planner/src/components/shell/summary-panel.tsx` - Reflects skill invalid or blocked severity when the user has skill allocations.
- `tests/phase-05/skill-allocation-flow.spec.tsx` - Covers routed rail switching, class or transclase row context, and preserved downstream repair states.

## Decisions Made

- Kept skill legality and points entirely in selectors over the compiled catalog and rules helpers, so JSX only renders projections and dispatches mutations.
- Used the existing Phase 4 rail-plus-sheet interaction shape instead of adding a dense matrix, preserving the phase’s level-focused editing model.
- Extended the shell summary to consume skill severity because the UI contract required consistent repair status outside the active route.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added skill severity to the shell summary**
- **Found during:** Task 2
- **Issue:** The new route showed preserved repair state, but the persistent summary panel still ignored skill invalid or blocked allocations.
- **Fix:** Wired `summary-panel.tsx` to the skill rail projection so shell validation and plan-state labels reflect skill repair severity once allocations exist.
- **Files modified:** `apps/planner/src/components/shell/summary-panel.tsx`
- **Verification:** `corepack pnpm vitest --run tests/phase-05/skill-allocation-flow.spec.tsx --reporter=dot`
- **Committed in:** `8620634`

**2. [Rule 3 - Blocking] Corrected selector `skillId` typing for workspace typecheck**
- **Found during:** Plan-level verification
- **Issue:** `tsc --noEmit` rejected the selector row projection because compiled skill IDs were inferred as generic strings.
- **Fix:** Cast the compiled skill ID to `CanonicalId` at the selector boundary.
- **Files modified:** `apps/planner/src/features/skills/selectors.ts`
- **Verification:** `corepack pnpm exec tsc -p tsconfig.base.json --noEmit`
- **Committed in:** `e7b4beb`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes were required to keep the route and shell severity coherent and to pass workspace verification. No feature scope changed.

## Issues Encountered

- The route test initially exposed duplicate heading and ledger labels in the rendered page, so the spec was adjusted to assert the actual accessible surface instead of brittle single-element assumptions.
- Workspace typecheck surfaced a selector typing mismatch that the focused route test and build did not catch.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `Habilidades` now exposes the selector and status surface that Phase `05-03` can reuse for `Estadísticas` and deeper shell synchronization.
- The compiled skill board pattern is stable across tests, typecheck, and production build.

## Deviations Summary

- No known stubs in the files changed for this plan.

## Self-Check: PASSED

- Found `.planning/phases/05-skills-derived-statistics/05-02-SUMMARY.md`
- Found commit `8e75583`
- Found commit `8620634`
- Found commit `e7b4beb`
