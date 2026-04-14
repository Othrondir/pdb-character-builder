---
phase: 04-level-progression-class-path
plan: 01
subsystem: ui
tags: [react, zustand, routing, progression-rail, summary-panel]
requires:
  - phase: 03-02
    provides: legal foundation state, routed attributes gate, and shared summary vocabulary
provides:
  - fixed 1-16 progression fixture and dedicated progression Zustand store
  - single-screen `Construcción` board with foundation summary strip, rail, and active sheet
  - summary-panel target-level and plan-state wiring to real progression state
affects: [planner-shell, level-progression, phase-04-ui]
tech-stack:
  added: []
  patterns:
    - dedicated domain store for progression separate from foundation and shell chrome
    - single-route rail-plus-sheet composition for level editing
key-files:
  created:
    - apps/planner/src/features/level-progression/progression-fixture.ts
    - apps/planner/src/features/level-progression/store.ts
    - apps/planner/src/features/level-progression/selectors.ts
    - apps/planner/src/features/level-progression/build-progression-board.tsx
    - apps/planner/src/features/level-progression/foundation-summary-strip.tsx
    - apps/planner/src/features/level-progression/level-rail.tsx
    - apps/planner/src/features/level-progression/level-sheet.tsx
    - tests/phase-04/build-progression-shell.spec.tsx
    - tests/phase-04/level-timeline.spec.tsx
  modified:
    - apps/planner/src/routes/root.tsx
    - apps/planner/src/components/shell/summary-panel.tsx
    - apps/planner/src/lib/copy/es.ts
    - apps/planner/src/styles/app.css
key-decisions:
  - "Construcción stays a single routed screen; origin editing remains inline behind a toggle instead of moving to another route."
  - "Progression state uses a fixed 1-16 record array from the start so later legality work never relies on truncating state."
patterns-established:
  - "Progression summary projection pattern: shell status reads selector-derived active level, target level, and plan state instead of placeholder shell values."
  - "Phase 4 board pattern: secondary foundation strip above a primary rail-plus-sheet editor."
requirements-completed: [PROG-03]
duration: 1 session
completed: 2026-03-30
---

# Phase 04 Plan 01: Progression Scaffold Summary

**The Build route now exposes a real Phase 4 workspace with a fixed 1-16 timeline, an active level sheet, and foundation context kept inline**

## Accomplishments

- Added the Phase 4 progression fixture, dedicated Zustand store, and selector backbone for a stable `1-16` level record set with active-level selection.
- Replaced the Phase 3 origin-only root route with the single-screen progression board while preserving inline origin editing behind `Editar origen`.
- Wired the shell summary to real progression target-level and plan-state data instead of relying on section-level placeholders.
- Added render coverage for the new board shell and visible rail switching behavior.

## Verification

- `corepack pnpm vitest run tests/phase-04/build-progression-shell.spec.tsx tests/phase-04/level-timeline.spec.tsx --reporter=dot`
- `corepack pnpm exec tsc -p tsconfig.base.json --noEmit`
- `corepack pnpm build:planner`

## Notes

- Routed jsdom tests still emit the non-blocking `window.scrollTo()` warning.
- No code commit was created in this execution pass; work currently exists in the working tree.

---
*Phase: 04-level-progression-class-path*
*Completed: 2026-03-30*
