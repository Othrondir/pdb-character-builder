---
phase: 16-feat-engine-completion
plan: 02
subsystem: rules-engine + planner-feats
tags: [rules-engine, race-aware, FEAT-05, FEAT-06, D-01, D-03, D-04, D-06]

# Dependency graph
requires:
  - phase: 16-01
    provides: compiledClass.bonusFeatSchedule field + PIT-01 cadence dossier
provides:
  - "determineFeatSlots(buildState, classFeatLists, compiledClass?) — new signature with D-01 precedence"
  - "FeatSlotsAtLevel.raceBonusFeatSlot: boolean — closes feat-eligibility.ts:49 TODO"
  - "BuildStateAtLevel.raceId + activeClassIdAtLevel — Phase 16 D-03 fields"
  - "RACE_L1_BONUS_FEATS allowlist (Humano + Mediano Fortecor) at progression/race-constants.ts"
  - "FeatSlotKind union widened to include 'race-bonus' (Pattern S3)"
  - "Spanish copy: raceBonusStepTitle + raceBonusSectionTitleHumano/MedianoFortecor"
  - "race-bonus slot card + chip + onDeselect dispatch through clearGeneralFeat(level, 1)"
affects: [16-03, feat-engine, FEAT-06, prestige-gate, per-level-budget]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern S3 (slotKind discriminator + data-slot-kind selector) extended to 'race-bonus'"
    - "Pattern S7 (read compiled-class metadata at consumer boundary) preserved at planner-side call sites"
    - "Architectural decision B-01 option (a) — optional compiledClass arg keeps engine framework-agnostic"
    - "PIT-01 cadence reconciliation — fixtures updated atomically with consumer flip"

key-files:
  created:
    - packages/rules-engine/src/progression/race-constants.ts
    - tests/phase-16/determine-feat-slots-race-aware.spec.ts
    - tests/phase-16/feat-board-race-bonus-section.spec.tsx
  modified:
    - packages/rules-engine/src/feats/feat-eligibility.ts
    - packages/rules-engine/src/feats/feat-prerequisite.ts
    - packages/rules-engine/src/progression/per-level-budget.ts
    - apps/planner/src/features/feats/selectors.ts
    - apps/planner/src/features/feats/feat-board.tsx
    - apps/planner/src/features/level-progression/prestige-gate-build.ts
    - apps/planner/src/lib/copy/es.ts
    - vitest.config.ts
    - tests/phase-06/feat-eligibility.spec.ts
    - tests/phase-06/feat-proficiency.spec.ts
    - tests/phase-06/feat-prerequisite.spec.ts
    - tests/phase-06/feat-revalidation.spec.ts
    - tests/phase-12/class-prereq-label.spec.ts
    - tests/phase-12.3/dotes-per-level-gate.spec.tsx
    - tests/phase-12.4/feat-selectability-states.spec.tsx

key-decisions:
  - "Architectural decision B-01 option (a): compiledClass is OPTIONAL on determineFeatSlots. per-level-budget.ts (engine-internal) omits it; planner-side callers (selectors.ts, prestige-gate-build.ts) pass it. Preserves Pattern S7 framework-agnostic boundary."
  - "PIT-01 cadence reconciliation: feat-selectability-states.spec.tsx B4 fixture moved L2→L3 (Puerta odd-level fighter cadence skips L2). per-level-budget.fixture.spec.ts UNCHANGED — Pattern S7 keeps engine-internal budget on legacy fallback so the fixture stays GREEN."
  - "Plan 16-02 expanded fixture migration scope (Rule 3): plan called for ~9 phase-06 sites; type fan-out also broke phase-06/feat-prerequisite, feat-revalidation, and phase-12/class-prereq-label specs. Added raceId+activeClassIdAtLevel defaults to all 5 createBuildState helpers atomically."
  - "Plan 16-02 expanded slotPrompt copy (Rule 1): phase-12.3/dotes-per-level-gate Suite B + D tests asserted plural 'dotes generales disponibles' under the pre-Plan-16-02 conflated layout. Updated to assert singular 'dote general disponible' since race-bonus is now its own card (general slot count is 1 at Humano L1, not 2)."
  - "Race-bonus heading text pre-resolved at the selector layer (Pattern S7) via resolveRaceBonusLabel, not via race lookups in feat-board.tsx — keeps the component pure render."
  - "Sequential step priority: class-bonus → race-bonus → general (Pitfall 6 ordering preserved)."

