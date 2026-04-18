---
phase: 10-integration-fixes
plan: 02
subsystem: ui
tags: [react, zustand, zod, dexie, vitest, testing-library, persistence, sharing]

requires:
  - phase: 08
    provides: diffRuleset, VersionMismatchDialog, downloadBuildAsJson, LoadSlotDialog, saveSlot/loadSlot, buildDocumentSchema, RulesetDiff type
  - phase: 10-01
    provides: tests/phase-10/ directory convention + createElement+fireEvent tsx test pattern
  - phase: 10-03
    provides: origin-board null-dispatch pattern (parallel integration fix landed on master before this plan)

provides:
  - LoadSlotDialog.onPick now gates on diffRuleset BEFORE hydrateBuildDocument (D-07 / SHAR-05 fail-closed parity with share + JSON-import paths)
  - Mismatch branch renders VersionMismatchDialog with Descargar JSON ('build-incompatible' filename prefix) + Cancelar terminal actions; neither hydrates
  - useEffect resets local mismatch state when the parent closes the dialog so it does not leak across reopens
  - tests/phase-10/load-slot-version-mismatch.spec.tsx pins both branches (match -> hydrate, mismatch -> dialog + no hydration)

affects: [persistence, sharing, load-slot-flow, SHAR-02, SHAR-05, D-07]

tech-stack:
  added: []
  patterns:
    - "Slot-load fail-closed: diffRuleset(doc) gates between loadSlot and hydrateBuildDocument, mirroring share-entry.tsx:62-72"
    - "Single UI surface: VersionMismatchDialog now serves share-URL, JSON-import, and slot-load parity (no new dialog component, no duplicated diff logic)"
    - "Phase-10 tsx Dexie-backed spec: reuses phase-08 setup.ts (fake-indexeddb + sampleBuildDocument) via relative import; __resetPlannerDbForTests + deleteDatabase between cases"

key-files:
  created:
    - tests/phase-10/load-slot-version-mismatch.spec.tsx
  modified:
    - apps/planner/src/features/summary/save-slot-dialog.tsx

key-decisions:
  - "Mirrored share-entry.tsx precedent exactly: same diffRuleset-before-hydrate order, same 'build-incompatible' filename prefix for downloadBuildAsJson, same VersionMismatchDialog invocation shape. No new component, no new copy keys (shellCopyEs.persistence.versionMismatch is already defined)."
  - "SaveSlotDialog left untouched — saved docs always embed the current ruleset at save time (projection reads the live planner state), so the version-parity concern is strictly on the load path."
  - "Added a second useEffect to clear mismatch state when the parent closes the dialog instead of folding the reset into the existing showModal/close effect — cleaner separation of concerns and matches the narrow parent-open signal."
  - "Test uses createElement + fireEvent + relative import of phase-08 setup.ts (not JSX, not user-event, not vitest-config-wired setupFiles) — same phase-10 tsx convention already established by 10-01 and 10-03 specs."
  - "Test resets the Dexie singleton and wipes the fake-indexeddb DB between cases (same pattern as tests/phase-08/slot-api.spec.ts) so saveSlot/listSlots state does not leak across the match and mismatch scenarios."

patterns-established:
  - "Single-UI-surface rule for version-mismatch: all three load pathways (share, JSON-import, slot-load) route through VersionMismatchDialog with Descargar JSON + Cancelar terminals"
  - "tests/phase-10 Dexie-backed tsx spec recipe: @vitest-environment jsdom + import '../phase-08/setup' + __resetPlannerDbForTests + manual deleteDatabase + createElement(LoadSlotDialog) + fireEvent"

requirements-completed: [SHAR-02, SHAR-05]

duration: 6m
completed: 2026-04-18
---

# Phase 10 Plan 02: LoadSlotDialog Version-Mismatch Gate Summary

**Extended the D-07 fail-closed diffRuleset gate to the Cargar (load-slot) flow so a slot saved under a different rulesetVersion or datasetId routes through the same VersionMismatchDialog as share-URL and JSON-import, closing SHAR-02 + SHAR-05 without adding a new component, copy key, or persistence helper.**

