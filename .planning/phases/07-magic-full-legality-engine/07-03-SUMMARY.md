---
phase: 07-magic-full-legality-engine
plan: 03
subsystem: planner-magic-integration
tags: [magic, aggregator, shell-wiring, spanish-copy, character-sheet, d-02-filter, smoke-tests]

# Dependency graph
requires:
  - phase: 07-magic-full-legality-engine (plan 01)
    provides: rules-engine magic module (revalidateMagicSnapshotAfterChange, MagicEvaluationStatus, MagicLevelInput)
  - phase: 07-magic-full-legality-engine (plan 02)
    provides: useMagicStore, selectMagicBoardView, selectMagicSheetTabView, MagicBoard, 6 magic feature components with soft-fallback copy
provides:
  - aggregateMagicLegality rollup (MagicAggregateView with illegal/repair counts + perLevel list)
  - PlannerValidationStatus.repair_needed (additive)
  - shellCopyEs.magic namespace fully populated
  - MagicSheetTab (read-only character-sheet tab)
  - MagicBoard wired into center-content.tsx for activeLevelSubStep='spells'
  - D-02 non-caster filter on level-sub-steps.tsx + classHasCastingAtLevel helper
  - 3 jsdom smoke tests + 1 aggregator unit test spec
  - scripts/verify-phase-07-copy.cjs helper
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Full-build legality aggregator walking the revalidation cascade into a single view model
    - Typed shellCopyEs.magic consumption (replaces the `shellCopyEs as unknown as { magic? }` soft-fallback from Plan 07-02)
    - D-02 conditional sub-step filter driven by the compiled class catalog spellCaster flag

key-files:
  created:
    - packages/rules-engine/src/magic/magic-legality-aggregator.ts
    - apps/planner/src/features/magic/magic-sheet-tab.tsx
    - tests/phase-07/magic-legality-aggregator.spec.ts
    - tests/phase-07/magic-board.spec.tsx
    - tests/phase-07/center-content.spec.tsx
    - tests/phase-07/magic-sheet-tab.spec.tsx
    - scripts/verify-phase-07-copy.cjs
  modified:
    - packages/rules-engine/src/magic/index.ts
    - apps/planner/src/state/planner-shell.ts
    - apps/planner/src/lib/copy/es.ts
    - apps/planner/src/components/shell/center-content.tsx
    - apps/planner/src/components/shell/character-sheet.tsx
    - apps/planner/src/components/shell/level-sub-steps.tsx
    - apps/planner/src/features/magic/selectors.ts
    - apps/planner/src/features/magic/magic-board.tsx
    - apps/planner/src/features/magic/magic-sheet.tsx
    - apps/planner/src/features/magic/magic-detail-panel.tsx
    - apps/planner/src/features/magic/domain-tile-grid.tsx
    - apps/planner/src/features/magic/spell-row.tsx
    - apps/planner/src/features/magic/swap-spell-dialog.tsx
    - tests/phase-05.2/character-sheet.spec.tsx

key-decisions:
  - "aggregateMagicLegality reuses revalidateMagicSnapshotAfterChange rather than re-walking the per-level inputs — one pass feeds the rollup"
  - "STATUS_ORDER mirrors the selector order (illegal < blocked < legal < pending) so aggregator worst-case matches the live summary selector"
  - "classHasCastingAtLevel lives in apps/planner/src/features/magic/selectors.ts (not level-sub-steps.tsx) so the D-02 rule is colocated with other magic selector logic and unit-testable without mounting a component"
  - "repair_needed added additively to PlannerValidationStatus — no existing consumers dropped into a non-exhaustive switch (T-07-09 mitigation)"
  - "shellCopyEs.magic consumed directly instead of via `as unknown as {...}` cast; the Plan 07-02 soft-fallback across 6 components was removed now that the namespace exists"
  - "tests/phase-05.2/character-sheet.spec.tsx assertion updated from 'Conjuros del personaje' (old SpellsPanel placeholder) to /\\d+ conjuros/ (MagicSheetTab header) — the placeholder was explicitly deleted this plan"
  - "Smoke tests use createElement() to match phase-05.2 pattern; vitest.config.ts does not carry @vitejs/plugin-react so direct JSX needs a React import"

