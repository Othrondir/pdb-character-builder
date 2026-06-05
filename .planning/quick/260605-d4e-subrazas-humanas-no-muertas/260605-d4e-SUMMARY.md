---
quick_id: 260605-d4e
title: Añadir subrazas humanas aplicables
status: complete
completed: 2026-06-05
---

# Resumen

Se añadieron cinco subrazas seleccionables bajo Humano:

- Liche
- Licántropo
- Tumulario
- Vampiro
- Engendro vampírico

La implementación usa un catálogo runtime curado (`plannerRaceCatalog`) que compone el catálogo generado del extractor con estas subrazas manuales. Así no se toca `compiled-races.ts`, que sigue siendo regenerable.

# Validación

- Tests focalizados de subrazas/origen/resumen → 6 files / 34 tests passed.
- `./node_modules/.bin/tsc -p tsconfig.base.json --noEmit` → passed.
- `./node_modules/.bin/vitest run --reporter=dot` → 138 files / 2354 tests passed.
