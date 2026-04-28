---
quick_id: 260428-ikf
slug: corregir-solapamiento-del-margen-en-dote
date: 2026-04-28
description: Corregir solapamiento del margen en dotes generales
status: complete
---

# Quick Task 260428-ikf: Solapamiento en dotes generales

## Goal

Corregir el corte visual entre la fila de una dote de familia y su
expander para que `Competencia con arma marcial` mantenga un marco continuo
en la lista de dotes generales.

## Scope

- `apps/planner/src/features/feats/feat-sheet.tsx`
- `apps/planner/src/styles/app.css`

## Tasks

1. Dar clase estructural propia a los items de familia.
2. Unificar borde entre fila expandida y `fieldset`.
3. Verificar que la interacción de la familia sigue verde.
