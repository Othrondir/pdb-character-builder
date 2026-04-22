---
phase: quick-260422-g7s
plan: 01
subsystem: level-progression
tags: [prestige-gate, class-picker, tdd, ui-wiring, framework-purity]
requirements:
  - QUICK-260422-G7S-R1
dependency_graph:
  requires:
    - apps/planner/src/features/level-progression/prestige-gate-build.ts
    - apps/planner/src/features/level-progression/prestige-prereq-data.ts
    - packages/rules-engine/src/progression/prestige-gate.ts
  provides:
    - ClassPicker wired to buildPrestigeGateBuildState + overrides so enriched flag flips per-row
  affects:
    - apps/planner/src/features/level-progression/class-picker.tsx
    - tests/phase-12.4/class-picker-prestige-reachability.spec.tsx
tech_stack:
  added: []
  patterns:
    - boundary-adapter-derives-runtime-state-once-per-render
    - enriched-flag-tracks-presence-of-decodedPrereqs
key_files:
  created:
    - tests/phase-12.4/class-picker-prestige-reachability.spec.tsx
  modified:
    - apps/planner/src/features/level-progression/class-picker.tsx
decisions:
  - "enriched flag is derived from classRow.decodedPrereqs !== undefined so prestige without override still fail-closes at branch 3 (single source of truth; no hardcoded booleans)."
  - "gateBuildState derived once per ClassPicker render and forwarded to ClassPickerRow as a prop — avoids 25+ redundant hook reads across the prestige/base row grid."
  - "raceId is restored to the gate payload (the previous implementation omitted it entirely); branch 4 requiredAnyRaceIds now correctly evaluates when present in an override."
metrics:
  duration: ~15m
  tasks_completed: 2
  files_touched: 2
  tests_added: 4
  completed_date: 2026-04-22
---

# Quick Task 260422-g7s: Cablear prestige gate reachability en ClassPicker — Summary

Prestige class picker now drives `reachableAtLevelN` off real runtime build state and planner-local decodedPrereqs overrides instead of a hardcoded `enriched: false`, closing QUICK-260422-G7S-R1.

## One-liner

`ClassPicker` wired to `buildPrestigeGateBuildState` + `getPrestigeDecodedPrereqs` so prestige rows surface actual prereq blockers (BAB, arcane-spell, skill ranks, feats, race, class-levels) instead of the stale "Requisitos en revisión" fallback — rules-engine stays framework-agnostic.

## Objective

Cablear el gate de reachability en `apps/planner/src/features/level-progression/class-picker.tsx` para que clases como Caballero Arcano, Asesino, Danzante de Sombras, etc. se evalúen contra los prereqs reales (BAB / conjuros arcanos / rangos / dotes / raza / niveles de clase) cuando existe un override en `prestige-prereq-data.ts`. El gate helper y los overrides ya existían — solo faltaba el cableado en el límite UI.

## Behavior Changes

**Before:** Every prestige row at L2+ showed the inline reason "Requisitos en revisión" because `ClassPickerRow` hardcoded `enriched: false` and passed an empty build context (`abilityScores: {}`, `bab: 0`, `skillRanks: {}`, `featIds: new Set()`, `classLevels: {}`, no `raceId`). Branch 3 of `reachableAtLevelN` fired unconditionally, bypassing the existing 19 planner-local overrides.

**After:**
- `ClassPicker` reads `useFeatStore()` + `useSkillStore()` on top of the existing `useLevelProgressionStore()` + `useCharacterFoundationStore()` hooks.
- `buildPrestigeGateBuildState(progression, foundation, feat, skill, activeLevel)` is invoked once per render and the resulting `PrestigeGateBuildState` is forwarded to each `ClassPickerRow` via a new `gateBuildState` prop.
- `toClassPrereqInput(option)` attaches `decodedPrereqs` when `getPrestigeDecodedPrereqs(option.id)` returns an override.
- `ClassPickerRow` passes `bab`, `featIds`, `classLevels`, `skillRanks`, `abilityScores`, `raceId`, `highestArcaneSpellLevel`, and `highestSpellLevel` from `gateBuildState`, plus `enriched: classRow.decodedPrereqs !== undefined`.
- Prestige classes that lack an override still fail-closed to branch 3 — the new flag mirrors the invariant, it does not weaken it.
- Header JSDoc paragraph about "Phase 13.x deferred" deleted and rewritten to describe the overrides-driven enrichment path.

**Observable impact at UAT:**
- L9 with Mago 8 (wizard prior-class-level 8 ⇒ `highestArcaneSpellLevel = 4`), the Caballero Arcano row no longer shows "Requisitos en revisión"; instead it surfaces the actual unmet blockers (e.g., `Requiere conjuros arcanos de nivel 5` plus the 25 `Requiere dote: Competencia con arma marcial (...)` items). That is correct — the user still needs to clear the remaining prereqs.
- L9 with Guerrero 8 (no arcane class level), the Caballero Arcano row shows the exact copy `Requiere conjuros arcanos de nivel 5` from `arcaneSpellLabel(5)`.
- L1: branch 2 (`Clase de prestigio: no disponible en nivel 1; revisa sus requisitos`) is unchanged — it short-circuits before branches 3 and 4.

