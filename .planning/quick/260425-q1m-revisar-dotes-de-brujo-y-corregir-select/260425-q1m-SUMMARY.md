# Quick Task 260425-q1m Summary

## Outcome

- Brujo now gets manual invocation pick slots at class levels 1, 6, 11, and 16.
- Manual feat pools now respect `onMenu=true` so hidden class feats stay hidden.
- `Arma de aliento` is blocked from manual feat selection while preserving auto-grants.
- First-level-only feat descriptions now derive `maxLevel: 1` in the extractor when the 2DA field is missing.
- Feat UI now shows a specific blocker reason for max-level gated feats.

## Verification

- `corepack pnpm vitest run tests/phase-05.1/assemblers-extended.spec.ts --reporter=dot`
- `corepack pnpm vitest run tests/phase-06/feat-eligibility.spec.ts tests/phase-06/feat-revalidation.spec.ts tests/phase-06/feat-prerequisite.spec.ts --reporter=dot`
- `corepack pnpm vitest run tests/phase-12.4/feat-selectability-states.spec.tsx --reporter=dot`
- `corepack pnpm vitest run tests/phase-12.4/per-level-budget.fixture.spec.ts --reporter=dot`
- `corepack pnpm vitest run tests/phase-12.4/prestige-gate.fixture.spec.ts --reporter=dot`
- `corepack pnpm typecheck`