patterns-established:
  - "compiledClass-optional architectural decision (B-01) for engine vs planner caller asymmetry"
  - "Pre-resolve per-race section heading at selector layer to keep components decoupled from race lookups"

requirements-completed: [FEAT-06]

# Metrics
duration: 14min
completed: 2026-04-26
---

# Phase 16 Plan 02: Race-Aware determineFeatSlots Summary

**FEAT-06 race-aware feat slots landed: `determineFeatSlots(buildState, classFeatLists, compiledClass?)` consumes Plan 16-01's `bonusFeatSchedule` per D-01 precedence, gates Humano + Mediano Fortecor L1 bonus feat per D-06, surfaces the third "Dote racial" slot card in the feat board, and resolves `<LevelEditorActionBar>` to `legal` 3/3 for Humano L1 Guerrero — closing both `feat-eligibility.ts` TODOs (line 45 schedule + line 49 race).**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-26T16:21:16Z
- **Completed:** 2026-04-26T16:36:08Z
- **Tasks:** 5 / 5
- **Files modified:** 16 source/test files (3 created, 13 modified)

## Accomplishments

- Schema layer: `BuildStateAtLevel` extended with `raceId: string | null` + `activeClassIdAtLevel: string | null` (Phase 16 D-03). Type fan-out controlled across 5 fixture call sites.
- Constants barrel: new `progression/race-constants.ts` exports `RACE_L1_BONUS_FEATS` allowlist (Humano + Mediano Fortecor per D-06) and the hoisted `HUMAN_RACE_ID` / `HUMAN_BONUS_FEAT_AT_L1` / `HUMAN_SKILL_POINT_PER_LEVEL` scalars. Avoids circular dep between `feats/feat-eligibility.ts` and `progression/per-level-budget.ts`.
- Engine refactor: `determineFeatSlots(buildState, classFeatLists, compiledClass?)` is the only signature. D-01 precedence ladder = `compiledClass?.bonusFeatSchedule ?? LEGACY_CLASS_BONUS_FEAT_SCHEDULES[classId] ?? null`. New `raceBonusFeatSlot` field gates Humano + Mediano Fortecor at characterLevel === 1.
- Architectural decision B-01: `compiledClass` is OPTIONAL. `per-level-budget.ts` (engine-internal, framework-agnostic) omits it; planner-side `selectors.ts` + `prestige-gate-build.ts` pass it. Pattern S7 preserved.
- UI surface: `FeatSlotKind` widened to `'class-bonus' | 'general' | 'race-bonus'`. `selectFeatBoardView` now produces 3 slot cards at Humano L1 (class-bonus + race-bonus + general). `chosenFeats` projection adds a race-bonus chip with `data-slot-kind="race-bonus"`. `feat-board.tsx::onDeselect` dispatches `clearGeneralFeat(level, 1)` for race-bonus chips.
- Spanish copy: 4 new keys under `shellCopyEs.feats.*` (`raceBonusStepTitle` + 2 per-race section titles + 1 generic template). Per-race heading pre-resolved at selector layer via `resolveRaceBonusLabel`.
- 5 production call sites migrated to the new signature: 3 in `selectors.ts`, 1 in `prestige-gate-build.ts`, 1 in `per-level-budget.ts` (no `compiledClass` per S7).
- 5 fixture spec files migrated: phase-06 eligibility/proficiency/prerequisite/revalidation + phase-12 class-prereq-label.
- 2 adjacent fixture specs reconciled (PIT-01): phase-12.4 feat-selectability-states (A2b card-count + B4 cadence shift) + phase-12.3 dotes-per-level-gate slotPrompt copy.
- 2 new specs in `tests/phase-16/`: rules-engine `determine-feat-slots-race-aware.spec.ts` (6 it blocks: Humano L1 / Mediano Fortecor L1 / Elfo L1 / Humano L2 / Humano L1 Mago / D-01 precedence) + UI `feat-board-race-bonus-section.spec.tsx` (6 it blocks: 3-card render / 3/3 counter / Mediano Fortecor heading / Elfo regression / race-bonus deselect / W-01 LevelEditorActionBar legal).

