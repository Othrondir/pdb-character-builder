# Quick Task 260414-gxx: ignorar artefactos locales del workspace

**Date:** 2026-04-14
**Status:** Completed

## Goal

Evitar que artefactos locales del entorno aparezcan como cambios sin seguimiento en el repositorio.

## Tasks

1. Actualizar `.gitignore` con patrones para los archivos y carpetas locales detectados en el workspace.
2. Verificar que `git status` deje de mostrar `.idea/`, `.tmp/`, `NWN 1 character builder.sln` y `NWN UI Mock/`.

## Verification

- `git status --short --branch`
