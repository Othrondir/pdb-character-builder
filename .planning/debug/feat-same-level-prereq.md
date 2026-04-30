# Debug: same-level feat prerequisites

Status: fixed
Date: 2026-04-30

## Symptom

At level 1 Guerrero, a character with Fuerza 13+ could select `feat:ataquepoderoso`
in the class bonus feat slot, but `feat:cleave` / Hendedura remained blocked in
the general feat slot as if Ataque poderoso had not been taken.

The same defect applied to any feat chain where prerequisite and dependent feat
can be selected in different slots of the same level.

## Root Cause

`computeBuildStateAtLevel` only included feats chosen on levels strictly before
the active level when building `selectedFeatIds`.

That made prerequisite evaluation blind to choices already made in another slot
of the same level.

## Fix

Include selected feats from all levels up to and including the active level when
building `selectedFeatIds`.

The duplicate-pick guard remains level-aware through `findAlreadyTakenAtLevel`,
so the current-level selection can still be toggled while feats taken on prior
or later levels stay unavailable as duplicates.

## Verification

- RED: added a failing test for L1 Guerrero selecting Ataque poderoso in the
  class slot and expecting Hendedura to become selectable in the general slot.
- GREEN: `corepack pnpm exec vitest run tests/phase-12.4/feat-selectability-states.spec.tsx --reporter=dot`
- Broader feat checks: `corepack pnpm exec vitest run tests/phase-12.4/feat-selectability-states.spec.tsx tests/phase-06/feat-prerequisite.spec.ts tests/phase-06/feat-eligibility.spec.ts --reporter=dot`
- Typecheck: `corepack pnpm run typecheck`

Note: `tests/phase-12.3/dotes-per-level-gate.spec.tsx` currently has two
independent schedule assertions failing when run by itself; they are unrelated
to same-level prerequisite evaluation.
