---
quick_id: 260428-iot
slug: investigar-error-de-deploy-pages-404
date: 2026-04-28
status: complete
---

# Quick Task 260428-iot — Summary

## Outcome

El fallo no estaba en el build del planner sino en la activación de GitHub
Pages para el repositorio. El workflow ahora soporta auto-enable si existe
un secret `GH_PAGES_ADMIN_TOKEN`; si no existe, sigue usando el flujo normal
de `configure-pages`, que requiere que Pages ya esté activado en el repo.

## Key Changes

- `.github/workflows/deploy-pages.yml`
  - `actions/configure-pages@v6` ahora tiene dos ramas:
    - con `GH_PAGES_ADMIN_TOKEN`: `enablement: true`
    - sin secret: comportamiento actual

## Verification

- Revisión del workflow resultante por diff.
- No se ejecutó un linter YAML local: `ConvertFrom-Yaml` no está disponible
  en este entorno.
