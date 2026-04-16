---
phase: 06-feats-proficiencies
plan: 02
subsystem: feats-ui-components
tags: [react, feats, ui, search, prerequisites, character-sheet, css]
dependency_graph:
  requires: [feat-store, feat-selectors, feat-prerequisite-evaluator, feat-eligibility-filter, feat-spanish-copy, selection-screen, option-list, detail-panel]
  provides: [feat-board-component, feat-sheet-component, feat-detail-panel-component, feat-search-component, feat-sheet-tab-component, feat-css]
  affects: [center-content-feats-substep, character-sheet-feats-tab]
tech_stack:
  added: []
  patterns: [lifted-focus-state, debounced-search, accent-insensitive-filtering, sequential-step-routing]
key_files:
  created:
    - apps/planner/src/features/feats/feat-board.tsx
    - apps/planner/src/features/feats/feat-sheet.tsx
    - apps/planner/src/features/feats/feat-detail-panel.tsx
    - apps/planner/src/features/feats/feat-search.tsx
    - apps/planner/src/features/feats/feat-sheet-tab.tsx
  modified:
    - apps/planner/src/styles/app.css
    - apps/planner/src/components/shell/center-content.tsx
    - apps/planner/src/components/shell/character-sheet.tsx
    - tests/phase-05.2/character-sheet.spec.tsx
decisions:
  - Lifted focusedFeatId state to FeatBoard to coordinate FeatSheet selection with FeatDetailPanel prereq display
  - FeatDetailPanel reads stores directly and calls evaluateFeatPrerequisites for on-demand prereq computation (avoids bloating FeatBoardView)
  - Search uses evaluateAllFeatsForSearch from rules-engine for full catalog evaluation with per-feat prereq results
metrics:
  duration: 5m
  completed: 2026-04-16
  tasks: 2
  files: 9
---

# Phase 6 Plan 02: Feat UI Components and Shell Wiring Summary

Five React components for feat selection (FeatBoard, FeatSheet, FeatDetailPanel, FeatSearch, FeatSheetTab) with accent-insensitive search, inline prerequisite feedback, sequential class/general feat flow, and character sheet Dotes tab -- all wired into the planner shell replacing placeholders, with CSS following the 06-UI-SPEC contract.

## Tasks Completed

### Task 1: Create FeatBoard, FeatSheet, FeatDetailPanel, FeatSearch, FeatSheetTab components and feat CSS
**Commit:** `a9dd18d`

Created 5 React components and feat CSS:

- **feat-board.tsx**: Center content component following SkillBoard pattern. Reads 4 stores (feat, progression, foundation, skill), calls `selectFeatBoardView`, renders empty state or SelectionScreen with FeatSheet + FeatDetailPanel. Title switches based on sequential step (D-03): "Dote de clase" / "Dote general" / default.
- **feat-sheet.tsx**: Left panel with search input (debounced 200ms), grouped feat sections ("Dotes de clase" / "Dotes generales"). Maps FeatOptionView to OptionItem with prereq summary as secondary text (D-04). Delegates to FeatSearch when query >= 2 chars. Casts featId to CanonicalId for store actions.
- **feat-detail-panel.tsx**: Right panel composing DetailPanel. Reads stores directly and calls `evaluateFeatPrerequisites` for the focused feat. Renders description + prerequisite checklist with is-met/is-failed indicators and Spanish labels.
- **feat-search.tsx**: Accent-insensitive search using NFD normalization over full 1,487-feat catalog via `evaluateAllFeatsForSearch`. Blocked feats show with `feat-board__blocked-reason` containing per-prerequisite failure lines (D-06, D-07).
- **feat-sheet-tab.tsx**: Character sheet Dotes tab with `role="tabpanel"` and `id="sheet-panel-feats"`. Groups feats by level, shows slot type labels (Automatica / Dote de clase / Dote general), invalid markers with status reasons.
- **app.css**: 150+ lines of feat CSS from UI-SPEC contract -- search field, section headings, prereq list, blocked reasons, sheet tab rows with is-auto/is-illegal/is-blocked modifiers.

### Task 2: Wire FeatBoard and FeatSheetTab into shell placeholders
**Commit:** `b1affd8`

- **center-content.tsx**: Replaced `PlaceholderScreen title="Dotes"` with `<FeatBoard />` for `case 'feats'`. Added FeatBoard import. PlaceholderScreen function retained for spells case.
- **character-sheet.tsx**: Removed inline `FeatsPanel` placeholder function. Added FeatSheetTab import and replaced `<FeatsPanel />` with `<FeatSheetTab />`.
- **character-sheet.spec.tsx**: Updated test assertion from "Dotes del personaje" (removed placeholder) to "0 dotes" (FeatSheetTab output with zero selections).

### Task 3: Visual and functional verification of feat selection UI
**Status:** PENDING HUMAN VERIFICATION

This checkpoint requires manual browser verification of:
- Feat board renders with grouped sections
- Search filters with accent-insensitive matching and blocked feat reasons
- Sequential class-then-general feat selection flow
- Prerequisite checklist in detail panel
- Character sheet Dotes tab with all feats and invalid markers
- Proficiency feats appearing as normal feats
- Revalidation markers on upstream changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion updated for replaced placeholder**
- **Found during:** Task 2
- **Issue:** `character-sheet.spec.tsx` expected "Dotes del personaje" from the placeholder FeatsPanel that was removed.
- **Fix:** Updated assertion to check for "0 dotes" which is the output of the real FeatSheetTab with no feat selections.
- **Files modified:** tests/phase-05.2/character-sheet.spec.tsx
- **Commit:** b1affd8

## Known Stubs

None -- all components are fully implemented with real store/selector wiring.

## Decisions Made

1. **Lifted focusedFeatId to FeatBoard**: FeatBoard manages `focusedFeatId` state and passes it to both FeatSheet (for selection highlighting) and FeatDetailPanel (for prereq display). This keeps the two panels coordinated without bloating the selector view model.

2. **FeatDetailPanel reads stores directly**: Rather than passing build state through the board view, the detail panel calls `computeBuildStateAtLevel` and `evaluateFeatPrerequisites` directly when a feat is focused. This is a deliberate choice to keep FeatBoardView lean.

3. **Search uses rules-engine evaluateAllFeatsForSearch**: Full catalog evaluation happens in a useMemo with dependency on debounced query and store states. The 200ms debounce on search input mitigates the O(n) cost per T-06-08.

## Self-Check: PASSED

All 5 created files verified to exist. Both commits (a9dd18d, b1affd8) verified in git log. TypeScript compiles clean. 223/223 tests pass (3 pre-existing Phase 05.1 better-sqlite3 failures are out of scope).
