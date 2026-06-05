---
quick_id: 260605-c3d
title: Limpiar skipped/todo residuales de Vitest
status: complete
completed: 2026-06-05
---

# Resumen

Se eliminó la deuda visible de `skipped`/`todo` en la suite Vitest.

Cambios principales:

- `packages/data-extractor/src/config.ts` ahora permite configurar rutas locales con variables de entorno y usa defaults por plataforma.
- Las integraciones `phase-05.1` ya no usan `describe.skipIf`; se registran solo cuando existen los datos locales.
- La suite obsoleta de título por nivel ahora prueba el título estático `Progresión 1-20`.
- El `it.todo` de presupuesto racial se sustituyó por una prueba explícita del contrato actual: Elfo/Enano siguen uniformes hasta que haya evidencia fuente de override.
- El `it.skip` defensivo del catálogo de clases se convirtió en fallo real si falta una clase base.

# Validación

- `./node_modules/.bin/vitest run tests/phase-05.1/nwsync-reader.spec.ts tests/phase-05.1/assemblers-core.spec.ts tests/phase-05.1/assemblers-extended.spec.ts --reporter=dot` → 3 files / 40 tests passed.
- `./node_modules/.bin/tsc -p tsconfig.base.json --noEmit` → passed.
- `./node_modules/.bin/vitest run --reporter=dot` → 137 files / 2349 tests passed, 0 skipped, 0 todo.
- Búsqueda estática de `.skip/.todo` reales en `tests` → sin resultados.
