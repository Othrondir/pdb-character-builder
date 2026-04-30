---
slug: guerrero-bonus-feat-off-by-one
status: resolved
created: 2026-04-30
---

# Debug: Guerrero bonus feat off-by-one

## Sintoma

Build exportado `C:\Users\pzhly\Downloads\pdb-build-build-2026-04-29.json`
mezcla Barbaro y Guerrero. El usuario detecta que la cadencia de dotes de
Guerrero no cuadra: Guerrero debe tener dotes adicionales en sus primeros
niveles de clase.

## Evidencia

- El JSON tiene `class:fighter` en nivel de personaje 2, 3, 8 y 10.
- La dote de clase de Guerrero nivel de clase 1 existe en el export:
  `level=2`, `classFeatId=feat:ataquepoderoso`.
- El catalogo compilado actual trae `class:fighter.bonusFeatSchedule` como
  `[1,3,5,7,9,11,13,15,17,19]`.
- `cls_bfeat_fight.2da` base-game real trae `Bonus=1` en filas
  `0,1,3,5,7,9,11,13,15,17,19`.

## Hipotesis

`parseBonusFeatSchedule` interpreta `rowIndex` como nivel de clase y descarta
fila 0. En tablas `cls_bfeat_*`, fila 0 representa nivel de clase 1. Por tanto
el extractor desplaza las dotes una posicion hacia abajo y elimina el nivel 20.

## Resultado esperado

- Guerrero: niveles de clase `1,2,4,6,8,10,12,14,16,18,20`.
- Mago: `5,10,15,20`.
- Picaro: `10,13,16,19`.
- Runtime y presupuestos por nivel consumen el catalogo corregido.

## Resolucion

- `parseBonusFeatSchedule` ahora mapea `rowIndex + 1` y conserva fila 0 como
  nivel de clase 1.
- `compiled-classes.ts` regenerado solo para el catalogo de clases.
- `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` alineado con niveles de clase reales para
  los fallbacks afectados.
- Specs de Phase 12.4 y 16 actualizados para la cadencia corregida.

## Verificacion

- `corepack pnpm exec vitest run tests/phase-16/bonus-feat-schedule-extractor.spec.ts tests/phase-16/determine-feat-slots-race-aware.spec.ts tests/phase-12.4/per-level-budget.fixture.spec.ts tests/phase-12.4/feat-selectability-states.spec.tsx --reporter=dot` -> 75 passed.
- `corepack pnpm exec vitest run tests/phase-06/feat-eligibility.spec.ts tests/phase-06/feat-revalidation.spec.ts tests/phase-16 tests/phase-12.4/feat-schedule-matrix.spec.ts --reporter=dot` -> 55 passed.
- `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` -> exit 0.
