---
quick_id: 260428-ikf
slug: corregir-solapamiento-del-margen-en-dote
date: 2026-04-28
status: complete
---

# Quick Task 260428-ikf — Summary

## Outcome

La fila de familia y su expander ya se renderizan como una única pieza
visual, evitando que el marco parezca cortarse en `Competencia con arma
marcial`.

## Key Changes

- `apps/planner/src/features/feats/feat-sheet.tsx`
  - Los `li` de familia ahora tienen clases estructurales específicas.
- `apps/planner/src/styles/app.css`
  - Continuidad de borde entre la fila expandida y el `fieldset`.
  - `feat-family-expander` con `display:block` y `min-inline-size:0`.

## Verification

- `corepack pnpm exec vitest run tests/phase-12.4/feat-family-expander.spec.tsx`
- `corepack pnpm run typecheck`
