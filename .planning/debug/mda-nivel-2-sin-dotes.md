---
slug: mda-nivel-2-sin-dotes
status: resolved
trigger: "Al llegar a nivel 2 de MDA (nivel de personaje 8), el motor obliga a escoger una dote pero no aparece ninguna disponible. Investigar, corregir y añadir pruebas de regresión."
created: "2026-06-04T16:34:40Z"
updated: "2026-06-04T16:47:00Z"
---

# Debug Session: mda-nivel-2-sin-dotes

## Symptoms

- **Expected behavior:** Al subir a MDA nivel 2 en nivel de personaje 8, el motor solo debe exigir una selección de dote si existe un slot legal y al menos una opción válida visible para ese nivel.

- **Actual behavior:** Al llegar a MDA nivel 2 en nivel de personaje 8, el motor obliga a escoger una dote, pero el selector no muestra ninguna disponible.

- **Error messages:** No informado.

- **Timeline:** No informado.

- **Reproduction:**
  1. Construir un personaje que alcance MDA nivel 2 en el nivel de personaje 8.
  2. Avanzar hasta ese nivel.
  3. Observar que el motor exige seleccionar una dote.
  4. Abrir el selector de dotes y comprobar que no aparece ninguna opción disponible.

## Current Focus

```yaml
hypothesis: "confirmed"
test: "completed"
expecting: "resolved"
next_action: "none"
```

## Evidence

- `cls_bfeat_wm.2da` empieza en fila 1 y usa esa fila como nivel de clase 1.
- El extractor trataba todas las tablas como zero-based y sumaba 1, generando
  para MDA `[2,14,17,20]` en vez de `[1,13,16,19]`.
- La fila falsa de MDA 2 creaba una ranura manual, pero su pool no tenía ninguna
  dote no épica legal porque `Arma escogida` ya se selecciona en MDA 1.
- Espadachín tenía `bonusFeatSchedule: null`, pero el runtime aplicaba el
  fallback heredado `[1,2,5,9,13]`. Sus rasgos de clase reales se conceden como
  entradas automáticas `list=3`; el fallback inventaba elecciones manuales.
- Las solturas válidas de Espadachín siguen disponibles como dotes generales.

## Eliminated

- No era un problema del filtrado visual de dotes ni de los prerrequisitos de
  `Arma escogida`.
- No era necesario convertir las dotes automáticas de Espadachín en elecciones.

## Resolution

- El extractor detecta por tabla si el índice empieza en 0 o en 1.
- El catálogo compilado de MDA usa `[1,13,16,19]`.
- Espadachín ya no usa un calendario manual heredado preépico.
- Se añadieron regresiones de extractor, motor y selector para MDA y
  Espadachín.

## Verification

- Focused specs: 52 passed, 4 skipped.
- Full suite: 2330 passed, 14 skipped, 1 todo.
- `pnpm run typecheck`: passed.
- `pnpm --dir apps/planner build`: passed.