## Task Commits

Each task committed atomically:

1. **Task 16-02-01:** RED specs + vitest config glob — `df9e9f7` (test)
2. **Task 16-02-02:** Hoist race constants + extend BuildStateAtLevel — `c917391` (refactor)
3. **Task 16-02-03:** Migrate phase-06 + phase-12 fixtures — `75578ea` (test)
4. **Task 16-02-04:** Refactor determineFeatSlots + 5 call-site migrations — `7475bfb` (feat)
5. **Task 16-02-05:** UI surface (chip + section + onDeselect + copy) — `f090ed2` (feat)

## Race-Constants Module

**File:** `packages/rules-engine/src/progression/race-constants.ts`

```typescript
export const HUMAN_RACE_ID = 'race:human' as const;

export const RACE_L1_BONUS_FEATS: ReadonlySet<string> = new Set<CanonicalId>([
  'race:human' as CanonicalId,
  'race:mediano-fortecor' as CanonicalId,
]);

export const HUMAN_BONUS_FEAT_AT_L1 = 1;
export const HUMAN_SKILL_POINT_PER_LEVEL = 1;
```

Allowlist locked per RESEARCH § Anti-Patterns: vanilla NWN1 Halfling does NOT grant a bonus feat at L1; only the explicit Puerta-canon allowlist members surface the race-bonus slot.

## BuildStateAtLevel Migration Manifest

| File | Migration |
|------|-----------|
| `packages/rules-engine/src/feats/feat-prerequisite.ts:13-31` | Source extension — added `raceId: string \| null` + `activeClassIdAtLevel: string \| null`. |
| `apps/planner/src/features/feats/selectors.ts::computeBuildStateAtLevel` (~L295-388) | Populates `raceId: foundationState.raceId` + `activeClassIdAtLevel` from `progressionState.levels.find(...)`. |
| `apps/planner/src/features/feats/selectors.ts::computeBuildStateAtLevel` auto-grant loop | Inline BuildStateAtLevel literal now includes `raceId` + `activeClassIdAtLevel`. |
| `apps/planner/src/features/level-progression/prestige-gate-build.ts:256` | Inline literal in `buildPriorFeatIds` adds the two fields (`raceId: null`, `activeClassIdAtLevel: record.classId`). |
| `packages/rules-engine/src/progression/per-level-budget.ts:184-205` | Inline literal: `raceId: build.raceId`, `activeClassIdAtLevel: classId`. compiledClass arg OMITTED per Pattern S7. |
| `tests/phase-06/feat-eligibility.spec.ts:13` | createBuildState defaults extended with `raceId: null` + `activeClassIdAtLevel: null`; 9 invocations migrated to new (buildState, classFeatLists) shape. |
| `tests/phase-06/feat-proficiency.spec.ts:13` | createBuildState extended; 2 invocations migrated. |
| `tests/phase-06/feat-prerequisite.spec.ts:12` | createBuildState extended (no determineFeatSlots calls — type-conformance only). |
| `tests/phase-06/feat-revalidation.spec.ts:13` | createBuildState extended (type-conformance only). |
| `tests/phase-12/class-prereq-label.spec.ts:22` | createBuildState extended (type-conformance only). |

## determineFeatSlots Refactor

