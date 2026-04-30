---
quick_id: 260430-fip
slug: a-adir-subida-obligatoria-de-punto-de-ca
date: 2026-04-30
description: Añadir subida obligatoria de punto de característica en niveles de progresión asociados
status: planned
---

# Quick Task 260430-fip: Subida obligatoria de característica

## Goal

Los niveles con aumento de característica deben bloquear el avance hasta que el
jugador asigne ese +1 en la fila de progresión correspondiente.

## Tasks

1. Extender `selectLevelCompletionState` para detectar aumentos pendientes en
   niveles 4/8/12/16/20 y hacer que `computeAdvanceLabel` bloquee el botón.
2. Añadir copy española específica para el bloqueo por característica.
3. Cubrir el flujo con Vitest: nivel 4 completo salvo característica bloquea;
   tras asignarla permite avanzar.

## Verification

- `corepack pnpm exec vitest run tests/phase-12.4/level-editor-action-bar.spec.tsx tests/phase-04/level-sheet-gains.spec.tsx`
- `corepack pnpm run typecheck`
