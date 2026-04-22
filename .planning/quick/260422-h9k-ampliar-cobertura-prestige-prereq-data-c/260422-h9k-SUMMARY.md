---
phase: quick-260422-h9k
plan: 01
title: Ampliar cobertura prestige-prereq-data — 3 overrides nuevos (harper + campeondivino + weaponmaster)
subsystem: level-progression
tags:
  - prestige
  - class-picker
  - rules-engine-adapter
  - spanish-copy
requires:
  - packages/rules-engine/src/progression/prestige-gate.ts@reachableAtLevelN (sin cambios)
  - apps/planner/src/features/level-progression/class-picker.tsx (consumidor, sin cambios)
provides:
  - 3 entradas nuevas en PRESTIGE_PREREQ_OVERRIDES (class:harper, class:campeondivino, class:weaponmaster)
  - 2 constantes compartidas (MELEE_WEAPON_FOCUS_FEATS, WEAPONMASTER_WEAPON_FOCUS_FEATS)
  - Rule 3 cross-fix: baseInput fixture helper con defaults para raceId + highestArcaneSpellLevel + highestSpellLevel
affects:
  - apps/planner/src/features/level-progression/prestige-prereq-data.ts
  - tests/phase-12.4/prestige-gate.fixture.spec.ts
  - tests/phase-12.4/class-picker-prestige-reachability.spec.tsx
tech-stack:
  added: []
  patterns:
    - "Weapon Focus family constants: readonly tuple con `as const` + `.filter()` derivation para dedup declarativa entre listas solapadas"
key-files:
  created: []
  modified:
    - apps/planner/src/features/level-progression/prestige-prereq-data.ts
    - tests/phase-12.4/prestige-gate.fixture.spec.ts
    - tests/phase-12.4/class-picker-prestige-reachability.spec.tsx
decisions:
  - "Scope trimmed pre-execution: warlock + swashbuckler excluidos. Override vacío = enriched=true+blockers=[] = reachable=true, contradice 'strict validation'. Dejados fail-closed a 'Requisitos en revisión' hasta que un plan cross-package introduzca BlockerKind 'server-gate' en rules-engine + copy."
  - "MELEE_WEAPON_FOCUS_FEATS (32 items, incluye weapfocunarm) y WEAPONMASTER_WEAPON_FOCUS_FEATS (31 items, sin weapfocunarm) declarados como readonly tuple al estilo de MARTIAL_WEAPON_PROFICIENCIES. WEAPONMASTER derivado por `.filter()` desde MELEE para dedup declarativa — diferencia es UNA sola entrada (unarmed)."
  - "Discipline skill (cls_pres_harper.2da SKILL 3) omitida del harper override. skill:disciplina no existe en el catálogo de Puerta (38 skills). Dejado como TODO inline con referencia a D-03 OPEN-QUESTION."
  - "Harper override aplica a Arcano únicamente (D-05). first-wins dedupe en class-fixture.ts descarta sourceRow 54 Divino; la entrada override lo respeta por diseño. Deuda técnica pre-existente fuera de scope."
  - "Rule 3 auto-fix del baseInput fixture helper (añadidos raceId:null + highestArcaneSpellLevel:0 + highestSpellLevel:0) porque strict typecheck surface'ó un error PrestigeGateInput pre-existente al añadir yo tests nuevos que usan ese helper. Sin este fix, typecheck baseline seguiría rojo y mi criterio de éxito (tsc clean) no se satisfaría."
metrics:
  duration: "~30 min"
  completed: "2026-04-22"
  tests_added: 7
  tests_passing_after: 23
  files_modified: 3
  files_created: 0
---

# Quick Task 260422-h9k: Ampliar Cobertura prestige-prereq-data (3 overrides) Summary

Expande `PRESTIGE_PREREQ_OVERRIDES` con 3 entradas (harper + campeondivino + weaponmaster) para que sus filas en `<ClassPicker>` dejen de mostrar "Requisitos en revisión" y pasen al branch 4 (decoded) del gate — exhibiendo blockers templateados específicos (BAB/skill/feat/feat-or).

## What shipped

