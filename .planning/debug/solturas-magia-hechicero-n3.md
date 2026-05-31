---
slug: solturas-magia-hechicero-n3
status: resolved
created: 2026-05-31
resolved: 2026-05-31
---

# Debug: solturas de magia en Hechicero N3

## Sintoma

Hechicero de nivel 3 tiene slot de dote general, pero no muestra las
`Soltura con una escuela de magia` basicas.

## Hipotesis inicial

- Las solturas basicas existen en el catalogo compilado como familia
  `feat:spell-focus`.
- En `class:sorcerer` aparecen en `cls_feat_sorc` con `list=1,onMenu=false`.
- El selector actual solo considera dotes generales si `allClassesCanUse`,
  `list=0,onMenu=true`, o allowlist manual, por lo que estas filas quedan
  encasilladas como pool de clase y nunca aparecen en un nivel con solo slot
  general.

## Contrato a verificar

- Hechicero N3 debe poder seleccionar una soltura basica de escuela de magia
  en su slot general.
- Las solturas basicas deben seguir bloqueadas para personajes que no puedan
  lanzar conjuros de nivel 1.
- Las solturas mayores deben mantener el requisito de la soltura basica
  correspondiente.

## Resolucion

- `feat:spell-focus` pasa a tratarse como familia de dotes generales de clase
  cuando la tabla `cls_feat_*` de la clase la expone como entrada manual.
- Las 8 solturas basicas reciben un backfill runtime `minSpellLevel: 1` hasta
  que se regenere el dataset.
- El extractor y el contrato Zod ya entienden `minSpellLevel` para futuros
  datasets cuando el texto indique "aptitud/capacidad para lanzar conjuros de
  primer nivel".
- El selector muestra el motivo de bloqueo "Requiere lanzar conjuros de nivel
  N" cuando no se cumple el prerequisito.

## Verificacion

- `pnpm exec vitest run tests/phase-06/feat-prerequisite.spec.ts tests/phase-06/feat-eligibility.spec.ts tests/phase-12.4/feat-family-expander.spec.tsx --reporter=dot` — 52/52.
- `pnpm exec vitest run tests/phase-06/feat-revalidation.spec.ts tests/phase-12.4/feat-selectability-states.spec.tsx tests/phase-12.4/feat-schedule-matrix.spec.ts tests/phase-16/determine-feat-slots-race-aware.spec.ts --reporter=dot` — 44/44.
- `pnpm run typecheck` — limpio.

Nota actualizada: esos 14 fallos se resolvieron en
`.planning/debug/full-suite-regresiones-20260531.md`; la suite completa queda
verde.
