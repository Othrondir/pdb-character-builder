---
quick_id: 260606-k1m
title: Mover subrazas con subraza a razas basicas
status: complete
completed: 2026-06-06
---

# Resumen

Las opciones de Raza que pueden abrir una seleccion de Subraza ahora aparecen
en `Razas basicas`. La regla se deriva de las subrazas reales del fixture:
si una raza aparece como `parentRaceId`, se agrupa como basica aunque su
`sourceRow` original sea de subraza menor, intermedia o mayor.

La clasificacion por `sourceRow` sigue aplicando para las razas que no tienen
subrazas hijas.

# Validacion

- Test focalizado de agrupacion -> 1 file / 4 tests passed.
- Tests relacionados de subrazas/origen -> 2 files / 13 tests passed.
- Typecheck -> passed.
- Build planner -> passed.
- Dev server -> HTTP 200 en `http://127.0.0.1:5173/`.