## Performance

- **Duration:** ~6 minutes (wall-clock between the first task commit and the plan-metadata commit)
- **Started:** 2026-04-18T14:55:00Z (approx — based on prompt arrival)
- **Task 1 committed:** 2026-04-18T13:01:30Z (commit `a076d82`)
- **Task 2 committed:** 2026-04-18T13:02:42Z (commit `076e715`)
- **Tasks:** 2/2
- **Files modified:** 2 (1 src + 1 test)

## Accomplishments

- LoadSlotDialog.onPick now calls `diffRuleset(doc)` between `loadSlot` and `hydrateBuildDocument`. A non-null diff sets a local mismatch state and returns before the hydration call — the failure mode is fully symmetric with share-entry.tsx:62-72.
- On mismatch, VersionMismatchDialog renders alongside the existing `<dialog>` via a React fragment. Descargar JSON downloads the incoming doc with the 'build-incompatible' filename prefix (matching share-entry's chosen value) and closes; Cancelar closes. Neither terminal hydrates.
- A secondary `useEffect` clears the mismatch state when the parent flips `open` to false, preventing stale mismatch payloads from leaking if the dialog is reopened on a different slot.
- `tests/phase-10/load-slot-version-mismatch.spec.tsx` pins both branches: matching slot hydrates (`foundation.raceId === 'race:human'`), mismatching slot renders `/Versión incompatible/` and leaves `foundation.raceId === null`. Cancelar on the mismatch dialog closes without mutating the store.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add diffRuleset gate + VersionMismatchDialog branch to LoadSlotDialog** - `a076d82` (fix)
2. **Task 2: Regression test — slot-load mismatch branch (match + mismatch)** - `076e715` (test)

**Plan metadata:** (current commit — docs: write plan summary)

## Files Created/Modified

- `apps/planner/src/features/summary/save-slot-dialog.tsx` — LoadSlotDialog now imports diffRuleset, downloadBuildAsJson, VersionMismatchDialog, BuildDocument, RulesetDiff from the persistence barrel; adds mismatch state + reset effect; refactors onPick to gate on diffRuleset before hydrateBuildDocument; renders VersionMismatchDialog inside a fragment alongside the existing `<dialog>`.
- `tests/phase-10/load-slot-version-mismatch.spec.tsx` — new regression spec. Two cases: matching slot (hydrates, no dialog) and mismatching ruleset (no hydration, dialog visible, Cancelar closes without hydrating). Uses phase-08 `setup.ts` for the fake-indexeddb polyfill + `sampleBuildDocument` fixture, `__resetPlannerDbForTests` + explicit `deleteDatabase` between cases, and `createElement(LoadSlotDialog)` to stay consistent with the workspace's no-JSX tsx test convention.

## Decisions Made

- **Mirror share-entry exactly rather than refactor into a shared helper.** The plan explicitly prescribes the single-UI-surface rule and the diffRuleset→hydrate order; a shared helper would add indirection without reducing the two-call-site footprint. Kept the call-shape identical so future readers grep-navigate between the two files trivially.
- **Second useEffect instead of folding the reset into the show/close effect.** Clearer signal: one effect owns the native `<dialog>` showModal lifecycle, the other owns local mismatch-state cleanup when the parent signals close. Both react to `open`.
- **Reuse phase-08 `setup.ts` via relative import.** The plan authorized either inline fixture or re-export. Re-using the existing helper avoids fixture drift and the import works because `tests/phase-08/setup.ts` exports `sampleBuildDocument` and the top-level `import 'fake-indexeddb/auto'` runs as a side effect when imported.
- **createElement + fireEvent + no user-event.** Matches the workspace's existing phase-08 + phase-10 tsx conventions. vitest.config.ts does not wire `@vitejs/plugin-react`, and `@testing-library/user-event` is not installed.

## Deviations from Plan

None — plan executed exactly as written.

The plan's action block for Task 1 specified the exact import list, mismatch state shape, onPick refactor, second useEffect, and JSX return structure. All landed verbatim (adapted only to the file's existing import style — grouping the new imports with the rest of the persistence barrel).

