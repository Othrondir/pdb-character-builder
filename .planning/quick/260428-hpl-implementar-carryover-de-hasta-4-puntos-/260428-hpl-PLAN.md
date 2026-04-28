---
quick_id: 260428-hpl
slug: implementar-carryover-de-hasta-4-puntos-
date: 2026-04-28
description: Implementar carryover de hasta 4 puntos de habilidad al nivel siguiente
status: ready
---

# Quick Task 260428-hpl: Carryover de puntos de habilidad

## Goal

Permitir dejar hasta 4 puntos de habilidad sin gastar en un nivel y sumarlos
solo al nivel siguiente, manteniendo sincronizados motor, presupuesto por
nivel, completitud del stepper y UI de habilidades.

## Scope

- `packages/rules-engine/src/skills/skill-budget.ts`
- `packages/rules-engine/src/skills/skill-allocation.ts`
- `packages/rules-engine/src/progression/per-level-budget.ts`
- `apps/planner/src/features/level-progression/selectors.ts`
- `apps/planner/src/features/skills/selectors.ts`
- tests de reglas/presupuesto/progreso

## Tasks

1. Añadir helpers puros de carryover (`<= 4`) y usarlos en la evaluación
   secuencial de habilidades y en `computePerLevelBudget`.
2. Corregir el adaptador del planner para contar gasto real de transclase y
   marcar el nivel como completo cuando el remanente sea guardable.
3. Ajustar resúmenes/UI mínima para exponer el presupuesto correcto y cubrir
   el comportamiento con Vitest.

## Must-haves

- El carryover se deriva, sin cambios de schema.
- Un remanente `0..4` habilita continuar; `>4` sigue bloqueando.
- Motor de habilidades y presupuesto por nivel usan la misma regla.
