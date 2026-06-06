# Summary: Contorno y tamano de iconos de clase

## Cambios

- El retrato de clase sube de `112px` a `148px`.
- El icono recibe un contorno por alfa con `var(--color-text)`, el mismo color heredado por el titulo de la hoja.
- El fondo sigue transparente y el contorno no queda recortado.

## Verificacion

- `pnpm --dir apps/planner build`
- `git diff --check`
- `curl -I http://127.0.0.1:5173/`