**Before:**
```typescript
export function determineFeatSlots(
  characterLevel: number,
  classId: CanonicalId | null,
  classLevelInClass: number,
  classFeatLists: FeatCatalog['classFeatLists'],
): FeatSlotsAtLevel { ... }
```

**After:**
```typescript
export function determineFeatSlots(
  buildState: BuildStateAtLevel,
  classFeatLists: FeatCatalog['classFeatLists'],
  compiledClass?: CompiledClass | null,
): FeatSlotsAtLevel {
  const characterLevel = buildState.characterLevel;
  const classId = buildState.activeClassIdAtLevel ?? null;
  const classLevelInClass = classId
    ? buildState.classLevels[classId] ?? 0
    : 0;
  // ...
  // D-01 precedence ladder:
  if (!classBonusFeatSlot && classId) {
    const schedule =
      compiledClass?.bonusFeatSchedule ??
      LEGACY_CLASS_BONUS_FEAT_SCHEDULES[classId] ??
      null;
    if (schedule && schedule.includes(classLevelInClass)) {
      classBonusFeatSlot = true;
    }
  }
  // ...
  // D-06 race-bonus:
  const raceBonusFeatSlot =
    buildState.raceId != null &&
    RACE_L1_BONUS_FEATS.has(buildState.raceId) &&
    characterLevel === 1;

  return {
    classBonusFeatSlot,
    generalFeatSlot,
    raceBonusFeatSlot,
    autoGrantedFeatIds,
  };
}
```

Legacy map renamed: `CLASS_BONUS_FEAT_SCHEDULES` → `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` (D-01 fallback role).

## Selectors Changes

- **`FeatSlotKind` widened** at line 111: `'class-bonus' | 'general' | 'race-bonus'`.
- **`FeatSummaryChosenEntry.slotKind`** at line ~209: now uses the union type.
- **`buildSlotStatuses`** extended with race-bonus branch + new params (`raceBonusFeatSlot`, `raceId`, `raceBonusFeatId`). Heading text pre-resolved per-race via `resolveRaceBonusLabel`.
- **`generalSlotCount` math correction** at line ~1138: dropped `+ budget.featSlots.raceBonus` — race-bonus is now its own card.
- **`chosenFeats` three-block projection**: class-bonus → race-bonus (skips bonusGeneralFeatIds[0] in subsequent loop) → general primary → general bonus loop.
- **Sequential step**: class-bonus → race-bonus → general.

## feat-board.tsx onDeselect Race-Bonus Dispatch

```typescript
if (entry.slotKind === 'class-bonus') {
  clearClassFeat(activeLevel, entry.slotIndex);
} else if (entry.slotKind === 'race-bonus') {
  // race-bonus chip's slotIndex=0 → store's bonusGeneralFeatIds[0]
  // → store mutator addresses as slotIndex=1 (D-07; PATTERNS.md S3).
  clearGeneralFeat(activeLevel, 1);
} else {
  clearGeneralFeat(activeLevel, entry.slotIndex);
}
```

No store mutator changes (D-07 honored).

## Spanish Copy Keys Added

Under `shellCopyEs.feats.*`:

```typescript
raceBonusStepTitle: 'Dote racial',
raceBonusSectionTitleHumano: 'Dote racial: Humano',
raceBonusSectionTitleMedianoFortecor: 'Dote racial: Mediano Fortecor',
raceBonusSectionTitleTemplate: 'Dote racial: {raceName}',
```

D-NO-COPY relaxation honored (CONTEXT D-04). Spanish-first per CLAUDE.md.

## vitest.config.ts Glob

Added: `['tests/phase-16/**/*.spec.tsx', 'jsdom']` — mirrors phase-12.7 / phase-15 entries.

## 9-Site Fixture Migration Confirmation

Grep evidence (after migration):

