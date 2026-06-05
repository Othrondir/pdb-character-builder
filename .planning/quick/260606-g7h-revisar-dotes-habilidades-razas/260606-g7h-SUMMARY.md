---
quick_id: 260606-g7h
title: Revisar dotes y habilidades de razas y subrazas
status: complete
completed: 2026-06-06
---

# Resumen

Se revisaron los rasgos de razas y subrazas en una capa curada runtime del
planner, sin editar el catalogo generado `compiled-races.ts`. Los textos
revisados quedan visibles como bloque "Rasgos revisados de Puerta" en el panel
de origen.

El motor aplica ahora las mecanicas que ya estaban modeladas:

- Oni (`race:ogro-hechicero`): dote racial adicional a nivel 1 y +4 puntos de
  habilidad solo a nivel 1.
- Semielfo (`race:halfelf`): +4 puntos de habilidad a nivel 1 y +1 punto por
  nivel posterior.
- Enano artico (`race:enano-artico`): tamanio runtime corregido a pequenio.

Se anadio Elfo Lythari como subraza curada de `race:elf` con los rasgos
indicados y sin ajustes de caracteristica inventados.

# Validacion

- Tests focalizados -> 5 files / 58 tests passed.
- Typecheck -> passed.
- Suite Vitest completa -> 140 files / 2369 tests passed.
- Build planner -> passed.
