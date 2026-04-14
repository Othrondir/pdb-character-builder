---
phase: 04-level-progression-class-path
plan: 03
subsystem: legality
tags: [rules-engine, react, vitest, multiclass, revalidation]
requires:
  - phase: 04-02
    provides: class catalog, prerequisite rows, gains ledger, and milestone ability editing
provides:
  - pure multiclass and commitment legality helpers
  - preserve-first downstream revalidation for the fixed 1-16 progression array
  - synchronized blocked/invalid repair state across rail, active sheet, summary strip, and summary panel
affects: [level-progression, planner-shell, phase-04-legality]
tech-stack:
  added: []
  patterns:
    - preserve-first downstream revalidation via pure helper projection
    - shared severity model reused by rail, sheet, strip, and shell summary
key-files:
  created:
    - packages/rules-engine/src/progression/multiclass-rules.ts
    - packages/rules-engine/src/progression/progression-revalidation.ts
    - tests/phase-04/multiclass-rules.spec.ts
    - tests/phase-04/progression-revalidation.spec.tsx
  modified:
    - apps/planner/src/features/level-progression/class-fixture.ts
    - apps/planner/src/features/level-progression/store.ts
    - apps/planner/src/features/level-progression/selectors.ts
    - apps/planner/src/features/level-progression/foundation-summary-strip.tsx
    - apps/planner/src/features/level-progression/level-rail.tsx
    - apps/planner/src/features/level-progression/level-sheet.tsx
    - apps/planner/src/components/shell/summary-panel.tsx
    - apps/planner/src/lib/copy/es.ts
    - apps/planner/src/styles/app.css
key-decisions:
  - "Earlier-level edits preserve downstream levels and revalidate them instead of deleting later work."
  - "Multiclass commitment and exception seams resolve in pure rules helpers, not in route-local button handlers."
patterns-established:
  - "Repair-state projection: inherited breaks surface as explicit blocked levels with a shared inline callout instead of silent drift."
  - "Progression severity synchronization: the most severe current path state flows into the Build strip and persistent summary panel."
requirements-completed: [FLOW-03, PROG-02, CLAS-03]
duration: 1 session
completed: 2026-03-30
---

# Phase 04 Plan 03: Multiclass Revalidation Summary

**Phase 4 now preserves downstream levels under change, enforces multiclass commitments and exceptions, and keeps repair severity synchronized across the progression UI**

## Accomplishments

- Added pure multiclass and exception helpers, including the explicit `puerta.shadowdancer-rogue-bridge` seam and minimum-class commitment enforcement.
- Added preserve-first progression revalidation so earlier edits no longer destroy later records; instead, downstream levels inherit blocked or invalid repair states.
- Wired the rail, active sheet, progression strip, and summary panel to the same revalidated severity model, including the exact repair callout copy.
- Added contract and UI tests covering commitment breaks, exception bypasses, downstream repair, and summary severity.

## Verification

- `corepack pnpm vitest run tests/phase-04/multiclass-rules.spec.ts tests/phase-04/progression-revalidation.spec.tsx --reporter=dot`
- `corepack pnpm exec tsc -p tsconfig.base.json --noEmit`
- `corepack pnpm build:planner`

## Notes

- The summary panel now reflects the most severe current progression state without regressing the Phase 3 foundation gate.
- No code commit was created in this execution pass; work currently exists in the working tree.

---
*Phase: 04-level-progression-class-path*
*Completed: 2026-03-30*