```
$ grep -nE "determineFeatSlots\(\s*(\d|null)" tests/phase-06/
(no matches) — all old-form positional-arg calls migrated.

$ grep -nE "determineFeatSlots\(\s*createBuildState" tests/phase-06/
tests/phase-06/feat-eligibility.spec.ts: 8 matches
tests/phase-06/feat-proficiency.spec.ts: 2 matches
Total: 10 matches.
```

(Plan called for ~9; actual is 10 across both files — feat-eligibility has 8 invocations including loops, feat-proficiency has 2.)

## Cadence Reconciliation (PIT-01)

**Per-level-budget fixture spec UNCHANGED.** The architectural decision B-01 option (a) — `per-level-budget.ts` omits `compiledClass` and falls through to `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` — keeps the engine-internal budget math on the vanilla cadence. The fixture spec at `tests/phase-12.4/per-level-budget.fixture.spec.ts` continues to assert vanilla `[1,2,4,...]` cadence and stays 28/28 GREEN.

**Adjacent fixture specs that exercise the planner-side path (where `compiledClass` IS passed) needed reconciliation:**

| Class | Legacy LEGACY map | Extractor `bonusFeatSchedule` | Disposition |
|-------|-------------------|-------------------------------|-------------|
| `class:fighter` | `[1,2,4,6,8,10,12,14,16]` | `[1,3,5,7,9,11,13,15,17,19]` | Extractor wins at planner-side. |
| `class:rogue` | `[10,13,16]` | `[9,12,15,18]` | Extractor wins at planner-side. |
| `class:wizard` | `[1,5,10,15]` | `[4,9,14,19]` | Extractor wins at planner-side. |
| `class:caballero-arcano` | `[1,3,5,7,9,11,13,15]` | `[13,17]` | Extractor wins at planner-side. |
| `class:monk` | `[1,2,6]` | `[]` (Puerta dropped vanilla bonus feats) | Extractor empty wins. |
| `class:swashbuckler` | `[1,2,5,9,13]` | `null` (cls_bfeat_swash MISSING from nwsync) | Legacy fallback wins. |

**One adjacent spec updated as a direct consequence:**
- `tests/phase-12.4/feat-selectability-states.spec.tsx` Suite B test `B4`: changed activeLevel from `2`→`3` because under Puerta odd-level fighter cadence (`[1,3,5,7,9,11,13,15,17,19]`) L2 has no class-bonus slot. The next bonus after L1 is L3.

**Two adjacent specs updated for the new race-bonus card layout (Plan 16-02 D-04):**
- `tests/phase-12.4/feat-selectability-states.spec.tsx` Suite A `A2b`: updated to assert 3 cards (`class-bonus-0` + `race-bonus-0` + `general-0`) instead of 2 general cards. Pre-Plan-16-02 conflated layout had race-bonus rendered as `general-1`.
- `tests/phase-12.3/dotes-per-level-gate.spec.tsx` Suite B + D slotPrompt copy: Humano L1 Guerrero now generates singular "dote general disponible" (general slot count is 1, not 2 — race-bonus is its own card, not folded into general).

## Manual UAT Log

UAT delegated to the rules-engine + UI specs (Suite A/B/C/D coverage in feat-board-race-bonus-section.spec.tsx is the primary acceptance — including the W-01 LevelEditorActionBar `legal` resolution test). All 6 specs GREEN.

