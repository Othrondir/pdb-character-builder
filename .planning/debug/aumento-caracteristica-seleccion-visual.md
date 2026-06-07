---
slug: aumento-caracteristica-seleccion-visual
status: resolved
trigger: "En los niveles donde se debe aumentar la caracteristica, todos los botones parecen seleccionados; solo deberia mostrarse como seleccionada la caracteristica elegida."
created: "2026-06-07T12:04:02Z"
updated: "2026-06-07T12:08:00Z"
---

# Debug Session: aumento-caracteristica-seleccion-visual

## Symptoms

- **Expected behavior:** En un nivel con aumento de caracteristica, solo el boton de la caracteristica asignada aparece visualmente seleccionado.
- **Actual behavior:** Todos los botones del bloque parecen seleccionados.
- **Error messages:** No informado.
- **Reproduction:**
  1. Abrir un nivel que conceda aumento de caracteristica.
  2. Observar el bloque de seleccion de caracteristica.
  3. Comprobar que todos los botones parecen estar en estado seleccionado.

## Current Focus

```yaml
hypothesis: "confirmed"
test: "completed"
expecting: "resolved"
next_action: "none"
```

## Evidence

- `AbilityIncreaseControl` ya calculaba correctamente `value === key` para
  `aria-pressed` y `is-selected`.
- La clase usada por los botones era `.class-option`, cuyo estado base tenia
  el mismo `background` y `border` que `.class-option.is-selected`; por eso
  todos parecian seleccionados aunque solo uno lo estuviera en DOM.

## Resolution

- El control usa clases propias `ability-increase-control*`.
- El estado base queda transparente con borde tenue, y `is-selected` conserva
  `--color-selection` + `--color-selection-border`.
- Se anadieron regresiones DOM y CSS en `tests/phase-12.6/level-progression-scan.spec.tsx`.

## Verification

- `pnpm vitest run tests/phase-12.6/level-progression-scan.spec.tsx --reporter=dot`: 18/18 passed.
- `pnpm run typecheck`: passed.
- `pnpm --dir apps/planner build`: passed.
