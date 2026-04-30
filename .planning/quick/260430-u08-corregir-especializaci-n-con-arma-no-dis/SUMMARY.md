# Quick 260430-u08 - Especializacion de arma en Guerrero 4

## Problema

Guerrero de nivel 4 no mostraba `Especializacion en armas` aunque el personaje ya tuviera la `Soltura con arma` correspondiente.

La causa era comun: el selector y el motor interpretaban `OnMenu=false` como "no seleccionable manualmente" para filas `list=1/2`. En los datos de NWN/Puerta, `list=1/2` identifica pools manuales de clase y `OnMenu` es metadato de menu/radial. Esto tambien hacia que algunas elecciones de clase `list=1/2,onMenu=false` se tratasen como autoconcedidas.

## Cambio

- `list=1/2`: pool manual de dote de clase.
- `list=3`: dote autoconcedida.
- El planner reutiliza la misma regla para poblar la seccion de dotes de clase.

## Verificacion

- `corepack pnpm exec vitest run tests/phase-06/feat-eligibility.spec.ts tests/phase-12.4/feat-selectability-states.spec.tsx tests/phase-16/determine-feat-slots-race-aware.spec.ts tests/phase-12.4/feat-schedule-matrix.spec.ts tests/phase-06/feat-proficiency.spec.ts tests/phase-06/feat-revalidation.spec.ts --reporter=dot`
- `corepack pnpm run typecheck`
