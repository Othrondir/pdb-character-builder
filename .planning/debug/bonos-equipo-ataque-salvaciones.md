---
slug: bonos-equipo-ataque-salvaciones
status: resolved
trigger: "Los botones Simular Equipo nivel 12 y Simular Equipo nivel 16 deben anadir +5 a cada ataque y +6 a Fortaleza, Reflejos y Voluntad."
created: "2026-06-07T13:30:00Z"
updated: "2026-06-07T13:38:00Z"
---

# Debug Session: bonos-equipo-ataque-salvaciones

## Symptoms

- **Expected behavior:** Los presets de equipo suman +5 directo a cada ataque y +6 directo a cada salvacion, ademas de sus cambios de atributos.
- **Actual behavior:** Los ataques se calculan como BAB + mod FUE final; las salvaciones se calculan como base de clase + mod de caracteristica final.
- **Error messages:** Ninguno.

## Current Focus

```yaml
hypothesis: "Los presets necesitan campos explicitos de bono de ataque y salvacion."
test: "Actualizar hoja y regresiones del panel de estadisticas."
expecting: "Brujo 16 + N16: ataques +23/+18/+13; salvaciones 15/16/18."
next_action: "none"
```

## Findings

- La secuencia BAB sigue la tabla aportada por el usuario.
- El ataque visible debe ser `BAB iterativo + mod FUE final + bono de ataque del preset`.
- Las salvaciones visibles deben ser `base de clase + mod caracteristica final + bono de salvacion del preset`.

## Resolution

- Ambos presets (`nivel 12` y `nivel 16`) tienen `attackBonus: 5`.
- Ambos presets tienen `savingThrowBonus: 6`.
- La ayuda de simulacion vuelve a mencionar ataque y salvaciones.

## Verification

- `pnpm vitest run tests/phase-05.2/character-sheet.spec.tsx --reporter=dot`: 28/28 passed.
- `pnpm run typecheck`: passed.
- `pnpm --dir apps/planner build`: passed.