## Files Touched

| File | Type | Lines (Δ) |
| --- | --- | --- |
| `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx` | created | +166 |
| `apps/planner/src/features/level-progression/class-picker.tsx` | modified | +66 / -29 |

## Task-by-task

### Task 1 — RED spec (commit `3fe57bf`)

Created `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx` with 4 test cases:

1. `L9 con Mago 8 niveles: fila Caballero Arcano NO muestra "Requisitos en revisión"` — red against fail-closed baseline, green after wiring.
2. `L9 con Guerrero 8 niveles: fila Caballero Arcano muestra blocker arcane-spell exacto` — locks branch-4 arcane-spell label (`Requiere conjuros arcanos de nivel 5`).
3. `L1 regresión: toda clase de prestigio sigue con copy de rama 2` — passed green in RED phase (branch 2 untouched) and stayed green after.
4. `L9 prestige SIN override sigue cayendo a "Requisitos en revisión"` — passed green in RED phase (branch 3 intact) and stayed green after.

Baseline Vitest run: **2 failed / 2 passed** as expected — confirms RED phase tested the specific behaviour the wiring fix must deliver.

### Task 2 — GREEN wiring (commit `a81d8a3`)

Edited `apps/planner/src/features/level-progression/class-picker.tsx`:

- Imports: added `useFeatStore`, `useSkillStore`, `buildPrestigeGateBuildState` + `PrestigeGateBuildState`, `getPrestigeDecodedPrereqs`.
- Header JSDoc rewrote the "Phase 13.x deferred" paragraph to describe the overrides-driven enrichment path.
- `toClassPrereqInput` now conditionally attaches `decodedPrereqs` for prestige options when an override exists.
- `ClassPicker` body reads the two new stores, derives `gateBuildState` once (after `activeLevel` resolution), and forwards it as a prop to every `ClassPickerRow` in both the base and prestige lists.
- `ClassPickerRow` interface gained `gateBuildState: PrestigeGateBuildState`; the body threads every field from `gateBuildState` into `reachableAtLevelN` and computes `enriched` dynamically from `classRow.decodedPrereqs !== undefined`.

## Verification Evidence

### Vitest — Phase 12.4 suite (full)

```
 Test Files  12 passed (12)
      Tests  139 passed (139)
   Duration  4.47s
```

All 12 phase-12.4 specs green, including:
- `class-picker-prestige-reachability.spec.tsx` — 4/4 ✓ (new)
- `class-picker-grouping.spec.tsx` — 5/5 ✓ (12.4-06 CLAS-03 bridge intact)
- `prestige-gate.fixture.spec.ts` — 12/12 ✓ (rules-engine contract unchanged)

### Typecheck

```
node ./node_modules/typescript/bin/tsc --noEmit -p apps/planner/tsconfig.json
exit=0
```

### Invariant greps (all required values met)

| Grep | File | Expected | Actual |
| --- | --- | --- | --- |
| `Phase 13.x` | `class-picker.tsx` | 0 | 0 |
| `enriched: false` | `class-picker.tsx` | 0 | 0 |
| `buildPrestigeGateBuildState` | `class-picker.tsx` | ≥1 | 3 (import + usage + type) |
| `getPrestigeDecodedPrereqs` | `class-picker.tsx` | ≥1 | 3 (import + call + doc ref) |
| `from '@planner` | `packages/rules-engine/src/` | 0 | 0 |
| `from 'react'` | `packages/rules-engine/src/` | 0 | 0 |

CLAUDE.md "Prescriptive Shape" respected: rules-engine stays pure TypeScript, no React, no `@planner` imports.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1/2/3 auto-fixes were needed during GREEN verification: the first vitest run after the wiring change passed 21/21 across the 3 required specs. The instruction to apply the variable-order note (`buildPrestigeGateBuildState` call AFTER `const activeLevel = ...`) was honored.

## Self-Check

- `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx` exists: FOUND
- `apps/planner/src/features/level-progression/class-picker.tsx` modified: FOUND
- Commit `3fe57bf` (RED): FOUND
- Commit `a81d8a3` (GREEN): FOUND

## Follow-ups

- Si el usuario quiere que Caballero Arcano (u otras prestige con requiredFeats largos) quede **completamente desbloqueable** sin seedear manualmente los 25 `MARTIAL_WEAPON_PROFICIENCIES`, eso es un hueco UX independiente — las dotes deben venir de grants automáticos del Mago al subir de nivel (o de slots concedidos por el jugador), pero el gate actualmente cuenta sólo lo que el jugador ha asignado explícitamente. Separate scope.
- No hay cambios en el extractor — los 19 overrides en `prestige-prereq-data.ts` son la ground truth hasta que `PreReqTable` decoding aterrice upstream.

## Self-Check: PASSED
