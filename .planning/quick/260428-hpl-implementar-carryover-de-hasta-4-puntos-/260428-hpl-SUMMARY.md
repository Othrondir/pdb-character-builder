---
quick_id: 260428-hpl
slug: implementar-carryover-de-hasta-4-puntos-
date: 2026-04-28
status: complete
---

# Quick Task 260428-hpl — Summary

## Outcome

El planner ya permite dejar hasta 4 puntos de habilidad sin gastar en un
nivel y arrastrarlos solo al siguiente. El motor de habilidades, el
presupuesto por nivel, el botón de continuar y la hoja de habilidades usan
la misma regla.

## Key Changes

- `packages/rules-engine/src/skills/skill-budget.ts`
  - Helpers puros para presupuesto base, carryover `<= 4` y ajuste requerido.
- `packages/rules-engine/src/skills/skill-allocation.ts`
  - Evaluación secuencial con carryover fail-closed.
- `packages/rules-engine/src/progression/per-level-budget.ts`
  - Soporta carryover inyectado desde el snapshot del planner.
- `apps/planner/src/features/skills/skill-inputs.ts`
  - Helper compartido para construir `SkillLevelInput` con fórmula canónica.
- `apps/planner/src/features/level-progression/selectors.ts`
  - Presupuesto y completitud ahora usan gasto real y carryover derivado.
- `apps/planner/src/features/skills/selectors.ts`
  - Resumen de habilidades ya no duplica puntos guardados; L2 muestra puntos arrastrados.
- `apps/planner/src/features/skills/skill-sheet.tsx`
  - Nueva fila `Puntos guardados`.
- `apps/planner/src/data/ruleset-version.ts`
  - `RULESET_VERSION` sube a `1.0.1`.

## Verification

- `corepack pnpm exec vitest run tests/phase-05/skill-rules.spec.ts tests/phase-12.4/per-level-budget.fixture.spec.ts tests/phase-12.4/level-editor-action-bar.spec.tsx tests/phase-12.7/skill-sheet-disabled-gate.spec.tsx`
- `corepack pnpm exec vitest run tests/phase-12.4/l1-neutral-substeps.spec.tsx tests/phase-12.7/level-editor-action-bar-stepper-mount.spec.tsx tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts tests/phase-16/feat-board-race-bonus-section.spec.tsx`
- `corepack pnpm run typecheck`

Todo verde.