**3 overrides nuevos en PRESTIGE_PREREQ_OVERRIDES** (`apps/planner/src/features/level-progression/prestige-prereq-data.ts`):

- `class:harper`: 3 skill-rank (Engañar 6 + Buscar 4 + Saber-otros 6) + 2 feat (Alerta + Voluntad de hierro). Discipline (SKILL 3 en cls_pres_harper.2da) omitida — no hay `skill:disciplina` en el catálogo Puerta (D-03 OPEN-QUESTION documentada inline).
- `class:campeondivino`: `minBab: 7` + `requiredAnyFeatGroups: [MELEE_WEAPON_FOCUS_FEATS]` (32 entries). Los 4 category masters (FEATOR 2070–2073) expandidos a sus constituyentes per-arma (D-06). Unarmed (FEATOR 100) incluido como `feat:weapfocunarm`.
- `class:weaponmaster`: `minBab: 5` + `minSkillRanks: [intimidar 4]` + `requiredFeats: [Esquiva/Movilidad/Pericia en combate/Ataque de torbellino]` + `requiredAnyFeatGroups: [WEAPONMASTER_WEAPON_FOCUS_FEATS]` (31 entries — mismo listado que campeondivino MENOS `feat:weapfocunarm`; D-07 drops FEATOR 2070–2073 + 2056 Lance silenciosamente).

**2 constantes compartidas**:

- `MELEE_WEAPON_FOCUS_FEATS`: 32 items (weapfocunarm + 31 per-weapon). Declarada al estilo de MARTIAL_WEAPON_PROFICIENCIES.
- `WEAPONMASTER_WEAPON_FOCUS_FEATS`: 31 items, derivada declarativamente por `.filter((e) => e.featId !== 'feat:weapfocunarm')` desde MELEE para evitar duplicación de listas y atrapar drift si MELEE se modifica.

**7 tests nuevos** (4 fixture + 3 integration):

- `tests/phase-12.4/prestige-gate.fixture.spec.ts` — 4 casos nuevos que ejercitan los overrides vía mocks inline en `ClassPrereqInput.decodedPrereqs` (independiente de `PRESTIGE_PREREQ_OVERRIDES`):
  1. harper: 5 blockers (3 skill + 2 feat) con copy exacto templateado.
  2. campeondivino: BAB 7 blocker + feat-or 32-items (incluye unarmed).
  3. campeondivino: con `feat:weapfocunarm` en featIds y BAB 10, row satisfecha (`reachable:true, blockers:[]`).
  4. weaponmaster: 1 bab + 1 skill-rank + 4 feat + 1 feat-or (7 blockers total) + verificación de que feat-or NO contiene "impacto sin arma".
- `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx` — 3 casos integration que rinden `<ClassPicker>` real + verifican DOM `textContent` contra labels templateados (NO contra "Requisitos en revisión"):
  1. L9 + Guerrero 8: `[data-class-id="class:harper"]` muestra blocker específico (skill o feat).
  2. L9 + Guerrero 8: `[data-class-id="class:campeondivino"]` muestra BAB o feat-or blocker.
  3. L9 + Guerrero 4 + Hechicero 4 (custom multiclass setup inline): `[data-class-id="class:weaponmaster"]` muestra skill / feat / feat-or blocker.

## Commits

| Hash | Type | Summary |
|------|------|---------|
| `c172bbb` | test | RED — 4 fixture cases GREEN + 3 integration cases FAIL por "Requisitos en revisión" |
| `7747e87` | feat | GREEN — 3 overrides + 2 constantes + Rule 3 fix baseInput |

## Verification

