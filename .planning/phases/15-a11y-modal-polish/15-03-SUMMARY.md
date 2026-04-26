---
phase: 15-a11y-modal-polish
plan: 03
subsystem: ui
tags: [zustand, useShallow, phase-06-WR-01, subscription-narrowing, performance-hygiene, slice-as-input, react-19, jsdom, vitest]

# Dependency graph
requires:
  - phase: 15-02
    provides: feat-board.tsx JSX-tree edits (scrollerRef declaration + ref attached to .feat-board__main + scrollerRef prop on <FeatSheet>) — 15-03 layers the subscription edit on top of these without touching the JSX tree
  - phase: 06-feats-proficiencies
    provides: useFeatStore export from apps/planner/src/features/feats/store.ts and the FeatStoreState shape that the useShallow slice-as-input pattern subscribes to
  - phase: 15-01
    provides: tests/phase-15 jsdom glob registration in vitest.config.ts (used by the new spec without further config)
provides:
  - useShallow rollout to feat-board.tsx (line 42 → multi-field shallow slice with all 11 FeatStoreState fields; data + actions both included for selector type compatibility; data fields drive re-renders, action fields are reference-stable)
  - useShallow rollout to feat-detail-panel.tsx (line 17 — same slice shape, feeds computeBuildStateAtLevel)
  - useShallow rollout to feat-sheet-tab.tsx (line 15 — same slice shape, feeds selectFeatSheetTabView)
  - tests/phase-15/feat-store-shallow.spec.tsx — 6 cases locking the useShallow narrow-subscription contract (4 idiom locks via synthetic TestConsumer + 2 FeatBoard integration sanity)
