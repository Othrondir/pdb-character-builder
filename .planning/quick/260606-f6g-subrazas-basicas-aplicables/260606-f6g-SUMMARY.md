---
quick_id: 260606-f6g
title: Añadir subrazas aplicables a razas basicas
status: complete
completed: 2026-06-06
---

# Resumen

Se añadieron Liche, Licantropo, Tumulario, Umbra, Vampiro y Engendro como
subrazas aplicables a las 13 razas indicadas. Los ids humanos existentes se
mantienen por compatibilidad; el resto usan ids especificos por raza padre.

Los modificadores de caracteristicas de cada subraza se componen con los de la
raza base en la store, por lo que ya afectan atributos finales y consumidores
existentes de `racialModifiers`. Los bonos no modelados por el motor actual
(CA natural, dotes adicionales, habilidades, resistencia magica y ataque) se
registran en la descripcion que aparece al seleccionar la subraza.

# Validacion

- Tests focalizados de subraza/origen/atributos -> 5 files / 30 tests passed.
- Typecheck -> passed.
- Suite Vitest completa -> 139 files / 2360 tests passed.
- Build planner -> passed.