- **prestige-gate.fixture.spec.ts**: 16/16 passing (12 pre-existing + 4 nuevos).
- **class-picker-prestige-reachability.spec.tsx**: 7/7 passing (4 pre-existing + 3 nuevos).
- **Full phase-12.4 suite**: 146/146 passing (12 spec files).
- **pnpm typecheck** (`tsc -p tsconfig.base.json --noEmit`): exit 0.
- **Grep positivo**: `grep -c "'class:harper'\|'class:campeondivino'\|'class:weaponmaster'" prestige-prereq-data.ts` = 3.
- **Grep negativo**: `grep "'class:warlock'\|'class:swashbuckler'" prestige-prereq-data.ts` = 1 (ÚNICA coincidencia en línea 254 dentro de `arcane-archer.requiredAnyClassLevels`, pre-existente; 0 matches como KEY del objeto PRESTIGE_PREREQ_OVERRIDES).
- **Rules-engine isolation**: `git diff HEAD~2 HEAD -- packages/rules-engine/` vacío. CLAUDE.md "Prescriptive Shape" intacto.
- **Copy isolation**: `git diff HEAD~2 HEAD -- apps/planner/src/lib/copy/es.ts` vacío. Templates se reutilizan, no se añaden strings.

## Deviations from Plan

### Rule 3 auto-fix — baseInput fixture helper typecheck debt

**Found during:** Task 2 GREEN (tras añadir entradas, ejecutar `pnpm typecheck` como paso de verify).

**Issue:** El helper `baseInput` en `prestige-gate.fixture.spec.ts` (pre-existente desde 12.4-06 RED commit `7805025`) creaba un `PrestigeGateInput` que omitía los 3 campos requeridos `raceId: string | null`, `highestArcaneSpellLevel: number`, `highestSpellLevel: number`. El spec compilaba en vitest (runtime acepta la forma parcial porque los code-paths ejercitados no los leen), pero `tsc -p tsconfig.base.json --noEmit` fallaba con `TS2322: Type ... is not assignable to type 'PrestigeGateInput'`.

Este error era PRE-EXISTENTE en el baseline del worktree (commit `2edb3fc` lo incluye). Per SCOPE BOUNDARY rule sería fuera de scope, pero:
- El plan `<verification>` §4 exige `pnpm -w tsc --noEmit` clean tras GREEN.
- Mis 4 tests fixture nuevos USAN `baseInput`, amplificando la deuda (aunque sin crear más errores).
- Fix es trivial: 3 líneas con defaults sensatos (`raceId: null`, `highestArcaneSpellLevel: 0`, `highestSpellLevel: 0`).

**Fix:** Añadidos los 3 defaults al `baseInput` helper. Ningún test cambia semánticamente — los defaults reflejan "valor neutral no-cumplido" que es coherente con el patrón que usan todos los casos específicos (los que sí testean esos campos los sobrescriben vía `overrides`).

**Archivos modificados:** `tests/phase-12.4/prestige-gate.fixture.spec.ts` (3 líneas añadidas).

**Commit:** `7747e87` (parte del commit GREEN).

## Gaps conocidos y follow-ups

### 1. `server-gate` BlockerKind pendiente para warlock + swashbuckler

Ambas clases (`class:warlock` / `class:swashbuckler`) tienen como ÚNICA requirement en su 2DA un `ScriptVar` (`PRC_AllowWarlock` / `PRC_AllowSwash`). Es un gate que el servidor evalúa en tiempo de ejecución mediante script; el planner no puede reproducirlo desde state.

**Por qué quedan fuera de este quick:** dar override vacío `{}` = `enriched:true` + `blockers:[]` = `reachable:true`, lo que violaría CLAUDE.md "strict validation — illegal server builds blocked, not warned". Mientras tanto se comportan correctamente con el fallback fail-closed del branch 3: `kind:'unvetted', label:'Requisitos en revisión'`.

**Trabajo necesario (plan cross-package futuro):**

1. Extender `BlockerKind` union en `packages/rules-engine/src/progression/prestige-gate.ts` con `'server-gate'`.
2. Añadir campo `serverGated?: { reason: string }` a `DecodedPrereqs`.
3. Añadir branch antes del retorno en `reachableAtLevelN` que emita un blocker `{ kind:'server-gate', threshold: reason, label: serverGateLabel(reason) }`.
4. Añadir template `serverGateLabel` al bloque de copy (p. ej. `"Requisito de servidor — contacta DM"` o `"Clase gestionada por script de servidor"`).
5. Añadir overrides vacíos-con-flag a `PRESTIGE_PREREQ_OVERRIDES`:
   - `'class:warlock': { serverGated: { reason: 'script-toggle' } }`.
   - `'class:swashbuckler': { serverGated: { reason: 'script-toggle' } }`.
