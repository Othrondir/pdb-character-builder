---
quick_id: 260606-e5f
title: Separar raza-origen por grupos
status: complete
completed: 2026-06-06
---

# Resumen

La lista de Raza en Origen queda separada en:

- Razas basicas
- Subrazas menores
- Subrazas intermedias
- Subrazas mayores

La UI conserva los ids `race:*` existentes y solo agrupa el render. La
clasificacion se deriva del `sourceRow` del catalogo compilado: base `0-6`,
menores `160-195`, intermedias `220-225` y mayores `240+`. La lista secundaria
de subrazas humanas (`subrace:*`) sigue mostrandose bajo Humano en el panel de
detalle.

# Validacion

- Tests focalizados de Origen/raza/subraza -> 5 files / 23 tests passed.
- Typecheck -> passed.
- Suite Vitest completa -> 139 files / 2356 tests passed.
- Build planner -> passed.
- Dev server local -> HTTP 200 en `http://127.0.0.1:5173/`.
- Captura Chromium 1280x800 -> generada en `/tmp/pdb-origin-race-groups.png`;
  sin solapamientos obvios en Origen.