affects: [future selector-narrow phases for other-store full subscriptions in feat-* files (out-of-scope per CONTEXT.md scope discipline)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Slice-as-input via useShallow — destructured slice IS the selector input; no getState() snapshot, no void discards, no subscription/selector drift. Action functions included in slice satisfy FeatStoreState typing without re-render cost (reference-stable across zustand renders)"
    - "Atomic action selectors retained alongside useShallow slice — Phase 12.8-03 D-06 chip-deselect handlers continue using clearClassFeat/clearGeneralFeat from atomic useFeatStore((s) => s.X) selectors; both subscriptions return reference-equal handles so the duplication is free"
    - "Synthetic TestConsumer fallback — when mounting a heavyweight production consumer (FeatBoard) is impractical for re-render assertions, a tiny <TestConsumer> using the same useShallow signature locks the IDIOM directly"

key-files:
  created:
    - tests/phase-15/feat-store-shallow.spec.tsx
  modified:
    - apps/planner/src/features/feats/feat-board.tsx
    - apps/planner/src/features/feats/feat-detail-panel.tsx
    - apps/planner/src/features/feats/feat-sheet-tab.tsx

key-decisions:
  - "Full FeatStoreState slice (data + actions) chosen for all 3 consumers instead of narrowed { levels } slice. Rationale: zustand 5.x action references are reference-stable; including them in useShallow's slice adds zero re-render cost while satisfying the selectFeatBoardView / selectFeatSheetTabView / computeBuildStateAtLevel signature (which expect FeatStoreState). This also eliminates the need to verify which fields each downstream selector reads — a future refactor could narrow further with no behavioural difference."
  - "Atomic action selectors at feat-board.tsx L48-49 KEPT (clearClassFeat + clearGeneralFeat). Phase 12.8-03 D-06 invariant — chip deselect handlers consume them via JSX callbacks. Switching to featState.clearClassFeat would force a deeper edit to <FeatSummaryCard onDeselect={...}> wiring (out of scope; would risk re-triggering 12.8-03 invariants). Both subscriptions are reference-equal so there is no extra re-render cost."
  - "Synthetic TestConsumer used as primary lock instead of FeatBoard render-counter integration. Plan-explicit fallback (`If mounting FeatBoard turns out to be too heavyweight... fall back to a synthetic <TestConsumer>...`). The TestConsumer uses the IDENTICAL useShallow signature the production files adopt, so a passing spec proves the IDIOM works regardless of FeatBoard's prop dependencies. Two complementary B-suite cases mount FeatBoard directly to confirm integration."

patterns-established:
  - "Slice-as-input useShallow rollout: full FeatStoreState slice (data + actions) → useShallow shallow-compare → only data-field identity changes trigger re-render. The selector's FeatStoreState parameter is satisfied by the slice directly (no synthesised partial cast), and the slice is the single source of subscription truth (no parallel getState() read can drift). Apply to any feat-* consumer that already reads featState as a whole."
  - "Atomic-selector-alongside-useShallow: when a JSX callback path needs a single action handle, keep the atomic useFeatStore((s) => s.action) selector alongside the useShallow slice. zustand returns the SAME function reference for both subscriptions, so the duplication is referentially free. Avoids forcing a deeper JSX edit when the atomic selector is already consumer-facing."

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-04-26
---

# Phase 15 Plan 03: useShallow Narrow Subscription Rollout Summary

**Replaced three full `useFeatStore()` subscriptions across feat-board.tsx, feat-detail-panel.tsx, and feat-sheet-tab.tsx with `useFeatStore(useShallow((s) => ({...slice})))` using the slice-as-input pattern — closing Phase 06 WR-01 (unscoped zustand subscriptions causing per-mutation re-renders) and partially closing the WR-04 cascade (per-render `selectFeatBoardView` thrash via `getState()` snapshots).**

## Performance

- **Duration:** ~5 min (12:11:31Z → 12:16:42Z; 311 s)
- **Started:** 2026-04-26T12:11:31Z
- **Completed:** 2026-04-26T12:16:42Z
- **Tasks:** 1 (TDD-flagged single task; RED spec authored first, GREEN rollout applied second, both committed in one feat commit per the plan's task-level granularity)
- **Files created:** 1 (the new spec)
- **Files modified:** 3 (the 3 feat-* consumers)

## Accomplishments

- **SC#5 closed (Phase 06 WR-01 zustand-subscription tightening):** All 3 feat-* consumers (`feat-board.tsx`, `feat-detail-panel.tsx`, `feat-sheet-tab.tsx`) now subscribe via `useShallow` from `zustand/react/shallow`. The `useFeatStore()` no-arg full-subscription pattern is eliminated from those 3 files (`grep -c "= useFeatStore();"` → 0 in each).
- **Slice-as-input pattern adopted:** Each consumer's `useShallow` selector returns the full FeatStoreState shape (4 data fields + 7 action fields). The destructured slice IS the selector input, so there is no `getState()` snapshot per render, no `void` discards, and no subscription/selector drift. Action references are reference-stable across zustand renders, so including them in the shallow comparison adds zero re-render cost.
- **Atomic-selector invariants preserved:** `feat-board.tsx` retains its line-48/49 atomic selectors for `clearClassFeat` + `clearGeneralFeat` (Phase 12.8-03 D-06 chip-deselect handlers consume them via JSX callbacks). The `useShallow` slice above also includes them, but the atomic selectors are the consumer-facing reference path; both subscriptions return reference-equal handles so the duplication is free.
- **Phase 12.8-03 BLOCKER 2 single-declaration invariant preserved:** `const activeLevel = boardView.activeSheet.level;` remains the single declaration in feat-board.tsx (`grep -c` → 1).
- **15-02 JSX-tree edits left untouched:** No edits to the `scrollerRef` declaration, the `<div className="feat-board__main" ref={scrollerRef}>` wiring, the `<FeatSheet scrollerRef={scrollerRef}>` prop, or the `useRef` import. The two waves' edits are textually disjoint by line range and concern.
- **New regression lock:** `tests/phase-15/feat-store-shallow.spec.tsx` (6 cases). Suite A (4 cases) uses a synthetic `<TestConsumer>` with the IDENTICAL useShallow signature to lock the idiom directly: A1 unrelated mutation → no re-render; A2 referentially-equal subscribed-field set → no re-render; A3 new array identity for `levels` → re-render; A4 `setActiveLevel` → re-render. Suite B (2 cases) mounts `<FeatBoard>` directly: B1 sanity mount; B2 unrelated mutation → no Wrapper re-render.

## Task Commits

1. **Task 1: useShallow rollout to 3 feat-* consumers + 6-case regression spec** — `61ee3c5` (feat)

## Files Created/Modified

### Created

- `tests/phase-15/feat-store-shallow.spec.tsx` — 6 cases:
  - **A1** consumer does NOT re-render on unrelated store mutation (toggleMobileNav on a different store)
  - **A2** consumer does NOT re-render when subscribed fields keep identity (`setState((s) => ({ levels: s.levels }))`)
  - **A3** consumer DOES re-render when a subscribed slice (levels) changes identity (`setState((s) => ({ levels: [...s.levels] }))`)
  - **A4** consumer DOES re-render when activeLevel changes (`setActiveLevel(2)`)
  - **B1** FeatBoard mounts cleanly (sanity)
  - **B2** FeatBoard does NOT re-render when an unrelated store mutates

### Modified

- `apps/planner/src/features/feats/feat-board.tsx` — Added `import { useShallow } from 'zustand/react/shallow';` (line 2). Replaced L42 `const featState = useFeatStore();` with the slice-as-input useShallow selector returning all 11 FeatStoreState fields (4 data + 7 actions). Atomic selectors at L48-49 (`clearClassFeat` + `clearGeneralFeat`) KEPT for the consumer-facing reference path used by the chip-deselect JSX callbacks. The line 64 `const activeLevel = boardView.activeSheet.level;` single-declaration invariant preserved. JSX body unchanged. The 15-02 `scrollerRef` wiring (L72 declaration, L97 ref attachment, L135 prop) untouched.
- `apps/planner/src/features/feats/feat-detail-panel.tsx` — Added `import { useShallow } from 'zustand/react/shallow';`. Replaced L17 with the same slice-as-input pattern. The downstream `computeBuildStateAtLevel(...featState)` call (line 60-66 post-edit) and `evaluateFeatPrerequisites` call (line 68-73 post-edit) are unaffected by the subscription change since `featState` retains the same shape.
- `apps/planner/src/features/feats/feat-sheet-tab.tsx` — Added `import { useShallow } from 'zustand/react/shallow';`. Replaced L15 with the same slice-as-input pattern. The downstream `selectFeatSheetTabView(featState, ...)` call is unaffected.

## Decisions Made

- **Full FeatStoreState slice (data + actions) for ALL 3 consumers** instead of narrowed `{ levels }` slice. Rationale: zustand 5.x keeps action references stable across renders; the shallow comparison resolves true on action fields and only data-field identity changes trigger re-renders. The full slice satisfies the FeatStoreState type expectation downstream selectors (`selectFeatBoardView`, `selectFeatSheetTabView`, `computeBuildStateAtLevel`) require, with NO synthesised-partial cast and NO ambiguity about whether a future selector tweak would need an additional field. A future refactor can narrow further with no behavioural difference.
- **Atomic clearClassFeat + clearGeneralFeat selectors retained at feat-board.tsx L48-49** — Phase 12.8-03 D-06 invariant; the JSX `<FeatSummaryCard onDeselect={...}>` callback consumes them by closure. Replacing with `featState.clearClassFeat` would force a deeper edit; both subscriptions return reference-equal handles so the duplication is free.
- **Synthetic TestConsumer used as primary idiom lock** instead of a FeatBoard-render-counter integration. Plan-explicit fallback ("`If mounting FeatBoard turns out to be too heavyweight for this assertion, fall back to a synthetic <TestConsumer>`"). The TestConsumer uses the IDENTICAL useShallow signature the production files adopt, so a passing spec proves the IDIOM works regardless of FeatBoard's prop dependencies. Two complementary B-suite cases mount FeatBoard directly to confirm integration without depending on its render lifecycle for the core assertion.
- **No new packages, no styles, no copy:** D-NO-CSS, D-NO-COPY, D-NO-DEPS gates green. `git diff apps/planner/src/styles/`, `git diff apps/planner/src/lib/copy/`, and `git diff package.json apps/planner/package.json packages/*/package.json` all empty.

## Patterns Established

- **Slice-as-input useShallow rollout:** full store-state slice (data + actions) → useShallow shallow-compare → only data-field identity changes trigger re-render. The destructured slice IS the selector input; no parallel `getState()` read, no risk of subscription/selector drift. The IDIOM is now the canonical replacement for `useFeatStore()` no-arg full subscriptions in any feat-* consumer that reads featState as a whole.
- **Atomic-selector-alongside-useShallow:** when a JSX callback path needs a single action handle and refactoring the JSX consumer is out of scope, keep the atomic `useFeatStore((s) => s.action)` selector alongside the useShallow slice. zustand returns the SAME function reference for both subscriptions, so the duplication is referentially free. Pattern exemplified at feat-board.tsx L48-49 alongside the L51-65 useShallow slice.

## Reconciliation Note

CONTEXT.md D-06 originally listed FOUR target files including `apps/planner/src/features/feats/feat-search.tsx`. **That file does NOT exist on disk** in the current codebase — verified 2026-04-25 via 15-PATTERNS.md "No Analog Found" entry and re-confirmed during 15-03 execution. The current `apps/planner/src/features/feats/` directory contains: `feat-board.tsx`, `feat-detail-panel.tsx`, `feat-family-expander.tsx`, `feat-sheet-tab.tsx`, `feat-sheet.tsx`, `feat-summary-card.tsx`, plus stores/selectors. No `feat-search.tsx`. The CONTEXT.md D-06 amendment in-place (lines around 51) acknowledges this and shrinks the rollout to the 3 files that exist. The CONTEXT.md `feat-board.tsx` line was originally listed as L14 (an import line); corrected to L42 where the offending `const featState = useFeatStore();` actually lived pre-edit.

**This SUMMARY confirms:** `feat-search.tsx` was dropped from D-06 scope because the file does not exist on disk. No useShallow rollout was possible against a non-existent file. Phase 15 SC #5 closure for the 3-file rollout is complete; the audit-cluster's "4-file" framing is reconciled to "3 files (feat-search.tsx absent post-Phase-06 refactor)".

## Deviations from Plan

None — plan executed exactly as written. The plan-explicit fallback to a synthetic `<TestConsumer>` for the primary idiom lock was selected (over a FeatBoard render-counter integration) per the plan's authorization, but this is a within-scope decision the plan permits, not a deviation.

### Auto-fixed Issues

None.

### Authentication Gates

None.

## Issues Encountered

- **Pre-existing baseline failures noted (carry-forward, not phase-15-03 regressions):**
  - 2 phase-12.4 class-picker-prestige-reachability cases (L1 regresión + L9 Caballero Arcano blocker copy)
  - Confirmed via `git stash` + rerun on master: same 2 failures pre-exist on master with my changes stashed. These are documented as Phase 13 baseline drift carried forward unchanged in 15-01-SUMMARY and 15-02-SUMMARY "Issues Encountered" sections.
  - **No new regressions introduced by this plan.**

## Verification Results

- **Phase 15 plan-15-03 spec:** `tests/phase-15/feat-store-shallow.spec.tsx` 6/6 GREEN, exit=0, 0 unhandled errors.
- **Phase 15 (full plan-15 jsdom suite):** all 7 spec files (15-01 + 15-02 + 15-03) GREEN.
- **Phase 06 regression specs:** all spec files GREEN — verified 103/103 across phase-06 + phase-15 union.
- **Phase 12.4 / 12.7 / 12.8 regression specs:** 1510/1512 GREEN (2 pre-existing baseline failures documented above).
- **Typecheck (`corepack pnpm typecheck`):** clean exit, no new errors.
- **Acceptance grep gates:**
  - `grep -c "useShallow" feat-board.tsx` = 5 ✓ (>= 1 required)
  - `grep -c "useShallow" feat-detail-panel.tsx` = 3 ✓ (>= 1 required)
  - `grep -c "useShallow" feat-sheet-tab.tsx` = 3 ✓ (>= 1 required)
  - `grep -c "import { useShallow } from 'zustand/react/shallow'" feat-board.tsx` = 1 ✓
  - `grep -c "import { useShallow } from 'zustand/react/shallow'" feat-detail-panel.tsx` = 1 ✓
  - `grep -c "import { useShallow } from 'zustand/react/shallow'" feat-sheet-tab.tsx` = 1 ✓
  - `grep -c "= useFeatStore();" feat-board.tsx` = 0 ✓ (full subscription replaced)
  - `grep -c "= useFeatStore();" feat-detail-panel.tsx` = 0 ✓
  - `grep -c "= useFeatStore();" feat-sheet-tab.tsx` = 0 ✓
  - `grep -cE '^[[:space:]]*void [a-zA-Z]'` = 0 in all 3 files ✓ (no void discards — slice-as-input eliminates the need)
  - `grep -c 'useFeatStore.getState()'` = 0 in all 3 files ✓ (no per-render snapshot read)
  - `grep -c "const activeLevel = boardView.activeSheet.level;" feat-board.tsx` = 1 ✓ (Phase 12.8-03 BLOCKER 2 invariant preserved)
  - `grep -c "useFeatStore((s) => s.clearClassFeat)" feat-board.tsx` = 1 ✓ (atomic action selector preserved per CONTEXT line 127)
  - `grep -c "useFeatStore((s) => s.clearGeneralFeat)" feat-board.tsx` = 1 ✓
- **D-NO-CSS:** `git diff apps/planner/src/styles/` empty ✓
- **D-NO-COPY:** `git diff apps/planner/src/lib/copy/` empty ✓
- **D-NO-DEPS:** `git diff package.json apps/planner/package.json packages/rules-engine/package.json packages/data-extractor/package.json` empty ✓ (zustand 5.0.10 already present, no install needed)

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 15 complete:** all 3 plans in the phase merged. Phase 15 SC #1 (focus trap) + SC #2 (focus return spec) + SC #3 (body scroll lock) closed by 15-01; SC #4 (querySelector scope-down) closed by 15-02; SC #5 (zustand subscription tightening + canonicalIdRegex guard) closed by 15-02 (cast portion) + 15-03 (subscription-narrowing portion). Phase 15 audit cluster from v1.0-MILESTONE-AUDIT.md fully retired.
- **Phase 06 WR-01 closed:** unscoped `useFeatStore()` full subscriptions in feat-board.tsx + feat-detail-panel.tsx + feat-sheet-tab.tsx replaced with useShallow narrow subscriptions. The 4th file CONTEXT.md originally targeted (`feat-search.tsx`) is documented as not-on-disk (post-Phase-06 refactor) and out of scope.
- **Phase 06 WR-04 cascade fix progress:** `selectFeatBoardView` per-render thrash that the audit flagged is partially mitigated by the new useShallow narrow subscription (data-field identity now stabilises across unrelated zustand mutations). The deeper WR-04 fix (memoisation of selectFeatBoardView itself) is explicitly deferred per CONTEXT.md "Out of scope" line 22.
- **Cross-store full subscriptions remain (out of scope):** `useLevelProgressionStore()`, `useCharacterFoundationStore()`, `useSkillStore()` are still full subscriptions in the 3 modified files. Phase 06 WR-01 specifically called out 4 feat-store callsites; the other-store subscriptions are NOT in the WR-01 cluster and are documented in the plan as "Future phase work can extend to other stores."

## Self-Check: PASSED

Verified files exist:
- FOUND: apps/planner/src/features/feats/feat-board.tsx
- FOUND: apps/planner/src/features/feats/feat-detail-panel.tsx
- FOUND: apps/planner/src/features/feats/feat-sheet-tab.tsx
- FOUND: tests/phase-15/feat-store-shallow.spec.tsx

Verified commits exist:
- FOUND: 61ee3c5 (Task 1: useShallow rollout to 3 feat-* consumers + 6-case regression spec)

---
*Phase: 15-a11y-modal-polish*
*Completed: 2026-04-26*
