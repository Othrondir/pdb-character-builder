# Quick Task 260425-r5j Summary

## Resultado

El panel `Progresión 1-20` ahora define su propio host de altura completa y la
lista de niveles consume el espacio restante con scroll vertical.

## Cambios

- `apps/planner/src/styles/app.css`
  - `.build-progression-board` ahora es `flex` en columna con `height: 100%`,
    `min-height: 0` y `overflow: hidden`
  - `.level-progression__list` ahora usa `flex: 1 1 auto`
- `tests/phase-12.6/level-progression-scan.spec.tsx`
  - nuevas aserciones de contrato CSS
  - nueva comprobación DOM/computed-style para host en columna + lista scrollable

## Verificación

- `corepack pnpm vitest run tests/phase-12.6/level-progression-scan.spec.tsx --reporter=dot`
- `corepack pnpm typecheck`
