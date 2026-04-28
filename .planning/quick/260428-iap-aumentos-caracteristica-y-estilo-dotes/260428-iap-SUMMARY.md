---
quick_id: 260428-iap
slug: aumentos-caracteristica-y-estilo-dotes
date: 2026-04-28
status: complete
---

# Quick Task 260428-iap — Summary

## Outcome

Los aumentos de característica elegidos en progresión ya se reflejan en el
panel de atributos, la hoja lateral y el resumen. Además, las dotes
generales parametrizadas muestran sus opciones con etiquetas compactas y un
expander más legible.

## Key Changes

- `apps/planner/src/features/character-foundation/final-attributes.ts`
  - Helper compartido para sumar modificadores raciales y aumentos por nivel.
- `apps/planner/src/features/character-foundation/attributes-board.tsx`
- `apps/planner/src/components/shell/character-sheet.tsx`
- `apps/planner/src/features/summary/resumen-selectors.ts`
  - Consumen la misma fuente de verdad para atributos finales.
- `apps/planner/src/features/level-progression/class-fixture.ts`
  - `abilityIncreaseLevels` ahora incluye nivel 20.
- `apps/planner/src/features/feats/family-labels.ts`
- `apps/planner/src/features/feats/feat-sheet.tsx`
- `apps/planner/src/features/feats/feat-family-expander.tsx`
- `apps/planner/src/styles/app.css`
  - Expander de familias con etiquetas compactas y mejor jerarquía visual.

## Verification

- `corepack pnpm exec vitest run tests/phase-04/level-sheet-gains.spec.tsx tests/phase-05.2/character-sheet.spec.tsx tests/phase-10/attributes-advance.spec.tsx tests/phase-12.4/feat-family-expander.spec.tsx`
- `corepack pnpm run typecheck`