Spec coverage by user-facing flow:
- **Humano L1 Fighter (D-04 / FEAT-06 #3):** spec test 1 (3 slot cards) + spec test 2 (3/3 counter + race-bonus chip) + spec test 6 (LevelEditorActionBar `Continuar al nivel 2`).
- **Mediano Fortecor L1 Fighter (D-06 expansion):** spec test 3 (`Dote racial: Mediano Fortecor` heading text).
- **Elfo L1 Fighter (regression lock):** spec test 4 (only 2 slot cards; `race-bonus-0` selector returns null).
- **Race-bonus deselect (D-07 store mutator contract):** spec test 5 (clearGeneralFeat(level, 1) clears `bonusGeneralFeatIds[0]`).

## Both feat-eligibility.ts TODOs Closed

Pre-Plan-16-02:
- Line 99: `* NOTE: Human bonus feat at level 1 is not modeled here (would need race data).`
- Line 100: `* TODO: Add human bonus feat logic when race-aware feat selection is implemented.`

Post-Plan-16-02 (verified via grep — zero matches against `TODO|NOTE: Human|race-aware feat` in `feat-eligibility.ts`):
- Both replaced with: `* Race-bonus: D-06 allowlist (Humano + Mediano Fortecor) at character level 1.`

W-03 acceptance: `Grep TODO bonus feat schedule|human bonus feat|race-aware feat selection` returns ZERO matches.

## Decisions Made

1. **Architectural decision B-01 option (a) — optional `compiledClass` arg.** `per-level-budget.ts` lives inside `packages/rules-engine/`; importing `compiledClassCatalog` would break the framework-agnostic boundary (Pattern S7). Made `compiledClass?: CompiledClass | null` optional on `determineFeatSlots` so engine-internal callers can omit it (legacy fallback wins) while planner-side callers thread the resolved class. Avoids the callback-adapter alternative (option b) which would add indirection with zero current consumer.
2. **Pre-resolve race heading at selector layer (Pattern S7).** `resolveRaceBonusLabel` returns the `Dote racial: Humano` / `Dote racial: Mediano Fortecor` / generic template at the selector edge; feat-board.tsx renders straight from `slotStatus.label` without any race lookup. Keeps the component pure.
3. **Plan 16-02 PIT-01 cadence reconciliation IS necessary at the planner-side path.** Because B-01 keeps `per-level-budget.ts` on legacy fallback, the per-level-budget.fixture.spec.ts stays GREEN unchanged — but specs that exercise the planner-side path (where `compiledClass` IS passed) must pin the new Puerta-canon cadence. One spec needed an L2→L3 fixture move (B4); the per-level-budget fixture spec was untouched.
4. **Rule 3 deviation: 5 fixture files migrated, not 2.** Plan called for `feat-eligibility.spec.ts` + `feat-proficiency.spec.ts`. The same `BuildStateAtLevel` type fan-out broke 3 more fixture files (`feat-prerequisite.spec.ts`, `feat-revalidation.spec.ts`, `class-prereq-label.spec.ts`). All 5 migrated atomically in commit `75578ea` to keep typecheck-clean per task.
5. **Rule 1 deviation: phase-12.3 slotPrompt copy update.** Suite B+D in `dotes-per-level-gate.spec.tsx` asserted "dotes generales disponibles" (plural) under the pre-Plan-16-02 conflated layout where race-bonus inflated `generalSlotCount` to 2. Post-Plan-16-02, race-bonus is its own card; `generalSlotCount` is 1 at Humano L1 → singular template fires. Tests updated to match the new (correct) singular copy. The race-bonus slot now has its own dedicated card in the slot strip — slotPrompt no longer needs to mention it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] BuildStateAtLevel type fan-out broke 3 additional fixture files**

- **Found during:** Task 16-02-02 typecheck — initial run showed errors not just in `feat-eligibility.spec.ts`/`feat-proficiency.spec.ts` (the 2 files plan called out) but also in `feat-prerequisite.spec.ts`, `feat-revalidation.spec.ts`, and `class-prereq-label.spec.ts`. All 3 carry `createBuildState` helpers that used the old shape.
- **Issue:** Type fan-out from the new required fields `raceId` + `activeClassIdAtLevel` blocks typecheck across every spec that builds a `BuildStateAtLevel` literal — not just the ones plan named.
- **Fix:** Extended `createBuildState` defaults in all 5 fixture files atomically in Task 16-02-03 commit. The 3 additional files only needed the helper extension (no `determineFeatSlots` invocations); 2 also needed runtime call-site swaps.
- **Files modified:** `tests/phase-06/feat-prerequisite.spec.ts`, `tests/phase-06/feat-revalidation.spec.ts`, `tests/phase-12/class-prereq-label.spec.ts`.
- **Committed in:** `75578ea`.
- **Verification:** `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` exits 0; `pnpm exec vitest run tests/phase-06 tests/phase-12` GREEN.

