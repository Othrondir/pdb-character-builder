---
slug: combate-dos-armas-general
status: resolved
trigger: "Combate con dos armas no aparece como dote seleccionable a nivel 1 aunque se cumplen sus requisitos. Esperado: aparece en el slot general de cualquier clase que pueda escogerla. Actual: queda fuera del bloque general. Sin mensaje de error. Reproduccion: crear personaje de nivel 1, elegir una clase afectada y abrir Dotes. Parece un fallo existente de clasificacion del catalogo."
created: "2026-06-04T15:48:09Z"
updated: "2026-06-04T17:52:00Z"
---

# Debug Session: combate-dos-armas-general

## Symptoms

- **Expected behavior:** `feat:twoweaponfighting` aparece como dote seleccionable en el slot general de nivel 1 para cualquier clase que pueda escogerla cuando se cumplen sus requisitos.

- **Actual behavior:** `feat:twoweaponfighting` queda fuera del bloque general en Dotes a nivel 1 pese a cumplir requisitos. No aparece mensaje de error.

- **Error messages:** Ninguno observado.

- **Timeline:** No determinado. El reporte indica que parece un fallo existente de clasificacion del catalogo.

- **Reproduction:**
  1. Crear un personaje de nivel 1.
  2. Elegir una clase afectada que pueda seleccionar dotes generales.
  3. Abrir la pantalla de Dotes.
  4. Comprobar que `Combate con dos armas` no aparece en el bloque general aunque deberia ser elegible.

## Current Focus

```yaml
hypothesis: "La dote existe y pasa prerrequisitos, pero el catalogo o la clasificacion de slots la excluye del bloque general de nivel 1."
test: "Inspeccionar dataset compilado, reglas de clasificacion de dotes y tests de selectabilidad para localizar donde `feat:twoweaponfighting` deja de considerarse general a nivel 1."
expecting: "Encontrar una discrepancia entre el origen de datos y la logica que construye el bloque general de dotes seleccionables."
next_action: "resolved"
```

## Evidence

- timestamp: 2026-06-04T17:50:00Z
  finding: "El dataset compilado contiene `feat:twoweap` con `category: general`, pero `allClassesCanUse: false`."
  source: "apps/planner/src/data/compiled-feats.ts:42857"
- timestamp: 2026-06-04T17:50:20Z
  finding: "Las clases con acceso general a la dote la reciben en `classFeatLists` como filas pasivas `onMenu: false`; la mayoria usa `list: 0`, pero Guerrero, Brujo y otras usan `list: 1`, por lo que la logica actual la excluye del pool general."
  source: "apps/planner/src/data/compiled-feats.ts:454, 1974, 2882, ..."
- timestamp: 2026-06-04T17:50:40Z
  finding: "`getEligibleFeats` y el selector del tablero solo aceptaban filas `list=0` cuando `onMenu=true`, reproduciendo la ocultacion en reglas y UI."
  source: "packages/rules-engine/src/feats/feat-eligibility.ts:321-334; apps/planner/src/features/feats/selectors.ts:1182-1188, 1263-1270"
- timestamp: 2026-06-04T17:51:50Z
  finding: "Tras permitir la excepcion curada para `feat:twoweap`, las pruebas de elegibilidad y UI pasan y la dote reaparece en el bloque general correspondiente."
  source: "pnpm vitest run tests/phase-06/feat-eligibility.spec.ts tests/phase-12.4/feat-selectability-states.spec.tsx"
- timestamp: 2026-06-04T17:57:00Z
  finding: "La excepcion cubre entradas pasivas list=0 y list=1 sin exponer autoconcesiones; suite completa, typecheck y build de produccion pasan."
  source: "pnpm test -- --reporter=dot; pnpm run typecheck; pnpm --dir apps/planner build"

## Eliminated

## Resolution

- root_cause: "`feat:twoweap` estaba mal clasificada en los datos compilados para varias clases (`list=0/1` + `onMenu=false` + `allClassesCanUse=false`), y la logica del builder trataba `onMenu` y `list=0` como requisitos estrictos para el pool general, ocultando una dote realmente general."
- fix: "Se anadio una excepcion curada `isSelectableGeneralFeatEntry()` para aceptar entradas no autoconcedidas de `feat:twoweap` como dote general seleccionable y se reutilizo tanto en reglas como en el selector de la UI."
- verification: "`pnpm vitest run tests/phase-06/feat-eligibility.spec.ts tests/phase-12.4/feat-selectability-states.spec.tsx` (55/55); suites relacionadas (154/154); `pnpm test -- --reporter=dot` (2315 passed, 14 skipped, 1 todo); `pnpm run typecheck`; `pnpm --dir apps/planner build`."
- files_changed:
  - "packages/rules-engine/src/feats/feat-eligibility.ts"
  - "apps/planner/src/features/feats/selectors.ts"
  - "tests/phase-06/feat-eligibility.spec.ts"
  - "tests/phase-12.4/feat-selectability-states.spec.tsx"
