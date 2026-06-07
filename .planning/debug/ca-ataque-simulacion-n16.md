---
slug: ca-ataque-simulacion-n16
status: resolved
trigger: "Con simulacion nivel 16 + armadura CA 3, la CA debe ser 39 y los ataques 18/13/8; ahora sobran 3 CA y falta 1 ataque."
created: "2026-06-07T13:06:00Z"
updated: "2026-06-07T13:24:00Z"
---

# Debug Session: ca-ataque-simulacion-n16

## Symptoms

- **Expected behavior:** Brujo 16 con `Simular Equipo nivel 16` y `CA 3` muestra CA 39 y ataques 18/13/8.
- **Actual behavior:** El preset N16 incluye +23 CA directa; al seleccionar `CA 3`, se llega a 42. Los ataques sumaban BAB + bono directo de preset y no el modificador de FUE final.
- **Error messages:** Ninguno.

## Current Focus

```yaml
hypothesis: "El preset N16 cuenta la armadura fisica CA 3 dentro del paquete y el ataque usa bono directo de preset en vez de FUE final."
test: "Ajustar preset a bonos generales sin armadura fisica y calcular ataques como BAB + mod FUE final."
expecting: "Brujo 16 + N16 + CA 3 => CA 39; Brujo 16 FUE 22 => ataques +18 / +13 / +8."
next_action: "none"
```

## Resolution

- `Simular Equipo nivel 16` pasa de +23 CA directa a +20 CA directa. La armadura fisica se suma desde `Tipo de Armadura`.
- La hoja calcula ataques visibles como fila de BAB + modificador de FUE final.
- La hoja no usa `Soltura` ni un bono directo de preset para explicar este caso. El +6 viene del modificador de FUE final 22.
- Tabla de referencia aportada por el usuario: BAB 12 => `+12/+7/+2`; sumando FUE 22 (+6) => `+18/+13/+8`.

## Verification

- `pnpm vitest run tests/phase-05.2/character-sheet.spec.tsx --reporter=dot`: 27/27 passed.
- `pnpm run typecheck`: passed.
- `pnpm --dir apps/planner build`: passed.