**2. [Rule 1 - Bug] phase-12.4 feat-selectability-states B4 fixture cadence mismatch**

- **Found during:** Task 16-02-04 verification — running `tests/phase-12.4` after the consumer flip surfaced a fail at B4 (`expected null not to be null` for `[data-feat-id="feat:carrera"]`).
- **Issue:** B4 asserts class-bonus row renders at L2 Guerrero. Under the new D-01 extractor-primary precedence, fighter's Puerta-canon cadence is `[1,3,5,7,9,11,13,15,17,19]` (every odd level) — L2 has NO class-bonus slot. The vanilla `[1,2,4,...]` cadence the fixture was authored against is now silently overridden.
- **Fix:** Moved fixture from L2→L3. L3 IS in the Puerta cadence, so the class-bonus row renders again and the "Tomada en N1" pill assertion holds. Inline comment documents the PIT-01 rationale.
- **Files modified:** `tests/phase-12.4/feat-selectability-states.spec.tsx`.
- **Committed in:** `7475bfb` (Task 16-02-04 atomic commit including the consumer flip and the fixture reconciliation).
- **Verification:** `pnpm exec vitest run tests/phase-12.4/feat-selectability-states.spec.tsx` GREEN 27/27.

**3. [Rule 1 - Bug] phase-12.4 feat-selectability-states A2b card-count assertion outdated**

- **Found during:** Task 16-02-05 verification — running `tests/phase-12.4` after the race-bonus card landed.
- **Issue:** A2b asserted `generalCards.length === 2` for L1 Humano Guerrero. Pre-Plan-16-02, race-bonus was conflated into the general-slot count, so the layout was 2 general cards (`general-0` + `general-1`). Post-Plan-16-02 (D-04), race-bonus has its own card, so the layout is 1 general card + 1 race-bonus card.
- **Fix:** Updated A2b to assert 3 distinct cards (`[data-slot-card="class-bonus-0"]`, `[data-slot-card="race-bonus-0"]`, `[data-slot-card="general-0"]`) and 1 general card. Inline comment documents the new (correct) Plan 16-02 layout.
- **Files modified:** `tests/phase-12.4/feat-selectability-states.spec.tsx`.
- **Committed in:** `f090ed2`.
- **Verification:** `pnpm exec vitest run tests/phase-12.4/feat-selectability-states.spec.tsx` GREEN 27/27.

**4. [Rule 1 - Bug] phase-12.3 dotes-per-level-gate slotPrompt copy assertions outdated**

- **Found during:** Task 16-02-05 full vitest run.
- **Issue:** Suite B + Suite D tests asserted "dotes generales disponibles" (plural) for L1 Humano Guerrero. Pre-Plan-16-02, race-bonus inflated `generalSlotCount` to 2, so the plural template fired. Post-Plan-16-02 (D-04), race-bonus is its own card; `generalSlotCount` is 1 → singular template "dote general disponible" fires. Also one test asserted slotPrompt mentions a remaining bonus general slot when class+general filled — but with race-bonus as its own card, slotPrompt is null at that point (no remaining slots in the slotPrompt aggregate; race-bonus card carries its own state).
- **Fix:** Updated 4 test cases in Suite B + Suite D to expect singular "dote general disponible" or null slotPrompt where applicable. Inline comments document the Plan 16-02 D-04 rationale.
- **Files modified:** `tests/phase-12.3/dotes-per-level-gate.spec.tsx`.
- **Committed in:** `f090ed2`.
- **Verification:** `pnpm exec vitest run tests/phase-12.3` GREEN 52/52.

## Verification Results