requirements-completed: [LANG-02, VALI-01, VALI-03]

# Metrics
duration: ~30min
completed: 2026-04-17
---

# Phase 7 Plan 3: Magic Legality Aggregator + Shell Wiring + UI Smoke Tests Summary

**Full-build magic legality rollup + shell-level integration + Spanish copy finalization + 3 jsdom smoke tests.** Phase 07 now ships a complete user-visible magic surface: `<MagicBoard />` replaces the placeholder in `center-content.tsx`, `<MagicSheetTab />` replaces `SpellsPanel` in the character sheet, the `spells` sub-step hides when the active class cannot cast (D-02), and `shellCopyEs.magic` carries every copy key required by 07-UI-SPEC.

## Performance

- **Duration:** ~30 min
- **Tasks:** 4
- **Commits:** 4 per-task + this SUMMARY commit
- **Files created:** 7 (1 aggregator + 1 sheet tab + 4 tests + 1 verifier script)
- **Files modified:** 14 (12 app/feature + 1 phase-05.2 test + 1 rules-engine barrel)

## Accomplishments

- **`aggregateMagicLegality`** rolls up per-level magic status into a `MagicAggregateView` with `status`, `illegalLevels`, `repairLevels`, `issues`, `perLevel`, `illegalCount`, `repairCount`. One pass through `revalidateMagicSnapshotAfterChange` feeds the rollup — no second walk, complexity mirrors the selector summary so D-07 perf budget stays honored (T-07-11).
- **`PlannerValidationStatus.repair_needed`** added additively (T-07-09 mitigation). No existing switch/match consumers fall through.
- **`shellCopyEs.magic`** namespace populated with every key from the UI-SPEC Copywriting Contract: step titles, action labels, validation strings, repair banners, plan-state map. The `stepper.levelSubSteps.spells` label migrated from `'Conjuros'` to `'Magia'` (union identifier unchanged per 07-RESEARCH Pitfall 2); `sheetTabs.spells` remains `'Conjuros'` per UI-SPEC Character Sheet section.
- **Typed copy consumption** across all 6 Plan 07-02 magic components — the soft-fallback `(shellCopyEs as unknown as { magic? }).magic ?? fallback` is gone; grep confirms zero `as any` or `as unknown as { magic` casts remain in the magic feature directory.
- **`MagicSheetTab`** is a read-only character-sheet summary mirroring `FeatSheetTab` — `role="tabpanel" id="sheet-panel-spells"`, per-class groups, spell rows with status classes, `{N} conjuros` header plus an optional `{invalid} magia no válida` counter.
- **`<MagicBoard />`** replaces the placeholder `PlaceholderScreen` for the `spells` sub-step in `center-content.tsx`. `<MagicSheetTab />` replaces the stub `SpellsPanel` function in `character-sheet.tsx` (function deleted).
- **D-02 filter:** `level-sub-steps.tsx` hides the `spells` chip when the level's class is non-caster, via the new `classHasCastingAtLevel(level, progressionState)` helper in `apps/planner/src/features/magic/selectors.ts`. Paladin/Ranger remain as casters by catalog flag even at low class levels per D-04.
- **3 jsdom smoke tests** verify MagicBoard, CenterContent routing, and MagicSheetTab render without throwing, in Spanish, with the correct ARIA contract.
- **1 aggregator unit spec** covers all-pending, empty caster, single illegal rollup, cascade blocked, missing-source domain (soft-skip when all domains populated), and `inheritedFromLevel` preservation.
- **`scripts/verify-phase-07-copy.cjs`** helper asserts every required copy key exists, the sub-step label migrated, the sheet-tab label preserved, and no forbidden cast patterns remain. Pure Node.js (no grep dependency) so it runs identically on Windows and Linux.

## Task Commits

1. **Task 1: aggregator + PlannerValidationStatus extension** — `fcc8fb5` (`feat(07-03): add aggregateMagicLegality and extend PlannerValidationStatus`)
2. **Task 2: shellCopyEs.magic namespace + typed consumption** — `769e58c` (`feat(07-03): finalize shellCopyEs.magic namespace and rename sub-step to Magia`)
3. **Task 3: MagicSheetTab + wire center-content/character-sheet + D-02 filter** — `764306b` (`feat(07-03): wire MagicBoard, MagicSheetTab, and D-02 non-caster filter`)
4. **Task 4: 3 jsdom smoke tests** — `b0b3008` (`test(07-03): add jsdom smoke tests for MagicBoard, CenterContent, MagicSheetTab`)

