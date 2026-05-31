# Debug: regresiones de suite completa 2026-05-31

## Contexto

Tras corregir las solturas magicas basicas de Hechicero nivel 3, las suites focalizadas y `pnpm run typecheck` pasan, pero `pnpm exec vitest run --reporter=dot` expone 14 fallos en areas historicas.

## Objetivo

Dejar la suite completa verde, separando expectativas obsoletas de regresiones reales.

## Hipotesis inicial

- Varias pruebas de fase 04 y 12.1/12.2 siguen esperando que ciertas clases de prestigio queden `blocked` por requisitos diferidos, aunque ahora tienen overrides decodificados.
- `BUILD_ENCODING_VERSION` ya es 2 y la prueba de version conserva el literal 1.
- La tabla de resumen de progresion parece haber ganado una columna intencional.
- Algunas pruebas de dotes por nivel conservan expectativas anteriores a la separacion de ranura racial y al calendario por nivel de clase.

## Resolucion

- `evaluateMulticlassLegality` ahora marca como ilegal cualquier clase de prestigio seleccionada en nivel 1. Esto evita que los overrides decodificados hagan que prestigios como Danzarin sombrio aparezcan `legal` en selectores comunes.
- Las pruebas historicas se alinearon con el estado actual:
  - Los prestigios con overrides ya no usan la etiqueta diferida antigua.
  - La ranura racial de Humano L1 sigue apareciendo como pendiente si no se ha elegido.
  - El calendario de dotes de Guerrero se valida por nivel de clase, no por nivel de personaje.
  - `BUILD_ENCODING_VERSION` es 2.
  - La tabla de progresion del resumen tiene 9 columnas por la columna de editar.
- La prueba de revalidacion de progresion vuelve a aislar el contrato del motor mutando el store directamente; los tests de scan cubren la interaccion del picker.

## Verificacion

- `pnpm exec vitest run tests/phase-04/class-prerequisites.spec.ts tests/phase-04/multiclass-rules.spec.ts tests/phase-04/progression-revalidation.spec.tsx --reporter=verbose` -> PASS.
- `pnpm exec vitest run tests/phase-12.1/class-roster-wiring.spec.ts tests/phase-12.2/prestige-filter-l1.spec.ts tests/phase-12.3/dotes-per-level-gate.spec.tsx --reporter=verbose` -> PASS.
- `pnpm exec vitest run tests/phase-08/ruleset-version.spec.ts tests/phase-12.4/class-picker-prestige-reachability.spec.tsx tests/phase-12.9/resumen-progresion-full-width.spec.tsx --reporter=verbose` -> PASS.
- `pnpm exec vitest run tests/phase-04/level-sheet-gains.spec.tsx --reporter=verbose` -> PASS.
- `pnpm run typecheck` -> PASS.
- `pnpm exec vitest run --reporter=dot` -> PASS: 133 passed, 1 skipped; 2313 tests passed, 14 skipped, 1 todo.
- `git diff --check` -> PASS.
