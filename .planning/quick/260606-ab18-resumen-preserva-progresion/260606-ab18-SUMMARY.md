# Summary: Resumen preserva progresion abierta

## Resultado

Entrar en `Resumen` ya no borra el cursor de progresion abierto. Si el usuario acepta atributos y queda en nivel 1, el stepper conserva `Clase`, `Habilidades` y `Dotes` aunque el centro muestre el resumen.

El boton de `Resumen` sigue cerrando el drawer movil y limpia el paso de origen activo para que el centro routee al resumen, pero preserva `expandedLevel` y `activeLevelSubStep`.

## Verificacion

- `pnpm exec vitest run tests/phase-05.2/stepper-states.spec.tsx tests/phase-07.1/planner-shell-store.spec.ts tests/phase-07.1/planner-shell-drawer.spec.tsx tests/phase-08/resumen-board.spec.tsx --reporter=dot`
- `pnpm exec tsc -p tsconfig.base.json --noEmit`
- `git diff --check`
