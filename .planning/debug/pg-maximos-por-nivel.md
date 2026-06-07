---
slug: pg-maximos-por-nivel
status: resolved
trigger: "Los PG deberian ser siempre los maximos por nivel al subir."
created: "2026-06-07T12:41:31Z"
updated: "2026-06-07T12:58:00Z"
---

# Debug Session: pg-maximos-por-nivel

## Symptoms

- **Expected behavior:** Cada nivel configurado aporta `dado de golpe de la clase + modificador CON`, con minimo 1 por nivel. `Dureza` suma +1 PG por nivel con caracter retroactivo.
- **Actual behavior:** Solo el primer nivel usaba dado maximo; los niveles posteriores usaban media redondeada hacia arriba. Ademas, la hoja no pasaba las dotes elegidas al selector de PG, asi que `Dureza` no podia aplicar.
- **Error messages:** Ninguno.

## Current Focus

```yaml
hypothesis: "computeHitPoints conserva una regla anterior de media por nivel posterior al primero y no recibe dotes."
test: "Actualizar selector y regresiones para dado maximo, CON final retroactiva y Dureza."
expecting: "Guerrero 4 CON +2 => 48 PG; Brujo 16 CON +1 + Dureza => 128 PG."
next_action: "none"
```

## Findings

- `computeHitPoints` recibia solo progresion, catalogo de clases y modificador CON.
- La hoja ya pasaba el modificador de CON final, por lo que aumentos posteriores de CON se aplicaban retroactivamente en la formula actual.
- `Dureza` existe como `feat:dureza`; su descripcion compilada indica bonificador de PG por nivel y retroactividad.
- La diferencia del caso Brujo 16 CON 12 encaja exactamente con `Dureza`: `16 * (d6 + 1 CON) = 112`; `112 + 16 = 128`.

## Resolution

- `computeHitPoints` usa dado maximo en cada nivel configurado.
- `computeHitPoints` acepta dotes seleccionadas y suma `Dureza` como `+1 PG` por nivel configurado.
- La hoja de personaje pasa las dotes elegidas al selector de PG.
- Se mantiene la CON final como modificador aplicado a todos los niveles, cubriendo aumentos posteriores de CON de forma retroactiva.

## Verification

- `pnpm vitest run tests/phase-12.3/hit-points-selector.spec.ts tests/phase-05.2/character-sheet.spec.tsx --reporter=dot`: 43/43 passed.
- `pnpm run typecheck`: passed.
- `pnpm --dir apps/planner build`: passed.