## Files Created/Modified

### Rules engine (new)

- `packages/rules-engine/src/magic/magic-legality-aggregator.ts` — `aggregateMagicLegality`, `MagicAggregateView`, `MagicAggregateInput`, `PerLevelMagicView`.

### Rules engine (modified)

- `packages/rules-engine/src/magic/index.ts` — barrel export of the aggregator.

### Planner (new)

- `apps/planner/src/features/magic/magic-sheet-tab.tsx` — read-only character-sheet summary tab.

### Planner (modified)

- `apps/planner/src/state/planner-shell.ts` — `PlannerValidationStatus` gains `repair_needed` variant.
- `apps/planner/src/lib/copy/es.ts` — `magic` namespace added; `stepper.levelSubSteps.spells` label migrated to `'Magia'`.
- `apps/planner/src/components/shell/center-content.tsx` — `case 'spells'` returns `<MagicBoard />`; placeholder removed.
- `apps/planner/src/components/shell/character-sheet.tsx` — `SpellsPanel` deleted; `<MagicSheetTab />` rendered.
- `apps/planner/src/components/shell/level-sub-steps.tsx` — D-02 filter; imports `classHasCastingAtLevel` + `useLevelProgressionStore`.
- `apps/planner/src/features/magic/selectors.ts` — exports `classHasCastingAtLevel` helper.
- `apps/planner/src/features/magic/{magic-board,magic-sheet,magic-detail-panel,domain-tile-grid,spell-row,swap-spell-dialog}.tsx` — migrated from soft-fallback cast to typed `shellCopyEs.magic` consumption.

### Tests (new)

- `tests/phase-07/magic-legality-aggregator.spec.ts` — 6 aggregator unit tests.
- `tests/phase-07/magic-board.spec.tsx` — jsdom smoke.
- `tests/phase-07/center-content.spec.tsx` — jsdom smoke.
- `tests/phase-07/magic-sheet-tab.spec.tsx` — jsdom smoke.

### Tests (modified)

- `tests/phase-05.2/character-sheet.spec.tsx` — spells-tab assertion updated from `'Conjuros del personaje'` (deleted SpellsPanel copy) to `/\d+ conjuros/` (MagicSheetTab header).

### Tooling (new)

- `scripts/verify-phase-07-copy.cjs` — copy namespace verifier.

## Decisions Made

- **One-pass aggregator:** `aggregateMagicLegality` calls `revalidateMagicSnapshotAfterChange` exactly once and walks its output into the rollup. No second pass over per-level inputs; the cascade is already in the revalidator.
- **STATUS_ORDER alignment:** aggregator uses `illegal: 0, blocked: 1, legal: 2, pending: 3` so the worst-case reduction matches the runtime summary selector. Tests confirm an illegal level drives the overall status even when other levels are pending.
- **`classHasCastingAtLevel` in selectors.ts, not level-sub-steps.tsx:** Per the plan's key-links table, the D-02 helper is colocated with other magic selectors so it's unit-testable without mounting React and stays reusable by other consumers.
- **Sheet-tab label preserved:** `sheetTabs.spells: 'Conjuros'` stays unchanged per UI-SPEC Character Sheet section; only the LEVEL sub-step label is `'Magia'`. This matches the product decision that in-level the user is picking *magic* (domains + slots + prepared), while the character sheet shows the *spells* assembled.
- **createElement() in smoke tests:** `vitest.config.ts` does not bundle `@vitejs/plugin-react`, so direct JSX in test files raises `React is not defined`. Matched the phase-05.2 pattern (`createElement(Component)`).
- **queryAllByText in smoke tests:** `MagicBoard` empty-state renders the same Spanish string twice (detail-panel title + body). Used `queryAllByText` so the assertion remains about "something magic-shaped rendered" without failing on duplicates.
- **Phase-05.2 test migration:** the spells-tab assertion was specifically about the old `SpellsPanel` placeholder text, which this plan explicitly removes. Updated to match `MagicSheetTab`'s live header. Orchestrator-visible so the reviewer can confirm intent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Smoke tests failed with `React is not defined`**