- `corepack pnpm exec vitest run tests/phase-16 --reporter=dot` — **16/16 GREEN** (10 from Plan 16-01 dossier + 6 from race-aware spec).
  - `tests/phase-16/determine-feat-slots-race-aware.spec.ts` — 6/6 GREEN.
  - `tests/phase-16/feat-board-race-bonus-section.spec.tsx` — 6/6 GREEN (5 board behaviours + 1 W-01 LevelEditorActionBar).
  - `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` — 10/10 GREEN (untouched, baseline preserved from Plan 16-01).
- `corepack pnpm exec vitest run tests/phase-06 --reporter=dot` — **76/76 GREEN.**
- `corepack pnpm exec vitest run tests/phase-12.3 --reporter=dot` — **52/52 GREEN** (2 skipped, unchanged baseline).
- `corepack pnpm exec vitest run tests/phase-12.4 --reporter=dot` — **151/153 GREEN** (2 pre-existing class-picker-prestige-reachability baseline failures unchanged from STATE.md).
- `corepack pnpm exec vitest run tests/phase-12.4/per-level-budget.fixture.spec.ts --reporter=dot` — **28/28 GREEN** (Pattern S7 + B-01 option (a) preserve fixture parity).
- `corepack pnpm exec vitest run tests/phase-12.7 tests/phase-12.8 tests/phase-15 --reporter=dot` — all GREEN.
- `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` — exit **0**.
- Full vitest run (`corepack pnpm exec vitest run`) — **2265 passed, 3 failed, 2 skipped, 1 todo** (3 baseline failures unchanged: 1 phase-08 BUILD_ENCODING_VERSION literal + 2 phase-12.4 class-picker-prestige-reachability).

## Threat Surface Scan

No new security-relevant surface introduced. Threat register mitigations honored:
- T-16-02-05 (XSS via section heading): `resolveRaceBonusLabel` returns pre-translated static strings from `shellCopyEs.feats.*`. The `raceBonusSectionTitleTemplate` `.replace('{raceName}', ...)` path is unused at runtime (only Humano + Mediano Fortecor are in the allowlist; both have hardcoded keys). React JSX text-node insertion HTML-encodes by default. Verified: zero `dangerouslySetInnerHTML` introduced in this plan.

No threat flags raised — UI surface stays inside existing trust boundary.

## Known Stubs

None. The race-bonus chip is fully wired end-to-end: rules-engine signal → selectors widening → slot strip card → chosenFeats projection → onDeselect dispatch → store mutator. No deferred functionality.

## Self-Check: PASSED

**Files exist:**
- `packages/rules-engine/src/progression/race-constants.ts` — FOUND
- `tests/phase-16/determine-feat-slots-race-aware.spec.ts` — FOUND
- `tests/phase-16/feat-board-race-bonus-section.spec.tsx` — FOUND
- `packages/rules-engine/src/feats/feat-eligibility.ts` — FOUND (modified — TODOs closed)
- `packages/rules-engine/src/feats/feat-prerequisite.ts` — FOUND (modified — BuildStateAtLevel extended)
- `packages/rules-engine/src/progression/per-level-budget.ts` — FOUND (modified — race-constants imports + new call shape)
- `apps/planner/src/features/feats/selectors.ts` — FOUND (modified — FeatSlotKind widened, race-bonus chip)
- `apps/planner/src/features/feats/feat-board.tsx` — FOUND (modified — onDeselect race-bonus branch)
- `apps/planner/src/features/level-progression/prestige-gate-build.ts` — FOUND (modified — call-site migration)
- `apps/planner/src/lib/copy/es.ts` — FOUND (modified — 4 new copy keys)
- `vitest.config.ts` — FOUND (modified — phase-16 jsdom glob)

**Commits exist:**
- `df9e9f7` (Task 16-02-01) — FOUND
- `c917391` (Task 16-02-02) — FOUND
- `75578ea` (Task 16-02-03) — FOUND
- `7475bfb` (Task 16-02-04) — FOUND
- `f090ed2` (Task 16-02-05) — FOUND