6. Tests correspondientes (fixture + integration).

**Estimación**: ~30-45 min (cross-package, requiere coordinación rules-engine + planner + copy + tests). **Riesgo**: bajo — union extension backward-compatible; el único consumidor de `BlockerKind` es el UI (sólo lee `label`).

### 2. Discipline skill missing en catálogo Puerta (D-03 OPEN-QUESTION)

`cls_pres_harper.2da` lista SKILL 3 (Discipline/Disciplina) como prereq, pero `skill:disciplina` NO existe en `compiled-skills.ts` (38 skills). Verificado HIGH confidence contra el catálogo.

**Opciones de producto:**

- **(a) Reinstaurar Disciplina en el extractor** — requiere que el extractor emita skill:disciplina y coordinar su definición (ability base, cross-class, etc.). Más trabajo si Puerta la conserva como skill real.
- **(b) Dropear permanentemente** — si Puerta removió la skill del rulebook server-side, la prereq correcta es NO incluirla y refinar cls_pres_harper.2da en extracts.

**Recomendación para producto:** elegir (b) a menos que haya evidencia server-side de que Disciplina sigue activa. Planner actualmente dropea la prereq silenciosamente (comentario TODO inline), lo que hace a harper ligeramente más permisivo — no hay falsos negativos que bloqueen builds legítimos.

### 3. `class:harper` first-wins dedupe (Arcano-only) — D-05 pre-existing

`compiled-classes.ts` emite `class:harper` dos veces (sourceRow 28 "Agente Custodio (Arcano)" + sourceRow 54 "Agente Custodio (Divino)"). El dedupe `first-wins` en `class-fixture.ts:284-300` mantiene sólo Arcano. Mi override aplica a Arcano únicamente por diseño.

**Fuera de scope:** deuda técnica pre-existente del extractor (slug collision). Tracked en `12.2-CONTEXT.md` deferred items. Un plan futuro del extractor debería desambiguar los slugs (p. ej. `class:harper-arcano` / `class:harper-divino`) y entonces este override podría duplicarse por variante.

## Cross-references

- **RESEARCH**: `.planning/quick/260422-h9k-ampliar-cobertura-prestige-prereq-data-c/260422-h9k-RESEARCH.md` — Canonical ID mappings HIGH confidence, tabla completa de Weapon Focus (32 entries), Discipline analysis, D-01..D-07 decisions, Open Questions.
- **PLAN**: `.planning/quick/260422-h9k-ampliar-cobertura-prestige-prereq-data-c/260422-h9k-PLAN.md` — corrected post-planner (scope trimmed de 5 overrides a 3; warlock+swashbuckler explicitly out of scope).
- **Predecessor**: Quick `260422-g7s` (commit `a81d8a3`) — wired prestige-gate reachability into `<ClassPicker>`. Este quick extiende la cobertura de overrides que ese quick sólo cableó genéricamente.
- **Upstream gate helper**: `packages/rules-engine/src/progression/prestige-gate.ts@reachableAtLevelN` — sin cambios (CLAUDE.md Prescriptive Shape).

## Self-Check

### Created files exist
- `.planning/quick/260422-h9k-ampliar-cobertura-prestige-prereq-data-c/260422-h9k-SUMMARY.md` → FOUND (this file).

### Modified files contain expected content
- `apps/planner/src/features/level-progression/prestige-prereq-data.ts` → `'class:harper':`, `'class:campeondivino':`, `'class:weaponmaster':` keys present (lines 429, 448, 456). `MELEE_WEAPON_FOCUS_FEATS` declared line 176. `WEAPONMASTER_WEAPON_FOCUS_FEATS` declared line 226. FOUND.
- `tests/phase-12.4/prestige-gate.fixture.spec.ts` → 4 new `it(...)` blocks present. baseInput defaults present (raceId + highest*). FOUND.
- `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx` → 3 new `it(...)` blocks present. FOUND.

### Commits exist
- `c172bbb` (RED) → FOUND via `git log --oneline -5`.
- `7747e87` (GREEN) → FOUND via `git log --oneline -5`.

## Self-Check: PASSED
