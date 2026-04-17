---
phase: 07-magic-full-legality-engine
plan: 04
subsystem: rules-engine
tags: [magic, validation, cascade, sorcerer-swap, bard-swap, multiclass, cleric, typescript, vitest]

requires:
  - phase: 07-01
    provides: "aggregateMagicLegality, MagicLevelInput/Revalidation contracts, Spanish copy keys"
  - phase: 07-02
    provides: "MagicBoard store slice and selectors, domain/spell paradigms"
  - phase: 07-03
    provides: "Magic aggregator wired into shell summary, center-content routing, SwapSpellDialog scaffold"
provides:
  - "CR-02 fix: aggregator STATUS_ORDER matches selector (illegal=0, blocked=1, pending=2, legal=3)"
  - "CR-01 fix: applySwap mutates knownSpells (forgotten removed, learned inserted at same bucket)"
  - "MagicLevelInput.classId field plus swap-cadence validation using lvl.classId (no max-level heuristic)"
  - "WR-02 fix: selectMagicSheetTabView runs evaluateSpellPrerequisites + detectMissingSpellData per row and increments invalidCount"
  - "WR-01 fix: dispatchParadigm uses buildState.classLevels['class:cleric'] === 1 for first-cleric-level detection"
  - "WR-06 fix: ConfirmDialog accepts confirmDisabled; SwapSpellDialog steps 1 and 2 disable Aceptar until row selected"
  - "Spanish copy key swapOutOfCadence under shellCopyEs.magic"
  - "5 new test assertions locking the closed gaps"
affects: [07-05-sorcerer-catalog, 08-share-export]

tech-stack:
  added: []
  patterns:
    - "Per-row validation helper (validateSpellRow) mirrors feat-prerequisite pattern in selectMagicSheetTabView"
    - "classId threaded through MagicLevelInput instead of re-deriving via max(buildState.classLevels)"
    - "ConfirmDialog gains confirmDisabled prop passed through to NwnButton's native disabled attribute"

key-files:
  created:
    - tests/phase-07/magic-sheet-tab-validation.spec.ts
    - tests/phase-07/paradigm-dispatch.spec.ts
  modified:
    - packages/rules-engine/src/magic/magic-legality-aggregator.ts
    - packages/rules-engine/src/magic/magic-revalidation.ts
    - apps/planner/src/features/magic/store.ts
    - apps/planner/src/features/magic/selectors.ts
    - apps/planner/src/features/magic/swap-spell-dialog.tsx
    - apps/planner/src/components/ui/confirm-dialog.tsx
    - apps/planner/src/lib/copy/es.ts
    - tests/phase-07/magic-legality-aggregator.spec.ts
    - tests/phase-07/magic-store.spec.ts
    - tests/phase-07/magic-revalidation.spec.ts

key-decisions:
  - "Added classId as a first-class MagicLevelInput field rather than re-deriving at validation time — eliminates the max-reduce heuristic over buildState.classLevels that would misfire for Fighter-3/Sorcerer-1 builds"
  - "dispatchParadigm signature keeps characterLevel parameter to preserve contract stability; cleric branch reads classLevels instead and marks characterLevel as explicitly unused via void"
  - "validateSpellRow is an inline closure over buildState rather than a top-level helper — keeps the validation logic inside the selector that already builds per-level buildState"
  - "swapOutOfCadence copy key lives next to other rejection prefixes in shellCopyEs.magic; the revalidator emits the issue via createIllegalIssue and UI can surface the copy in a future plan"

patterns-established:
  - "Gap closure plans (type: execute + gap_closure: true) follow a per-blocker commit granularity (one commit per VERIFICATION.md gap)"
  - "Dynamic spell lookup in tests (filter by classLevels map) avoids hardcoded slug drift across 07-05 catalog regen"

requirements-completed: [LANG-02, MAGI-01, MAGI-03, VALI-01, VALI-03]

duration: 9min
completed: 2026-04-17
---

# Phase 07 Plan 04: Gap Closure Summary

**Four correctness blockers from 07-VERIFICATION.md closed: applySwap mutates knownSpells, aggregator STATUS_ORDER aligned with selector, sheet-tab per-row validation, and multiclass cleric domain-picker dispatch.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-17T12:16:39Z
- **Completed:** 2026-04-17T12:25:06Z
- **Tasks:** 4 (3 code tasks + 1 verification task)
- **Files created:** 2
- **Files modified:** 10

## Accomplishments

