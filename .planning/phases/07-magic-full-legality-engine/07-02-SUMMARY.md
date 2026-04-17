---
phase: 07-magic-full-legality-engine
plan: 02
subsystem: planner-magic-feature
tags: [magic, zustand, selectors, react, paradigm-dispatch, spanish-copy, swap-dialog]

# Dependency graph
requires:
  - phase: 07-magic-full-legality-engine (plan 01)
    provides: rules-engine magic module (caster-level, spell-eligibility, spell-prerequisite, domain-rules, catalog-fail-closed, magic-revalidation), BuildStateAtLevel.casterLevelByClass
  - phase: 06-feats-proficiencies
    provides: BuildStateAtLevel contract, feat store / selectors / feat-board precedent, ConfirmDialog + OptionList + SelectionScreen + DetailPanel UI primitives
provides:
  - useMagicStore zustand store with per-level slice and 10 actions
  - selectMagicBoardView selector composing 5 stores into typed MagicBoardView with paradigm dispatch
  - 7 React components (MagicBoard, MagicSheet, MagicDetailPanel, SpellLevelTabs, DomainTileGrid, SpellRow, SwapSpellDialog)
  - ConfirmDialog now accepts children (additive, enables multi-step dialog flows)
affects: [07-03 (wiring into center-content / character-sheet / level-sub-steps), future URL-hydration zod boundary (Phase 8)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Multi-store selector composition (foundation + progression + skill + feat + magic) mirroring feats precedent
    - Paradigm dispatch by (class, characterLevel) tuple: cleric L1 -> domains, L2+ -> prepared-summary, wizard -> spellbook, sorcerer/bard -> known, druid/paladin/ranger -> prepared-summary, non-caster -> empty
    - Soft-reference copy fallback (`shellCopyEs as unknown as { magic? }`) so components compile before Plan 07-03 finalizes the shellCopyEs.magic namespace
    - Two-step dialog flow via ConfirmDialog + children + OptionList (no new primitive introduced)

key-files:
  created:
    - apps/planner/src/features/magic/compiled-magic-catalog.ts
    - apps/planner/src/features/magic/store.ts
    - apps/planner/src/features/magic/selectors.ts
    - apps/planner/src/features/magic/magic-board.tsx
    - apps/planner/src/features/magic/magic-sheet.tsx
    - apps/planner/src/features/magic/magic-detail-panel.tsx
    - apps/planner/src/features/magic/spell-level-tabs.tsx
    - apps/planner/src/features/magic/domain-tile-grid.tsx
    - apps/planner/src/features/magic/spell-row.tsx
    - apps/planner/src/features/magic/swap-spell-dialog.tsx
    - tests/phase-07/magic-store.spec.ts
  modified:
    - apps/planner/src/components/ui/confirm-dialog.tsx (additive children prop)

key-decisions:
  - "Store uses `useMagicStore.setState(createInitialMagicState())` without replace=true so action functions persist across test resets (zustand v5 behavior)"
  - "MAX_DOMAINS_PER_CLERIC re-exported from rules-engine/magic/domain-rules rather than duplicated in selectors — single source of truth"
  - "STATUS_ORDER in selectors puts illegal<blocked<pending<legal so worst-case reduction finds the weakest status as the summary status"
  - "ConfirmDialog gains an optional `children` ReactNode slot (additive, no existing caller regresses) to let SwapSpellDialog embed an OptionList inside the dialog shell without introducing a new primitive (UI-SPEC Registry Safety)"
  - "Soft-fallback pattern uses `shellCopyEs as unknown as { magic? }` rather than `as any` to preserve strict-mode safety while still allowing the magic namespace to be populated by Plan 07-03"
  - "NwnButton variant 'muted' (requested by plan) does not exist in the primitive; used 'secondary' instead for the remove-spell affordance (closest tonal match to a muted action)"
  - "computeMagicBuildStateAtLevel applies Pitfall 2 strictly: feat selections at level N are not yet visible when evaluating level N magic prereqs (mirrors feat-prerequisite cascade)"

requirements-completed: [MAGI-01, MAGI-02, MAGI-03, MAGI-04, LANG-02, VALI-03]

# Metrics
duration: ~30min
completed: 2026-04-17
---

# Phase 7 Plan 2: Magic Zustand Store + Selectors + 7 React Components Summary

**Magic feature layer wired end-to-end: per-level zustand slice with 10 actions, 5-store selector composition with paradigm dispatch, and 7 React components (board, sheet, detail panel, spell-level tabs, domain grid, spell row, swap dialog) reusing Phase 05.2 primitives.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 3
- **Files created:** 11 (1 barrel + 1 store + 1 selectors + 7 components + 1 test spec)
- **Files modified:** 1 (confirm-dialog.tsx, additive children slot)
- **Lines added:** ~1820 (store 200 + selectors 765 + components 712 + test 130 + confirm-dialog 13)

## Accomplishments

- **Zustand store** with 10 actions (`setActiveLevel`, `setDomains`, `add/removeSpellbookEntry`, `add/removeKnownSpell`, `applySwap`, `resetLevel`, `resetMagicSelections`) and dedupe-on-add semantics for spellbook/known entries. Every mutating action sets `lastEditedLevel`.
- **Selector layer** composes all 5 feature stores into `MagicBoardView`, `MagicSheetTabView`, `MagicSummaryView`. Paradigm dispatch is explicit per class + character level. `SCHOOL_LABELS_ES` covers all 8 D&D 3.5 schools + `unknown` fallback.
- **Swap cadence** encoded per D-15: `SORCERER_SWAP_LEVELS = {4, 8, 12, 16}`, `BARD_SWAP_LEVELS = {5, 8, 11, 14}`.
- **7 React components** built from existing Phase 05.2 primitives (`SelectionScreen`, `DetailPanel`, `OptionList`, `ConfirmDialog`, `NwnButton`). No new CSS files added — BEM classes reuse `.feat-board__*`, `.magic-board__*`, `.magic-sheet__*` patterns inherited from Phase 05.2 tokens.
- **Two-step SwapSpellDialog** wires step 1 (forget) -> step 2 (learn) -> step 3 (confirm) fully, persisting via `applySwap` on confirm. Uses the new `children` slot on `ConfirmDialog` to embed `OptionList` without introducing a new dialog primitive.
- **10 store unit tests** covering CRUD, dedupe-on-add, reset, and activeLevel semantics — all green.

## Task Commits

1. **Task 1: Zustand store + test spec** — `467d67c` (`feat(07-02): add useMagicStore with per-level magic slice`)
2. **Task 2: Selectors + paradigm dispatch** — `032e624` (`feat(07-02): add magic selectors with paradigm dispatch and view models`)
3. **Task 3: 7 React components + ConfirmDialog extension** — `0cca1c8` (`feat(07-02): add magic React components and extend ConfirmDialog with children`)

## Files Created/Modified

### Planner feature (new)

- `apps/planner/src/features/magic/compiled-magic-catalog.ts` — barrel re-export of compiled spell/domain/class catalogs.
- `apps/planner/src/features/magic/store.ts` — `useMagicStore` with `MagicLevelRecord`, `SwapRecord`, `createInitialMagicState`, `createEmptyMagicLevels`.
- `apps/planner/src/features/magic/selectors.ts` — `selectMagicBoardView`, `selectMagicSheetTabView`, `selectMagicSummary`, `SCHOOL_LABELS_ES`, `MagicParadigm`, `SpellOptionView`, `DomainOptionView`, `SlotStatus`, `ActiveMagicSheetView`, `MagicBoardView`, `MagicSummaryView`, `computeMagicBuildStateAtLevel`, `MAX_DOMAINS_PER_CLERIC` (re-export).
- `apps/planner/src/features/magic/magic-board.tsx` — top-level component.
- `apps/planner/src/features/magic/magic-sheet.tsx` — left-pane paradigm dispatcher.
- `apps/planner/src/features/magic/magic-detail-panel.tsx` — right-pane detail.
- `apps/planner/src/features/magic/spell-level-tabs.tsx` — 0..9 horizontal tablist.
- `apps/planner/src/features/magic/domain-tile-grid.tsx` — 2-column listbox tile grid.
- `apps/planner/src/features/magic/spell-row.tsx` — role=option article with state classes.
- `apps/planner/src/features/magic/swap-spell-dialog.tsx` — two-step ConfirmDialog flow.

### Planner UI primitive (modified)

- `apps/planner/src/components/ui/confirm-dialog.tsx` — additive `children?: ReactNode` slot rendered between body and action row.

### Tests (new)

- `tests/phase-07/magic-store.spec.ts` — 10 store tests.

## Decisions Made

- **Zustand reset without replace=true:** initial implementation used `useMagicStore.setState(createInitialMagicState(), true)` in `beforeEach`, which wiped out action functions and caused every mutating test to fail with `setDomains is not a function`. Fixed to match the feat store test pattern (`setState(initialState)` without replace), preserving actions across resets.
- **STATUS_ORDER priorities:** placed `illegal: 0, blocked: 1, pending: 2, legal: 3` so that `reduce(worst, STATUS_ORDER[r.status] < STATUS_ORDER[worst] ? r.status : worst, 'legal')` correctly surfaces the weakest status. Important: the plan's draft flipped `pending` and `legal` positions; the production order matches standard cascade semantics where `pending` is "not fully evaluated yet" and `legal` is the neutral baseline.
- **MAX_DOMAINS_PER_CLERIC re-export:** the selector re-exports the constant from the rules engine rather than duplicating it, keeping the plan's acceptance criterion satisfied (single source of truth, consumers can import from either module).
- **Soft-fallback copy pattern:** used `(shellCopyEs as unknown as { magic?: Record<string, string> }).magic ?? {}` instead of `as any` to preserve strict TypeScript narrowing. Functionally equivalent to the plan's `as any` pattern but better for long-term type health; Plan 07-03 replaces these sites with typed access once the magic copy namespace is added to `shellCopyEs`.
- **ConfirmDialog `children` slot:** additive prop rendered between `<p.confirm-dialog__body>` and `<div.confirm-dialog__actions>`. All existing callers ignore the prop; no behavior regression. Enables `SwapSpellDialog` to embed an `OptionList` picker inside the dialog shell without introducing a new dialog primitive (UI-SPEC §Registry Safety).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `useMagicStore.setState(createInitialMagicState(), true)` wipes actions**

- **Found during:** Task 1 (first test run after writing spec)
- **Issue:** Zustand v5 treats the `true` replace flag as "replace entire state object", which overwrote the action closures returned by `create<>()`. All mutating tests (`setDomains`, `addSpellbookEntry`, ...) failed with `x is not a function`.
- **Fix:** Dropped the `true` flag. Matches the pattern in `tests/phase-06/feat-store.spec.ts`.
- **Files modified:** `tests/phase-07/magic-store.spec.ts`
- **Verification:** 10/10 magic-store tests green.
- **Committed in:** `467d67c`

**2. [Rule 1 - Bug] Plan specified `NwnButton variant="muted"` which does not exist in the primitive**

- **Found during:** Task 3 (spell-row.tsx authoring)
- **Issue:** Plan Task 3 File 6 requests `<NwnButton variant="muted">` for the remove-from-spellbook affordance, but `NwnButton` only defines `'auxiliary' | 'icon' | 'primary' | 'secondary'` variants.
- **Fix:** Used `variant="secondary"` instead — closest tonal match to a de-emphasized action (primary's counterpart). Documented as a decision.
- **Files modified:** `apps/planner/src/features/magic/spell-row.tsx`
- **Verification:** typecheck passes, full test suite green.
- **Committed in:** `0cca1c8`

**3. [Rule 2 - Improvement] Soft-fallback uses `as unknown as { magic? }` instead of `as any`**

- **Found during:** Task 3 (spell-level-tabs / domain-tile-grid / ...)
- **Issue:** Plan prescribes `(shellCopyEs as any).magic ?? fallback` for the pre-07-03 copy namespace. Strict TypeScript best practice: avoid `any` when a narrower cast expresses the same intent.
- **Fix:** Replaced with `(shellCopyEs as unknown as { magic?: Record<string, string> }).magic ?? {}`. Functionally identical; enables IDE autocompletion on fallback keys; Plan 07-03 replaces with direct typed access when the `magic` namespace lands.
- **Files modified:** all 7 components
- **Verification:** `grep -c 'shellCopyEs as unknown' apps/planner/src/features/magic/*.tsx` = 7 sites (≥ 5 threshold satisfied).
- **Committed in:** `0cca1c8`

---

**Total deviations:** 3 (1 bug, 1 primitive mismatch, 1 type-safety improvement). None affect feature semantics; all tracked as decisions above.

## Issues Encountered

- **Write tool path bug:** first attempt at Task 1 wrote files to `C:/Users/pzhly/RiderProjects/pdb-character-builder/...` (main repo) instead of `.../.claude/worktrees/agent-a326e423/...` (worktree). Caught via `ls` before committing, cleaned up by deleting the misplaced files and re-writing inside the worktree. No commits were affected.
- **pnpm-lock.yaml drift:** `corepack pnpm install --frozen-lockfile` touched the lockfile with a minor importer entry (similar to Plan 07-01). Left uncommitted; orchestrator may reconcile.
- **Pre-existing phase-03 typecheck errors:** `tests/phase-03/foundation-validation.spec.ts` has 3 pre-existing errors (also noted in 07-01 summary). `pnpm typecheck` exits 2 because of these; they are not caused by or affected by this plan.
- **Vitest Windows path filter:** `pnpm vitest run tests/phase-07/magic-store.spec.ts` failed to match files on Windows under worktree paths; ran `pnpm vitest run tests/phase-07/` (directory filter) instead and confirmed the new spec appears in the 7-file / 40-test total.

## User Setup Required

None.

## Known Stubs

None introduced by this plan. Pre-existing Known Stub carried from 07-01:

- `spell:description` is empty for all 376 compiled spells (catalog extraction gap documented in 07-01 `deferred-items.md`). The Phase 07 UI handles this via `detectMissingSpellData` returning `blocked + missing-source` (VALI-02 fail-closed contract) and `MagicDetailPanel` shows the `'Descripción no disponible'` fallback string. This is intended fail-closed behavior, not a stub.

`shellCopyEs.magic.*` keys referenced via soft-fallback (`magicCopy.domainsStepTitle`, `magicCopy.swapSpell`, `magicCopy.missingDescription`, ...) are intentional placeholders that Plan 07-03 finalizes. They render their fallback Spanish strings until then — not stubs per the workflow definition because the plan explicitly scopes the typed namespace to Plan 07-03.

## Threat Flags

None.

- **T-07-05 (Tampering):** Plan 07-02 introduces no URL-hydration path; store starts empty. Phase 8 Zod boundary still owns this mitigation.
- **T-07-06 (XSS):** All catalog-sourced text rendered via `{value}` JSX expressions. `grep dangerouslySetInnerHTML` over the 7 components returns empty.
- **T-07-07 (DoS):** `revalidateMagicSnapshotAfterChange` is called twice per selector pass (once in `selectMagicBoardView`, once when the sheet tab view is requested). Pure functions, no subscription leaks.
- **T-07-08 (Spoofing):** `compiledSpellCatalog.spells.find()` / `.domains.find()` return `undefined` for unknown IDs; selector maps to `null` SpellOptionView / DomainOptionView entries that get filtered out.

## Next Phase Readiness

- Plan 07-03 can import `MagicBoard` from `@planner/features/magic/magic-board` and mount it in `center-content.tsx` / `level-sub-steps.tsx` at the `magia` sub-step.
- The `shellCopyEs.magic` namespace is the single remaining copy surface to finalize; Plan 07-03 Task 1 should populate:
  - `emptyStateHeading`, `emptyStateBody`, `missingDescription`, `missingGrants`, `noCastingStepTitle`
  - `domainsStepTitle`, `spellbookStepTitle`, `knownSpellsStepTitle`, `preparedStepTitle`, `preparedCasterInfo`
  - `domainGrantHeading`, `domainBonusSpellsHeading`
  - `rejectionPrefixHard`, `removeFromSpellbook`
  - `swapSpell`, `swapStep1Title`, `swapStep1Body`, `swapStep2Title`, `swapStep2Body`, `swapConfirmBody`
  - `planStates.{empty, repair, inProgress, ready}`
- Once the typed namespace lands, Plan 07-03 can do a mechanical find/replace from `(shellCopyEs as unknown as { magic? }).magic?.KEY ?? 'fallback'` to `shellCopyEs.magic.KEY` across the 7 component files.

## Self-Check: PASSED

Verified:

- `apps/planner/src/features/magic/compiled-magic-catalog.ts` exists (FOUND)
- `apps/planner/src/features/magic/store.ts` exists (FOUND)
- `apps/planner/src/features/magic/selectors.ts` exists (FOUND)
- `apps/planner/src/features/magic/magic-board.tsx` exists (FOUND)
- `apps/planner/src/features/magic/magic-sheet.tsx` exists (FOUND)
- `apps/planner/src/features/magic/magic-detail-panel.tsx` exists (FOUND)
- `apps/planner/src/features/magic/spell-level-tabs.tsx` exists (FOUND)
- `apps/planner/src/features/magic/domain-tile-grid.tsx` exists (FOUND)
- `apps/planner/src/features/magic/spell-row.tsx` exists (FOUND)
- `apps/planner/src/features/magic/swap-spell-dialog.tsx` exists (FOUND)
- `tests/phase-07/magic-store.spec.ts` exists (FOUND)
- Commits: `467d67c` (FOUND), `032e624` (FOUND), `0cca1c8` (FOUND)
- Full test suite: 49/49 files, 299/299 tests green (up from 289 at plan start — 10 new magic-store tests)
- Typecheck: clean on all new files; 3 pre-existing errors in `tests/phase-03/foundation-validation.spec.ts` are carryovers (documented in 07-01 summary)
- No `dangerouslySetInnerHTML` in any magic component
- No `from 'react'` in `apps/planner/src/features/magic/selectors.ts`

---
*Phase: 07-magic-full-legality-engine*
*Completed: 2026-04-17*
