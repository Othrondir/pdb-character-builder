---
phase: 10-integration-fixes
plan: 01
subsystem: ui
tags: [react, zustand, vitest, testing-library, wizard, foundation]

requires:
  - phase: 03
    provides: selectAttributeBudgetSnapshot, useCharacterFoundationStore
  - phase: 05.2
    provides: SelectionScreen actionBar prop, ActionBar component, planner-shell store
  - phase: 07.1
    provides: creation-stepper shell (the slim shell this plan sidesteps)

provides:
  - AttributesBoard now carries an in-pane ActionBar "Aceptar" affordance
  - Aceptar is gated on attributeBudget.status === 'legal'
  - Aceptar advances shell state to expandedLevel=1 + activeLevelSubStep='class'
  - tests/phase-10/ regression suite pins the three FLOW-01 behaviors

affects: [attributes-blocker, creation-wizard, foundation, FLOW-01]

tech-stack:
  added: []
  patterns:
    - "In-pane wizard advance authoritative over creation-stepper nav (defence against shell/CSS regression)"
    - "Phase-10 tsx tests: @vitest-environment jsdom + createElement(Component) + fireEvent.click (no @vitejs/plugin-react, no user-event)"

key-files:
  created:
    - tests/phase-10/attributes-advance.spec.tsx
  modified:
    - apps/planner/src/features/character-foundation/attributes-board.tsx

key-decisions:
  - "In-pane ActionBar is the authoritative advance affordance for Atributos; the creation-stepper 0x0 root cause remains a separate shell/CSS concern addressed by other plans in Phase 10."
  - "onCancel omitted from the ActionBar (Atributos has no cancel semantics; Reiniciar base handles reset). The ActionBar's {onCancel && ...} guard suppresses the Cancelar button."
  - "Phase-10 tsx regression tests use createElement(Component) instead of JSX to match the phase-08 tsx test pattern — vitest.config.ts does not wire @vitejs/plugin-react so esbuild's default JSX transform would otherwise fail with 'React is not defined'."
  - "fireEvent.click used instead of @testing-library/user-event per planner-deviation flag from plan-checker: user-event is NOT installed in this workspace and the plan explicitly permits the fallback."

patterns-established:
  - "Wizard advance via shell-store setters wired into selection-screen actionBar prop (precedent: origin-board.tsx lines 63-71)"
  - "tests/phase-10 directory convention for future integration-fix regressions"

requirements-completed: [FLOW-01]

duration: 4m
completed: 2026-04-18
---

# Phase 10 Plan 01: Attributes ActionBar Advance Summary

**Wired AttributesBoard with an ActionBar "Aceptar" action that advances the creation wizard to Nivel 1 -> sub-paso Clase, closing the recurring FLOW-01 attributes blocker so the in-pane action is authoritative even if the creation-stepper nav collapses to 0x0.**

## Performance

- **Duration:** 4 minutes (259 seconds)
- **Started:** 2026-04-18T12:43:01Z
- **Completed:** 2026-04-18T12:47:20Z
- **Tasks:** 2/2
- **Files modified:** 1 modified, 1 created

## Accomplishments

- `AttributesBoard` now renders an `ActionBar` with label "Aceptar" that stays disabled until `attributeBudget.status === 'legal'` and, on click, calls `setExpandedLevel(1)` and `setActiveLevelSubStep('class')` on the planner-shell store so the wizard lands cleanly on Nivel 1 -> Clase.
- In-pane advance is now authoritative: even if `nav.creation-stepper` regresses to 0x0 again (the recurring "el mismo fallo de siempre"), the user can always progress past Atributos.
- Regression suite `tests/phase-10/attributes-advance.spec.tsx` locks down the three FLOW-01 behaviors (button exists, disabled when not legal, advances shell on click). 3/3 passing.
- Spanish-first copy respected: button label is the exact literal "Aceptar" (matches origin-board precedent and ActionBar default).
- `Reiniciar base` secondary button preserved; no unintended behaviour changes to the attribute editor.
- No regressions in `tests/phase-03` or `tests/phase-07.1` (28/28 passing after the change).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ActionBar "Aceptar" advance to AttributesBoard** - `1812497` (fix)
2. **Task 2: Regression test — attributes->level1 advance** - `95b8f21` (test)

_Note: The plan declared `tdd="true"` for Task 1. The ordered per-plan sequence (Task 1 implementation, Task 2 regression) means the TDD RED gate is served by Task 2; a strict "write failing test first" commit order was not possible because Task 2 explicitly depends on the AttributesBoard export shape delivered by Task 1 (the `<read_first>` block even says "read AFTER Task 1 lands")._

## Files Created/Modified

- `apps/planner/src/features/character-foundation/attributes-board.tsx` - Added imports for `ActionBar` and `usePlannerShellStore`; pulled `setExpandedLevel` and `setActiveLevelSubStep` selectors; derived `canAdvance = attributeBudget.status === 'legal'`; passed `actionBar` prop to `SelectionScreen` with `acceptLabel="Aceptar"` wired to the advance closure.
- `tests/phase-10/attributes-advance.spec.tsx` - New Vitest + @testing-library/react regression suite with three `it(...)` cases covering FLOW-01 behaviors.

## Decisions Made