- **CR-01 closed:** `applySwap` now drops the forgotten spell from `knownSpells` and appends the learned spell at the same spell-level bucket; `swapsApplied` record still preserved.
- **CR-02 closed:** `magic-legality-aggregator.ts::STATUS_ORDER` matches `selectors.ts::STATUS_ORDER` exactly (`illegal=0, blocked=1, pending=2, legal=3`). A mixed pending+legal test with a hard `.toBe('pending')` assertion locks the contract.
- **WR-01 closed:** `dispatchParadigm(classId, characterLevel, classLevels)` now routes multiclass cleric builds through the domain picker on the FIRST cleric level (checked via `classLevels['class:cleric'] === 1`) instead of only at `characterLevel === 1`. Fighter-1/Cleric-2 now sees the domain picker at level 2.
- **WR-02 closed:** `selectMagicSheetTabView` no longer hardcodes `status: 'legal'`. Each row runs `evaluateSpellPrerequisites` + `detectMissingSpellData`; `invalidCount` increments for every non-legal row. The character-sheet tab can now display illegal and blocked spells.
- **WR-06 closed (side-effect):** `ConfirmDialog` gains a `confirmDisabled?: boolean` prop forwarded to the Aceptar NwnButton via native `disabled`. `SwapSpellDialog` steps 1 and 2 now disable the Aceptar button until a row is selected and replace the old `onConfirm={onClose}` trap with a documented no-op.
- **Swap-cadence guard added:** Revalidator walks `lvl.swapsApplied` and emits an illegal `ValidationOutcome` when a swap is applied outside SORCERER_SWAP_LEVELS (4, 8, 12, 16) or BARD_SWAP_LEVELS (5, 8, 11, 14). Uses `lvl.classId`, not a max-level heuristic.
- **Threading fix:** `MagicLevelInput` gains a `classId: CanonicalId | null` field; both `selectMagicBoardView` and `selectMagicSummary` populate it via the existing `getActiveClassAtLevel` helper.
- **Copy:** Spanish `swapOutOfCadence` rejection key added under `shellCopyEs.magic` for future UI surfacing.
- **Tests:** 5 new test assertions across 4 files; full phase-07 suite (58 tests) green; full project suite (317 tests) green; `scripts/verify-phase-07-copy.cjs` green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix aggregator STATUS_ORDER (CR-02) and add mixed-status test** — `41647f9` (fix)
2. **Task 2: applySwap mutates knownSpells + swap-cadence guard + dialog gating** — `c2e395f` (fix)
3. **Task 3: Per-row sheet validation + multiclass cleric dispatch** — `0c79fbf` (fix)
4. **Task 4: Full-suite smoke run** — no commit (verification only; 317 tests passed, copy verifier passed)

## Files Created/Modified

**Created:**
- `tests/phase-07/magic-sheet-tab-validation.spec.ts` — Unconditional test that a wizard-only spell added to a cleric build shows as non-legal with `invalidCount >= 1`.
- `tests/phase-07/paradigm-dispatch.spec.ts` — Fighter-1/Cleric-2 routes to `domains` at level 2; Cleric-1/Cleric-2 routes to `prepared-summary` at level 2.

**Modified:**
- `packages/rules-engine/src/magic/magic-legality-aggregator.ts` — STATUS_ORDER positions for legal/pending swapped to match selector canonical order.
- `packages/rules-engine/src/magic/magic-revalidation.ts` — Added `CanonicalId` import, SORCERER_SWAP_LEVELS/BARD_SWAP_LEVELS constants, `MagicLevelInput.classId` field, and swap-cadence validation pass that reads `lvl.swapsApplied` using `lvl.classId`.
- `apps/planner/src/features/magic/store.ts` — `applySwap` now mutates `knownSpells`: identifies the spell-level bucket holding the forgotten id, removes it, appends the learned id to the same bucket, and still records the `swapsApplied` entry.
- `apps/planner/src/features/magic/selectors.ts` — Imports `shellCopyEs`; `dispatchParadigm` accepts `classLevels` and reads `classLevels['class:cleric']` for first-cleric-level detection; `selectMagicBoardView` reorders `buildState`/`paradigm` computation so the new arg is available; both `MagicLevelInput` construction sites (`selectMagicBoardView`, `selectMagicSummary`) populate `classId` via `getActiveClassAtLevel`; `selectMagicSheetTabView` replaces hardcoded `status: 'legal'` with a `validateSpellRow` helper that runs catalog fail-closed + prereq checks and increments `invalidCount`.
- `apps/planner/src/features/magic/swap-spell-dialog.tsx` — Steps 1 and 2 add `confirmDisabled={!forgetId}` / `confirmDisabled={!learnId}` and replace `onConfirm={onClose}` with a documented no-op (the row click handler sets state and triggers a rerender into the next step).
- `apps/planner/src/components/ui/confirm-dialog.tsx` — `ConfirmDialogProps` gains optional `confirmDisabled`; the Aceptar `NwnButton` forwards it via native `disabled`.
- `apps/planner/src/lib/copy/es.ts` — Adds `swapOutOfCadence` key with Spanish explanation of legal swap cadence.
- `tests/phase-07/magic-legality-aggregator.spec.ts` — Adds new mixed-status test with hard `.toBe('pending')`; `emptyLevelInput` helper extended with optional `classId` parameter; 4 inline `MagicLevelInput` literals updated with `classId: null`.
- `tests/phase-07/magic-store.spec.ts` — Adds new test that seeds level 4 with a wizard-level-1 spell, applies swap, and asserts the forgotten id is removed while the learned id appears in the same bucket (dynamic slug lookup).
- `tests/phase-07/magic-revalidation.spec.ts` — Adds `CanonicalId` import, updates `emptyMagicLevelInput` helper and 3 inline literals with `classId`, adds two new swap-cadence tests (illegal at out-of-cadence level 3, accepted at sorcerer swap level 4).

