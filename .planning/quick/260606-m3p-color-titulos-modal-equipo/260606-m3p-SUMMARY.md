---
quick_id: 260606-m3p
title: Color de titulos en modales de equipo
status: complete
completed: 2026-06-06
---

# Resumen

Los titulos de los modales `Tipo de Escudo` y `Tipo de Armadura` ya no heredan
el negro del dialogo nativo. Ahora usan `var(--color-text)`, alineado con el
titulo `Hoja de personaje`.

# Validacion

- Build planner -> passed.
- `git diff --check` -> passed.
- Dev server -> HTTP 200 en `http://127.0.0.1:5173/`.