- **Found during:** Task 4 (first run of smoke tests)
- **Issue:** JSX usage in `.spec.tsx` files under `tests/phase-07/` triggered `ReferenceError: React is not defined` at runtime. `vitest.config.ts` does not include `@vitejs/plugin-react`, so the automatic JSX transform is not active — each component reference through JSX compiles to `React.createElement(...)` but `React` isn't imported.
- **Fix:** Matched the phase-05.2 pattern: `import { createElement } from 'react'` and replaced `render(<X />)` with `render(createElement(X))`. All three smoke test files follow this pattern.
- **Files modified:** `tests/phase-07/magic-board.spec.tsx`, `tests/phase-07/center-content.spec.tsx`, `tests/phase-07/magic-sheet-tab.spec.tsx`
- **Verification:** All 51 phase-07 tests now pass.
- **Committed in:** `b0b3008`

**2. [Rule 1 - Bug] `queryByText` multi-match on MagicBoard empty-state copy**

- **Found during:** Task 4 (first pass after React fix)
- **Issue:** When `MagicBoard` renders its empty-state `<DetailPanel>`, the same Spanish string `'La magia sigue bloqueada'` appears twice in the DOM (detail-panel title + body). `queryByText` throws on multiple matches.
- **Fix:** Switched to `queryAllByText(...).length > 0` in both the MagicBoard smoke test and the CenterContent smoke test. Asserts "something magic-shaped rendered" without caring whether it appears once or twice.
- **Files modified:** `tests/phase-07/magic-board.spec.tsx`, `tests/phase-07/center-content.spec.tsx`
- **Committed in:** `b0b3008`

**3. [Rule 1 - Bug] phase-05.2 character-sheet spec asserted on removed placeholder copy**

- **Found during:** Task 3 (first run of phase-05.2 tests after SpellsPanel removal)
- **Issue:** `tests/phase-05.2/character-sheet.spec.tsx:113` asserted `'Conjuros del personaje'` was in the document after clicking the spells tab. That text was the literal placeholder copy inside the deleted `SpellsPanel`. Now `MagicSheetTab` renders a `'{N} conjuros'` header instead.
- **Fix:** Updated the assertion to `expect(screen.getByText(/\d+ conjuros/)).toBeInTheDocument()` so it matches the live MagicSheetTab header for any numeric count. Inline comment documents the intent so the reviewer can confirm.
- **Files modified:** `tests/phase-05.2/character-sheet.spec.tsx`
- **Verification:** 54/54 phase-05.2 tests green.
- **Committed in:** `764306b`

---

**Total deviations:** 3 (1 blocking JSX transform, 2 test expectation fixes). All tracked as decisions above. No scope creep; no feature behavior changed.

## Issues Encountered

- **Empty `grantedFeatIds` domain no longer exists:** the `treats missing-source domain as blocked not illegal` test soft-skips when the catalog has no missing-source domains (phase 07-01 populated all 27). Intentional no-op: the fail-closed path is still exercised via `tests/phase-07/catalog-fail-closed.spec.ts` against a synthetic catalog. Logged in the test's early-return comment.
- **Multi-match DOM:** `DetailPanel` renders the same empty-state copy in both its title and body. Expected, but requires `queryAllByText` in tests — noted above.

## User Setup Required

None.

## Known Stubs

None introduced by this plan. Pre-existing stubs carried from 07-01 / 07-02 (empty spell descriptions for 376/376 spells) remain handled via fail-closed `detectMissingSpellData → blocked + missing-source`, which is intended behavior (VALI-02) and not a stub.

## Threat Flags

None.

