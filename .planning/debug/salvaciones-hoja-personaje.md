---
slug: salvaciones-hoja-personaje
status: resolved
trigger: "Fortaleza, Reflejos y Voluntad no se calculan correctamente. En la captura de referencia, un Brujo nivel 16 muestra Fortaleza 6, Reflejos 7 y Voluntad 9."
created: "2026-06-07T12:23:17Z"
updated: "2026-06-07T12:26:04Z"
---

# Debug Session: salvaciones-hoja-personaje

## Symptoms

- **Expected behavior:** La hoja calcula salvaciones finales como base de clase acumulada + modificador de caracteristica: Fortaleza usa CON, Reflejos usa DES, Voluntad usa SAB.
- **Actual behavior:** La hoja de personaje muestra solo modificadores de caracteristica; el resumen parece mostrar solo base de clase.
- **Reference case:** Brujo 16 con CON 12 (+1), DES 14 (+2), SAB 8 (-1) debe mostrar Fortaleza 6, Reflejos 7, Voluntad 9.
- **Error messages:** Ninguno.

## Current Focus

```yaml
hypothesis: "confirmed"
test: "completed"
expecting: "Brujo 16: base 5/5/10 + mods 1/2/-1 => 6/7/9."
next_action: "none"
```

## Evidence

- `computeFortSave`, `computeRefSave` y `computeWillSave` calculaban bien la
  base por clase: Brujo 16 = 5 / 5 / 10.
- `CharacterSheet` mostraba solo `abilityModifier(CON/DEX/WIS)`, es decir
  1 / 2 / -1 para el caso de referencia.
- `ResumenViewModel` mostraba solo la base de clase, es decir 5 / 5 / 10.

## Resolution

- Se anadio `computeSavingThrowTotals`, que suma base de clase + modificador
  de caracteristica.
- La hoja de personaje usa ese helper y muestra `--` si aun no hay clase.
- El resumen usa el mismo helper por fila, con atributos calculados hasta ese
  nivel para respetar aumentos de caracteristica progresivos.

## Verification

- `pnpm vitest run tests/phase-06/bab-calculator.spec.ts tests/phase-05.2/character-sheet.spec.tsx tests/phase-08/resumen-selectors.spec.ts --reporter=dot`: 38/38 passed.
- `pnpm run typecheck`: passed.
- `pnpm --dir apps/planner build`: passed.