## Decisions Made

- **classId as a first-class `MagicLevelInput` field (not a max-reduce heuristic):** The plan explicitly called for threading `classId` from the level record, not deriving it at validation time. This protects Fighter-3/Sorcerer-1 and similar builds where the Fighter class level would otherwise dominate a max-reduce over `buildState.classLevels`.
- **`dispatchParadigm` signature stability:** The `characterLevel` parameter is retained even though the cleric branch no longer reads it. Marked explicitly unused via `void characterLevel` to keep lint/strict TS happy. Future paradigms can still access it without a signature churn.
- **`validateSpellRow` is an inline closure** over `buildState`, not a top-level helper. This keeps the per-level `buildState` (already computed by the selector) in scope without plumbing it through a separate function. Mirrors the feats selector pattern.
- **Dynamic spell lookup in tests** — both the new store and revalidation tests filter `compiledSpellCatalog.spells` rather than hardcoding `spell:misil-magico` / `spell:rayo-de-fuego`. This protects against slug drift when Plan 07-05 regenerates the sorcerer catalog.

## Deviations from Plan

None — plan executed exactly as written.

One minor lint-prevention adjustment: `dispatchParadigm` now includes `void characterLevel;` to mark the now-unused parameter without removing it from the signature. The plan instructed "Do NOT delete the parameter — it's still passed at the call site" — the `void` cast silences TypeScript's `noUnusedParameters` while preserving the documented intent. This is a zero-behavior change and is considered within-plan scope per the Rule 3 deviation guideline for blocking issues (the build would fail under strict noUnusedParameters otherwise).

## Issues Encountered

None. All three code tasks + verification task ran cleanly on first execution. No test regressions, no TypeScript compile errors, no copy verifier failures.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 07-05 (sorcerer catalog regeneration) is the remaining gap from 07-VERIFICATION.md. The dynamic-slug test pattern used here will continue to hold after the catalog regen.
- Phase 7 plan counter advances. When 07-05 lands, Phase 7 closes and flows into Phase 8 (share/export).
- The ConfirmDialog `confirmDisabled` prop is now available for any future multi-step dialog that needs to gate Aceptar on selection state.

## Self-Check: PASSED

Verification of claims:

**Files created:** Both exist.
- `tests/phase-07/magic-sheet-tab-validation.spec.ts`: FOUND
- `tests/phase-07/paradigm-dispatch.spec.ts`: FOUND

**Files modified:** All confirmed via `git log --name-only` of the 3 task commits.

**Commits exist in local history:**
- `41647f9`: FOUND (Task 1 — aggregator STATUS_ORDER)
- `c2e395f`: FOUND (Task 2 — applySwap + swap-cadence + dialog gating)
- `0c79fbf`: FOUND (Task 3 — per-row validation + multiclass dispatch)

**Test suite:** 317/317 green; phase-07 58/58 green.
**Copy verifier:** `node scripts/verify-phase-07-copy.cjs` → OK.
**Acceptance criteria grep checks:** All passed (STATUS_ORDER positions, `classId` field, `SORCERER_SWAP_LEVELS`, `BARD_SWAP_LEVELS`, `confirmDisabled`, `validateSpellRow` occurrences, no `setClassAtLevel` in tests).

## TDD Gate Compliance

This plan is `type: execute` with `gap_closure: true`, not `type: tdd`. RED/GREEN/REFACTOR gate sequence does not apply to gap closure plans. Each fix is committed with tests that lock the new behavior (e.g., mixed-status aggregator test, applySwap knownSpells test, swap-cadence revalidation tests, per-row validation test, multiclass paradigm test).

---
*Phase: 07-magic-full-legality-engine*
*Completed: 2026-04-17*
