---
quick_id: 260606-l2n
title: Simular equipo en hoja de personaje
status: complete
completed: 2026-06-06
---

# Resumen

La hoja de personaje incluye ahora un bloque separado tras `Voluntad` para
simular CA de equipo. `Simular Equipo nivel 12` aplica +15 CA y `Simular
Equipo nivel 16` aplica +19 CA. Los selectores modales de escudo y armadura
suman sus bonos al mismo valor visible de CA.

La simulacion es estado local de la hoja: no modifica reglas, build guardada,
import/export ni enlaces compartidos.

# Validacion

- Test focalizado de hoja de personaje -> 1 file / 11 tests passed.
- Typecheck -> passed.
- Build planner -> passed.
- Dev server -> HTTP 200 en `http://127.0.0.1:5173/`.
