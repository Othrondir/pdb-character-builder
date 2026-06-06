# Summary: Fondos transparentes en class_icon

## Cambios

- Todos los PNG de `class_icon/` se convirtieron de RGB a RGBA.
- El fondo claro conectado a los bordes ahora es transparente.
- Las proporciones y resolucion de los iconos se mantienen en `1254x1254`.

## Verificacion

- `identify` confirma `srgba 4.0` y esquinas `srgba(0,0,0,0)` en todos los PNG.
- `pnpm exec vitest run tests/phase-05.2/character-sheet.spec.tsx --reporter=dot`
- `pnpm --dir apps/planner build`
