# Summary: Normalizar tamano de iconos de clase

## Cambios

- Todos los PNG de `class_icon/` se recortaron por alfa, se escalaron a un maximo visible comun de `1160px` y se recentraron en `1254x1254`.
- El retrato de la hoja sube de `148px` a `198px`, aproximadamente un tercio mas grande.
- Se mantiene fondo transparente y contorno con `var(--color-text)`.

## Verificacion

- `identify` confirma bounding boxes visibles con altura `1160px` y canal `srgba 4.0`.
- `pnpm exec vitest run tests/phase-05.2/character-sheet.spec.tsx --reporter=dot`
- `pnpm --dir apps/planner build`
- `git diff --check`
- `curl -I http://127.0.0.1:5173/`