The plan's Task 2 action block specified the exact describe/it structure, fixture shape, and assertions. Landed verbatim, with two minor conveniences noted in the plan itself:
- The inline fixture was replaced by importing `sampleBuildDocument` from `../phase-08/setup` (plan authorized: "inline fixture OR by re-exporting from setup.ts — executor's call").
- Added Dexie singleton reset + `deleteDatabase` between cases (plan asked for it implicitly via the "Dexie-backed slot-api tests with fake-indexeddb" reference to `tests/phase-08/slot-api.spec.ts`).

## Issues Encountered

- **`pnpm typecheck` not runnable:** The workspace's `pnpm` binary is not on PATH in this environment. Ran the underlying command `tsc -p tsconfig.base.json --noEmit` directly via the workspace's local `node_modules/.bin/tsc` — this is exactly what `pnpm typecheck` invokes per `package.json#scripts`.
- **Pre-existing typecheck errors:** 3 TS errors surface in `tests/phase-03/foundation-validation.spec.ts` (DeityRuleRecord / CanonicalId template literal drift). Confirmed baseline by stashing changes — same 3 errors appear without my edits. Zero new errors introduced; zero errors in `save-slot-dialog.tsx` or `load-slot-version-mismatch.spec.tsx`. Out of scope for this plan (scope-boundary rule from executor instructions).
- **`tsconfig.base.json` include list excludes tests/**/*.tsx:** The workspace only type-checks `tests/**/*.ts`, so the new `.tsx` spec is not covered by `tsc`. Vitest's esbuild transform validates the TSX at test run time; all phase-10 and phase-08 tests pass.

## Verification

All plan verification steps pass:

- `grep -q "diffRuleset" apps/planner/src/features/summary/save-slot-dialog.tsx` — present on lines 14, 127, 160.
- `grep -q "VersionMismatchDialog" apps/planner/src/features/summary/save-slot-dialog.tsx` — present on lines 4, 128, 163, 207.
- `grep -q "downloadBuildAsJson" apps/planner/src/features/summary/save-slot-dialog.tsx` — present on lines 15, 211.
- `grep -q "'build-incompatible'" apps/planner/src/features/summary/save-slot-dialog.tsx` — present on line 211.
- Order assertion: `diffRuleset(doc)` at line 160 comes before `hydrateBuildDocument(doc)` at line 167 inside `onPick`.
- `tsc -p tsconfig.base.json --noEmit` (equivalent to `pnpm typecheck`) — 3 pre-existing errors in `tests/phase-03/foundation-validation.spec.ts` unchanged by this plan; zero new errors.
- `vitest run tests/phase-10/load-slot-version-mismatch.spec.tsx` — 2/2 pass (match + mismatch branches).
- `vitest run tests/phase-10` — 9/9 pass across 4 files (new spec + all 10-01 and 10-03 regressions intact).
- `vitest run tests/phase-08` — 100/100 pass across 18 files (no regression from LoadSlotDialog refactor; the existing `save-slot-dialog.spec.tsx` suite that mocks the persistence barrel continues to pass unmodified).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 10 integration-fixes: Plan 02 closes SHAR-02 + SHAR-05. With 10-01 (FLOW-01), 10-03 (VALI-01), and now 10-02 landed, all three tracked integration-fix requirements for this phase are complete.
- No blockers. No deferred items.

## Self-Check: PASSED

Created files verified present on disk:
- `apps/planner/src/features/summary/save-slot-dialog.tsx` — FOUND (modified)
- `tests/phase-10/load-slot-version-mismatch.spec.tsx` — FOUND (created)

Task commits verified in git log:
- `a076d82` — FOUND (`fix(10-02): add diffRuleset gate to LoadSlotDialog.onPick before hydrateBuildDocument`)
- `076e715` — FOUND (`test(10-02): add load-slot version mismatch regression spec`)

---
*Phase: 10-integration-fixes*
*Completed: 2026-04-18*
