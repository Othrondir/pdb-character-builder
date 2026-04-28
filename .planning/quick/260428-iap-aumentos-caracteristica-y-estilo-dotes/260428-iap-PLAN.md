---
quick_id: 260428-iap
slug: aumentos-caracteristica-y-estilo-dotes
date: 2026-04-28
description: Corregir aumentos de característica por nivel y el expander de dotes generales
status: complete
---

# Quick Task 260428-iap: Aumentos de característica y dotes generales

## Goal

Hacer que los aumentos de característica por nivel afecten a los totales
visibles del planner y pulir la presentación de las dotes generales
parametrizadas para que la selección sea legible.

## Scope

- `apps/planner/src/features/character-foundation/*`
- `apps/planner/src/components/shell/character-sheet.tsx`
- `apps/planner/src/features/summary/resumen-selectors.ts`
- `apps/planner/src/features/level-progression/class-fixture.ts`
- `apps/planner/src/features/feats/*`
- `apps/planner/src/styles/app.css`

## Tasks

1. Extraer un helper común para atributos finales con raza + aumentos de
   progresión.
2. Conectar ese helper al tablero de atributos, hoja lateral y resumen.
3. Completar la tabla de aumentos de característica hasta nivel 20.
4. Compactar las etiquetas del expander de dotes y mejorar su layout.
5. Cubrir el cambio con Vitest y typecheck.