- **Sidestep the 0x0 nav root cause**: The recurring creation-stepper 0x0 regression is a shell/CSS issue flagged by the user memory as living in `creation-stepper.tsx` or `level-sub-steps.tsx`. This plan explicitly did NOT touch those files; instead it made the in-pane ActionBar the authoritative advance path, which is robust against any future shell regression.
- **No `onCancel`**: Atributos has no Cancel semantics. `Reiniciar base` already serves reset, and the ActionBar's `{onCancel && ...}` guard cleanly suppresses the Cancelar button when the callback is omitted.
- **Dual setter call**: The planner-shell `setExpandedLevel` already auto-fills `activeLevelSubStep='class'` when `expandedLevel` is truthy AND `activeLevelSubStep` is currently null. We still call BOTH explicitly to guarantee the transition regardless of prior sub-step state (e.g., user revisiting after abandoning level 1), matching the pattern the plan's `<interfaces>` block prescribes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test file rewritten from JSX to `createElement(Component)` form**
- **Found during:** Task 2 (initial spec run)
- **Issue:** The plan's Action block showed JSX syntax (`render(<AttributesBoard />)`). When run under the root `vitest.config.ts`, the test failed with `ReferenceError: React is not defined` because the root config does not wire `@vitejs/plugin-react`, so esbuild's default JSX transform emits `React.createElement(...)` without an auto-injected `import React`. The classic JSX transform requires `React` in scope.
- **Fix:** Rewrote the three `render(...)` calls to use `createElement(AttributesBoard)` and imported `createElement` from `react`. This matches the existing pattern in `tests/phase-08/resumen-board.spec.tsx` and other phase-08 tsx specs.
- **Files modified:** `tests/phase-10/attributes-advance.spec.tsx`
- **Verification:** `corepack pnpm vitest run tests/phase-10/attributes-advance.spec.tsx --reporter=dot` -> `Test Files 1 passed (1) | Tests 3 passed (3)`.
- **Committed in:** `95b8f21` (part of Task 2 commit — no separate deviation commit).

**2. [Rule 3 - Blocking] `@testing-library/user-event` import replaced with `fireEvent.click`**
- **Found during:** Task 2 (drafting spec)
- **Issue:** The plan's Action block imports `@testing-library/user-event`, but the plan-checker flagged (via the execution context) that this package is NOT in `package.json` and is NOT installed under `node_modules/@testing-library/`. The plan itself documents the fallback.
- **Fix:** Used `fireEvent.click(aceptar)` from `@testing-library/react` instead. `@testing-library/react` is already a devDependency.
- **Files modified:** `tests/phase-10/attributes-advance.spec.tsx`
- **Verification:** Spec passes all 3 cases.
- **Committed in:** `95b8f21`.

### Pre-existing issues NOT fixed (out of scope)

**`pnpm typecheck` fails due to pre-existing errors in `tests/phase-03/foundation-validation.spec.ts`**
- These three errors pre-exist on master (confirmed via `git stash` of the Task 1 change — typecheck still fails identically without my edit).
- Root cause: the local helper `createOriginSelection` declares `deities: [{ id: 'deity:none' as const, allowedAlignmentIds: [] as string[] }]`. The string-array creates a union with `DeityRuleRecord[]` that TypeScript cannot narrow because `allowedAlignmentIds` expects `CanonicalId[]` (branded template-literal union), not `string[]`.
- Per GSD scope boundary rule — "Only auto-fix issues DIRECTLY caused by the current task's changes" — this is out of scope for Plan 10-01. The plan touched neither `tests/phase-03/foundation-validation.spec.ts` nor the `DeityRuleRecord` type surface.
- **Impact on this plan:** The plan's acceptance criterion `pnpm typecheck exits 0` cannot be satisfied on master, but the planner-scoped subproject typecheck `tsc -p apps/planner/tsconfig.json --noEmit` exits 0 cleanly — confirming the change introduced by this plan is type-correct.
- **Recommended follow-up:** A separate quick fix or a sibling Phase-10 plan (e.g., as part of the existing Phase-10 wave) should cast `allowedAlignmentIds` to `CanonicalId[]` and import the type. Roughly 3 lines of code.

## Self-Check: PASSED

Verified claims against repository state after the two task commits:

- `[ -f apps/planner/src/features/character-foundation/attributes-board.tsx ]` -> FOUND (modified)
- `[ -f tests/phase-10/attributes-advance.spec.tsx ]` -> FOUND (created)
- `git log --oneline | grep 1812497` -> FOUND (`fix(10-01): wire AttributesBoard ActionBar Aceptar to setExpandedLevel(1) + class substep`)
- `git log --oneline | grep 95b8f21` -> FOUND (`test(10-01): add attributes-advance regression spec`)
- `grep -q "ActionBar" apps/planner/src/features/character-foundation/attributes-board.tsx` -> OK
- `grep -q "usePlannerShellStore" apps/planner/src/features/character-foundation/attributes-board.tsx` -> OK
- `grep -q "setExpandedLevel(1)" apps/planner/src/features/character-foundation/attributes-board.tsx` -> OK
- `grep -q "setActiveLevelSubStep('class')" apps/planner/src/features/character-foundation/attributes-board.tsx` -> OK
- `grep -q 'acceptLabel="Aceptar"' apps/planner/src/features/character-foundation/attributes-board.tsx` -> OK
- `grep -q "Reiniciar base" apps/planner/src/features/character-foundation/attributes-board.tsx` -> OK
- `grep -q "Aceptar" tests/phase-10/attributes-advance.spec.tsx` -> OK
- `grep -q "expandedLevel" tests/phase-10/attributes-advance.spec.tsx` -> OK
- `grep -q "activeLevelSubStep" tests/phase-10/attributes-advance.spec.tsx` -> OK
- `vitest run tests/phase-10/attributes-advance.spec.tsx` -> 3/3 PASS
- `vitest run tests/phase-03 tests/phase-07.1` -> 28/28 PASS (no regressions)
- `tsc -p apps/planner/tsconfig.json --noEmit` -> exit 0 (plan's in-scope type surface clean)
