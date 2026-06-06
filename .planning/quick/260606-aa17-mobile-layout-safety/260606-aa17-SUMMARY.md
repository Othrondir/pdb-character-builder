# Summary: Mobile layout safety

## Resultado

Se anadio una capa CSS movil, append-only y acotada a `@media (max-width: 767px)`, para reducir roturas en pantallas pequenas sin alterar escritorio ni tablet.

El cambio hace que el shell movil use una sola columna con altura flexible, evita recortes por `overflow: hidden`, apila pantallas de seleccion, permite scroll horizontal local en tablas de resumen y compacta algunos controles/paneles anchos solo en movil.

## Verificacion

- `pnpm exec tsc -p tsconfig.base.json --noEmit`
- `pnpm exec vitest run tests/phase-02/layout-shell.spec.ts tests/phase-07.1/planner-shell-drawer.spec.tsx tests/phase-08/resumen-board.spec.tsx tests/phase-08/resumen-selectors.spec.ts --reporter=dot`
- `git diff --check`
- `pnpm --dir apps/planner build`

## Nota

La comprobacion visual con Playwright/Chromium headless no pudo completarse porque el Chromium local cae por `crashpad` dentro del sandbox. El build de Vite si parsea y empaqueta el CSS correctamente.
