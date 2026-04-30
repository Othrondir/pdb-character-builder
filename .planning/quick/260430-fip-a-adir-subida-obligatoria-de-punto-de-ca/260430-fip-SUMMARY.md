---
quick_id: 260430-fip
slug: a-adir-subida-obligatoria-de-punto-de-ca
date: 2026-04-30
status: complete
---

# Quick Task 260430-fip — Summary

## Outcome

Los niveles con aumento de característica ya bloquean el avance hasta que el
jugador asigna el +1 correspondiente en la fila de progresión.

## Key Changes

- `apps/planner/src/features/level-progression/selectors.ts`
  - `selectLevelCompletionState` calcula `abilityDeficit` para niveles
    4/8/12/16/20 cuando hay clase elegida y falta `abilityIncrease`.
  - `computeAdvanceLabel` muestra el bloqueo de característica antes de
    permitir continuar.
- `apps/planner/src/lib/copy/es.ts`
  - Copy española para el nuevo bloqueo.
- `tests/phase-12.4/level-editor-action-bar.spec.tsx`
  - Casos L4: bloqueado sin aumento, habilitado tras asignarlo.

## Verification

- `corepack pnpm exec vitest run tests/phase-12.4/level-editor-action-bar.spec.tsx tests/phase-04/level-sheet-gains.spec.tsx`
- `corepack pnpm run typecheck`
