---
slug: dote-nivel-12-13
status: resolved
created: 2026-04-28
---

# Debug: dote nivel 12-13

## Sintoma

Build exportado con Brujo 12 / Barbaro 1 trae una dote general en N12 y una
dote de clase manual en N13. Barbaro N1 no concede slot manual de dote.

## Hipotesis

- La revalidacion de dotes valida prerrequisitos, pero no valida capacidad de
  slots por nivel.
- El boton Continuar avanza solo `levelProgression.activeLevel`, dejando
  `skillStore.activeLevel` y `featStore.activeLevel` atrasados hasta la
  siguiente navegacion explicita.

## Resultado esperado

- N12 puede aceptar una dote general si cumple prerequisitos.
- N13 Barbaro 1 no puede aceptar dote de clase manual ni dote general.
- Al avanzar de nivel, los tres stores activos quedan sincronizados.

## Resolucion

- `feat-revalidation` ahora compara selecciones manuales contra capacidad real
  del nivel (`classBonus`, `general`, `raceBonus`) usando `determineFeatSlots`.
- `LevelEditorActionBar` ahora avanza con `syncPlannerLevel`, sincronizando
  progresion, habilidades y dotes.
- Tests agregados para Brujo 12 -> Barbaro 1 y para bonus racial Humano L1.
