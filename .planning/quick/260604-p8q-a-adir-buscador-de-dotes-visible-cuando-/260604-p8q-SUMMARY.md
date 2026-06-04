---
task: 260604-p8q
status: completed
date: 2026-06-04
commits:
  - c3305d5
  - 426e922
  - 171d7dd
files:
  - apps/planner/src/features/feats/feat-sheet.tsx
  - apps/planner/src/lib/copy/es.ts
  - apps/planner/src/styles/app.css
  - tests/phase-12.4/feat-picker-search-and-remove.spec.tsx
---

# Quick Task 260604-p8q Summary

Visible feat search now lives directly in the Dotes picker, filters only from 3 normalized characters onward, and selected feat rows/families now expose an explicit `Quitar` action without removing the old deselect behavior.

## Tasks Completed

1. Added the visible feat search UI and normalized 3+-character filtering in `feat-sheet.tsx`.
2. Surfaced explicit `Quitar` controls for selected simple rows and folded feat-family rows.
3. Added focused regression coverage for search behavior, clear behavior, and both remove affordances.

## Verification

- `pnpm exec vitest run tests/phase-12.4/feat-picker-search-and-remove.spec.tsx tests/phase-12.4/feat-family-expander.spec.tsx` ✅
- `pnpm exec tsc -p tsconfig.base.json --noEmit` ✅

## Verification Adaptation

`corepack` was not available in this shell (`corepack: command not found`), so the requested commands were run via direct `pnpm exec ...` equivalents.

## Deviations from Plan

None.

## Known Stubs

None found in the touched files.

## Threat Flags

None.
