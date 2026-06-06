# Summary: Icono de clase en hoja de personaje

## Cambios

- El retrato de la hoja de personaje ahora renderiza siempre un PNG.
- Sin clase seleccionada usa `class_icon/no-class.png`.
- La clase visible se resuelve por mayor numero de niveles.
- En empates gana la clase presente en el nivel mas alto de la progresion.
- Las clases sin PNG especifico usan `class_icon/no-class.png`.
- El retrato ya no usa la caja negra anterior y mantiene dimensiones estables.

## Verificacion

- `pnpm exec vitest run tests/phase-05.2/character-sheet.spec.tsx --reporter=dot`
- `pnpm exec tsc -p tsconfig.base.json --noEmit`
- `pnpm --dir apps/planner build`
