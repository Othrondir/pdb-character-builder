---
quick_id: 260428-iot
slug: investigar-error-de-deploy-pages-404
date: 2026-04-28
description: Investigar error de deploy Pages 404
status: complete
---

# Quick Task 260428-iot: Deploy Pages 404

## Goal

Diagnosticar por qué el workflow de GitHub Pages falla con `Get Pages site
failed` y dejar el deploy preparado tanto para repos con Pages ya activado
como para auto-enable mediante secret con permisos altos.

## Scope

- `.github/workflows/deploy-pages.yml`

## Tasks

1. Revisar el workflow actual de Pages.
2. Confirmar en la documentación del action oficial cómo funciona
   `enablement`.
3. Ajustar el workflow para usar auto-enable cuando exista un token apto.
4. Documentar el requisito manual cuando solo se use `GITHUB_TOKEN`.
