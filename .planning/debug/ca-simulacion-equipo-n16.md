---
slug: ca-simulacion-equipo-n16
status: resolved
trigger: "En el caso Brujo 16, la CA esperada es 13 con DES 14 y 39 con Simular Equipo nivel 16 + armadura CA 3: bono DES 5 + armadura ligera 3 + esquiva 4 + armadura natural 4 + desvio 4 + bono de armadura 4 + escudo 4."
created: "2026-06-07T12:38:35Z"
updated: "2026-06-07T13:13:00Z"
---

# Debug Session: ca-simulacion-equipo-n16

## Symptoms

- **Expected behavior:** Con el caso de referencia, la hoja muestra CA 13 sin equipo simulado y CA 39 con `Simular Equipo nivel 16` + `Tipo de Armadura: CA 3`.
- **Actual behavior:** La CA base usaba `10 + mod DES`; despues el preset de nivel 16 llego a incluir la armadura fisica y, al elegir `CA 3`, se sumaba dos veces.
- **Error messages:** Ninguno.
- **Reference case:** Base efectiva 11 + DES 20 (+5) + paquete de equipo nivel 16 esperado (+20) + armadura fisica CA 3 = 39.

## Current Focus

```yaml
hypothesis: "confirmed"
test: "completed"
expecting: "Brujo 16 => CA 13; Brujo 16 + Simular Equipo nivel 16 + CA 3 => CA 39."
next_action: "none"
```

## Resolution

- La CA base visible pasa a `11 + mod DES`.
- `Simular Equipo nivel 16` pasa a `+20` CA directa para no contar la armadura fisica.
- La spec de hoja bloquea ambos casos de referencia: Brujo 16 sin equipo => CA 13; Brujo 16 + preset nivel 16 + CA 3 => CA 39.

## Verification

- `pnpm vitest run tests/phase-05.2/character-sheet.spec.tsx --reporter=dot`: passed.
- `pnpm run typecheck`: passed.
- `pnpm --dir apps/planner build`: passed.
