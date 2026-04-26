# Quick Task 260425-qzv Summary

## Resultado

El listado de dotes ya no muestra como seleccionables las dotes que la clase
auto-otorga hasta el nivel activo.

## Cambios

- `packages/rules-engine/src/feats/feat-eligibility.ts`
  - nuevo helper `getAutoGrantedFeatIdsThroughClassLevel`
  - exclusión de auto-grants del pool elegible
- `apps/planner/src/features/feats/selectors.ts`
  - `computeBuildStateAtLevel` ahora cuenta auto-grants hasta el nivel activo
  - el picker filtra auto-grants acumulados del personaje
- tests
  - cobertura de Brujo L1 sin `Competencia con armadura ligera`
  - cobertura de Guerrero L1 sin `Competencia con armadura pesada` ni `Pavés`

## Verificación

- `corepack pnpm vitest run tests/phase-06/feat-eligibility.spec.ts tests/phase-06/feat-proficiency.spec.ts tests/phase-06/feat-prerequisite.spec.ts tests/phase-06/feat-revalidation.spec.ts --reporter=dot`
- `corepack pnpm vitest run tests/phase-12.4/feat-selectability-states.spec.tsx tests/phase-12.4/per-level-budget.fixture.spec.ts --reporter=dot`
