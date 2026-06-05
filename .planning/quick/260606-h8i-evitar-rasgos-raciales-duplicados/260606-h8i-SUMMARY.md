---
quick_id: 260606-h8i
title: Evitar duplicados en rasgos raciales revisados
status: complete
completed: 2026-06-06
---

# Resumen

La duplicidad detectada era visual: CA natural y bonificadores raciales de
habilidades no se aplicaban mecanicamente. La hoja de personaje no suma CA
natural racial y el sistema de habilidades no suma bonos raciales a Avistar,
Buscar, Escuchar, etc.

Se recorto la capa de "Rasgos revisados de Puerta" para que no repita rasgos ya
presentes en la descripcion base. Ahora solo se muestra cuando hay una
correccion, alias o detalle no presente. Enano artico mantiene la correccion de
tamanio runtime sin bloque revisado duplicado.

# Validacion

- Tests focalizados -> 4 files / 58 tests passed.
- Typecheck -> passed.
- Suite Vitest completa -> 140 files / 2372 tests passed.
- Build planner -> passed.