- **T-07-09 (additive enum change):** `PlannerValidationStatus` gains `repair_needed` without breaking existing consumers. Strict-mode exhaustive switches catch any missed case at compile time; the current consumer (`summary-strip.tsx` class-name derivation, `shell-summary.tsx`) uses string interpolation so the new variant surfaces as a valid CSS class.
- **T-07-10 (copy strings):** all shellCopyEs.magic strings are compile-time constants rendered via `{value}` JSX escaping. No `dangerouslySetInnerHTML` anywhere in the magic feature directory.
- **T-07-11 (aggregator DoS):** `aggregateMagicLegality` runs `revalidateMagicSnapshotAfterChange` exactly once per call. Complexity is O(levels * selections) matching the live summary selector — no additional pass over the input.
- **T-07-12 (placeholder spoofing):** the replacement DOM (`role="tabpanel" id="sheet-panel-spells"`) matches the removed SpellsPanel's ARIA contract; no new trust boundary introduced.

## Next Phase Readiness

- Phase 07 is **complete**. MAGI-01, MAGI-02, MAGI-03, MAGI-04, LANG-02, VALI-01, VALI-02, VALI-03 all closed across Plans 07-01 / 07-02 / 07-03 (07-01 already owned MAGI-01..MAGI-04, LANG-02, VALI-01, VALI-02; 07-02 closed MAGI-01..MAGI-04, LANG-02, VALI-03; 07-03 closes LANG-02, VALI-01, VALI-03 at the user-visible surface layer).
- Phase 08 (URL sharing / import-export) can consume `aggregateMagicLegality` to project legality into the Zod boundary: valid builds yield `status in {legal, pending}`, shared URLs carrying illegal magic selections fail closed at decode time.
- `shellCopyEs.magic.planStates` is ready for the shell severity projection to render 'Sin magia'/'Magia en reparación'/'Magia lista' etc. once a magic summary selector ships alongside the other Plan 7 summary projections.

## TDD Gate Compliance

Plan type is `execute`, not `tdd`. No RED/GREEN gate enforcement required. Task 4 added tests after the implementation stabilized in Tasks 1-3, which is the expected order for an execute plan.

## Self-Check: PASSED

Verified (on commit `b0b3008`):

- `packages/rules-engine/src/magic/magic-legality-aggregator.ts` exists (FOUND)
- `packages/rules-engine/src/magic/index.ts` re-exports aggregator (FOUND: `magic-legality-aggregator`)
- `apps/planner/src/state/planner-shell.ts` contains `repair_needed` (FOUND)
- `apps/planner/src/lib/copy/es.ts` contains `magic:` namespace (FOUND) and `spells: 'Magia'` in `levelSubSteps` (FOUND)
- `apps/planner/src/lib/copy/es.ts` still contains `spells: 'Conjuros'` in `sheetTabs` (FOUND)
- `apps/planner/src/features/magic/magic-sheet-tab.tsx` exports `MagicSheetTab` (FOUND) with `id="sheet-panel-spells"` (FOUND)
- `apps/planner/src/components/shell/center-content.tsx` contains `<MagicBoard />` (FOUND, count=1) and no `Los conjuros se habilitaran` (FOUND: count=0)
- `apps/planner/src/components/shell/character-sheet.tsx` contains `<MagicSheetTab />` (FOUND, count=1) and no `SpellsPanel` (FOUND: count=0)
- `apps/planner/src/components/shell/level-sub-steps.tsx` contains `classHasCastingAtLevel` (FOUND, count=2)
- `apps/planner/src/features/magic/selectors.ts` exports `classHasCastingAtLevel` (FOUND)
- `scripts/verify-phase-07-copy.cjs` exists and `node scripts/verify-phase-07-copy.cjs` exits 0 (PASSED)
- `tests/phase-07/{magic-legality-aggregator,magic-board,center-content,magic-sheet-tab}.spec.{ts,tsx}` all exist (FOUND)
- Each smoke test file starts with `// @vitest-environment jsdom` (FOUND, 3/3)
- `grep -rn "shellCopyEs as any" apps/planner/src/features/magic/` returns EMPTY
- `grep -rn "shellCopyEs as unknown" apps/planner/src/features/magic/` returns EMPTY
- Phase-07 test suite: 11/11 files, 51/51 tests green
- Full test suite: 53/53 files, 310/310 tests green
- Commits: `fcc8fb5` (FOUND), `769e58c` (FOUND), `764306b` (FOUND), `b0b3008` (FOUND)

---
*Phase: 07-magic-full-legality-engine*
*Completed: 2026-04-17*
