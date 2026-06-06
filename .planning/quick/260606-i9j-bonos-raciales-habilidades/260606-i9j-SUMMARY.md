---
quick_id: 260606-i9j
title: Aplicar bonos raciales y de subraza en habilidades
status: complete
completed: 2026-06-06
---

# Resumen

Los bonos raciales y de subraza a habilidades ahora se calculan en la pestaña
Habilidades. No consumen puntos ni cuentan como rangos asignados para el tope:
se suman al total visible y se muestran con una etiqueta `+X racial`.

La misma suma se aplica al resumen y a la vista tecnica de habilidades. Los
bonos de raza y subraza se acumulan; por ejemplo, Elfo + Liche suma las
afinidades elficas con los +8 de Liche.

# Validacion

- Tests focalizados -> 5 files / 25 tests passed.
- Typecheck -> passed.
- Suite Vitest completa -> 141 files / 2376 tests passed.
- Build planner -> passed.
