# Summary: Transparencia en Paladin Oscuro

## Cambios

- `class_icon/paladin-oscuro.png` ahora tiene transparente el hueco opaco que quedaba dentro del aro superior, junto a la empunadura de la espada.
- Se mantuvieron el tamano normalizado, el canal alfa y el bounding box visible.

## Verificacion

- `identify` confirma `srgba(0,0,0,0)` en los puntos corregidos.
- `pnpm --dir apps/planner build`
- `git diff --check`
- `curl -I http://127.0.0.1:5173/`
