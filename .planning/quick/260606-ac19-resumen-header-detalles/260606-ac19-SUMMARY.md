# Summary: Resumen header Detalles

## Resultado

El encabezado que aparece sobre la progresion en `Resumen` muestra solo `Detalles`.

Ya no renderiza `Sin nombre`, raza, alineamiento, ruleset ni dataset en esa linea. El view-model conserva esos datos para exportacion/importacion y otros usos, pero `ResumenTable` no los muestra en ese encabezado.

## Verificacion

- `pnpm exec vitest run tests/phase-08/resumen-board.spec.tsx tests/phase-12.9/resumen-identity-dedup.spec.tsx tests/phase-08/resumen-selectors.spec.ts --reporter=dot`
- `pnpm exec tsc -p tsconfig.base.json --noEmit`
- `git diff --check`
