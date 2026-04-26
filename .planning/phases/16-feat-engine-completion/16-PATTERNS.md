---
phase: 16-feat-engine-completion
created: 2026-04-26
mode: pattern-mapping
---

# Phase 16 — Feat Engine Completion · PATTERNS

**Mapped:** 2026-04-26
**Files analyzed:** 14 (11 modify · 3 create · plus 9 fixture sites in 2 spec files)
**Analogs found:** 14 / 14 — every file has a strong in-repo analog.

> **Path note:** The CONTEXT prompt references `apps/planner/src/i18n/es.ts`. The canonical location in this repo is `apps/planner/src/lib/copy/es.ts` (verified by `Glob apps/planner/src/i18n/**` → 0 hits; `shellCopyEs` is exported from `lib/copy/es.ts`). All copy work lands there.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/data-extractor/src/contracts/class-catalog.ts` | contract (Zod schema) | transform | self (extend existing `compiledClassSchema`) | exact — additive field |
| `packages/data-extractor/src/assemblers/class-assembler.ts` | assembler (build-time CLI) | batch / file-I/O | `packages/data-extractor/src/assemblers/feat-assembler.ts` `load2da` + per-class loop @L148-272 | exact (same shape, sibling table) |
| `apps/planner/src/data/compiled-classes.ts` | generated artifact | regenerate | itself (rebuild via `pnpm extract`) | n/a — overwritten by extractor |
| `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` | test (vitest, node env) | request-response | `tests/phase-12.4/extractor-deleted-sentinel.spec.ts` | exact (extractor catalog assertion shape) |
| `packages/rules-engine/src/feats/feat-eligibility.ts` | rules-engine (pure) | transform | self (`determineFeatSlots` @L102-151) | exact — refactor-in-place |
| `packages/rules-engine/src/feats/feat-prerequisite.ts` | rules-engine (pure) | contract | self (`BuildStateAtLevel` @L13-28) | exact — additive interface fields |
| `packages/rules-engine/src/progression/race-constants.ts` | rules-engine (constants barrel) | static | `packages/rules-engine/src/progression/per-level-budget.ts:71-73` (HUMAN_RACE_ID + sibling consts) | role-match — hoist destination |
| `apps/planner/src/features/feats/selectors.ts` | selector (pure projection) | transform | self (`buildSlotStatuses` @L927-1004 + `chosenFeats` projection @L1233-1261) | exact — additive third branch |
| `apps/planner/src/features/feats/feat-board.tsx` | component (React) | event-driven | self (`onDeselect` dispatch @L138-156) | exact — additive third `if` branch |
| `apps/planner/src/features/feats/feat-summary-card.tsx` | component (React) | request-response (props) | self (existing `data-slot-kind` chip rendering @L40-56) | exact — type union widening |
| `apps/planner/src/features/feats/store.ts` | store (zustand) | CRUD (in-memory) | self (`clearGeneralFeat` slotIndex addressing @L107-122) | exact — no mutator changes per D-07 |
| `apps/planner/src/lib/copy/es.ts` | i18n constant table | static | self (`shellCopyEs.feats` namespace @L287-369) | exact — additive keys |
| `tests/phase-06/feat-eligibility.spec.ts` (FIXTURE MIGRATION, ~9 sites) | test (vitest, node env) | n/a | self (existing 4-arg call sites @L27-118) | exact — signature swap |
| `tests/phase-06/feat-proficiency.spec.ts` (FIXTURE MIGRATION) | test (vitest, node env) | n/a | sibling tests/phase-06 specs | exact — same swap shape |
| `tests/phase-16/determine-feat-slots-race-aware.spec.ts` | test (vitest, node env) | request-response | `tests/phase-06/feat-eligibility.spec.ts` (build-state fixture pattern @L1-23) | exact |
| `tests/phase-16/feat-board-race-bonus-section.spec.tsx` | test (vitest, jsdom + RTL) | event-driven | `tests/phase-12.4/feat-selectability-states.spec.tsx` | exact |
| `tests/phase-16/humano-l1-build-roundtrip.spec.ts` | test (vitest, jsdom) | request-response | `tests/phase-08/json-roundtrip.spec.ts` + `tests/phase-08/hydrate-build-document.spec.ts` (round-trip @L52-60) | exact |

---

## Pattern Assignments

### `packages/data-extractor/src/contracts/class-catalog.ts` (contract, transform)

**Analog:** self — additive field on existing `compiledClassSchema`.

**Existing schema shape (lines 10-31)** — additive insertion point at end of object literal:
```typescript
export const compiledClassSchema = z.object({
  attackBonusProgression: z.enum(BAB_PROGRESSIONS),
  description: z.string(),
  featTableRef: z.string().nullable(),
  hitDie: z.number().int().positive(),
  // ... existing fields ...
  spellCaster: z.boolean(),
  spellGainTableRef: z.string().nullable(),
  spellKnownTableRef: z.string().nullable(),
});
```

**Field to add** (alphabetical insertion to keep diff stable, between `attackBonusProgression` and `description`):
```typescript
bonusFeatSchedule: z.array(z.number().int().positive()).nullable().optional(),
```

**Why optional + nullable:** `null` = "extractor reached the row but `BonusFeatsTable === '****'`"; `undefined` = "older catalog snapshot pre-Plan 16-01" (none ship today, so this is mostly forward-compat). Empty array `[]` = "table read, zero entries 1-20" — distinct from `null`.

**Schema-version bump?** No. `classCatalogSchema.schemaVersion: z.literal('1')` (line 36) stays at `'1'`. The field is `.optional()` so existing class-catalog snapshots still parse.

---

### `packages/data-extractor/src/assemblers/class-assembler.ts` (assembler, batch + file-I/O)

**Analog:** `packages/data-extractor/src/assemblers/feat-assembler.ts` — `load2da` helper @L148-161 + the per-class `cls_feat_*` loop @L239-273.

**Imports already present in current file (lines 11-18)** — only `parseTwoDa`/`TwoDaTable` need a new local helper definition; everything else is in scope:
```typescript
import { parseTwoDa, type TwoDaTable } from '../parsers/two-da-parser';
import { classCatalogSchema, type ClassCatalog, type CompiledClass } from '../contracts/class-catalog';
import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
```

**Pattern 1 — `load2da` to copy verbatim** (source: `feat-assembler.ts:148-161`):
```typescript
function load2da(
  resref: string,
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
): TwoDaTable | null {
  const buf = nwsyncReader.getResource(resref, RESTYPE_2DA);
  if (buf) return parseTwoDa(buf.toString('utf-8'));

  const baseBuf = baseGameReader.getResource(resref, RESTYPE_2DA);
  if (baseBuf) return parseTwoDa(buf.toString('utf-8'));

  return null;
}
```
Already-imported `parseTwoDa` + `RESTYPE_2DA` mean copying this helper into `class-assembler.ts` is zero-import-churn.

**Insertion point — column read** (current code at line 188):
```typescript
// Cross-reference table refs
const skillTableRef = row.SkillsTable ?? null;
const featTableRef = row.FeatsTable ?? null;
const spellGainTableRef = row.SpellGainTable ?? null;
const spellKnownTableRef = row.SpellKnownTable ?? null;
```
Add after `featTableRef`:
```typescript
const bonusFeatsTableRef = row.BonusFeatsTable ?? null;
const bonusFeatSchedule = parseBonusFeatSchedule(
  bonusFeatsTableRef,
  nwsyncReader,
  baseGameReader,
  warnings,
  label,
);
```

**Insertion point — `classes.push({...})` at line 200** (current alphabetical-ish ordering):
```typescript
classes.push({
  attackBonusProgression,
  bonusFeatSchedule,                  // ← INSERT, between attackBonusProgression + description
  description: resolvedDesc,
  featTableRef,
  hitDie: hitDie > 0 ? hitDie : 4,
  // ... existing fields ...
});
```

**Helper parsing pattern (mirror PIT-03 — single-column 2DA, row index = class level):**
```typescript
function parseBonusFeatSchedule(
  bonusFeatsTableRef: string | null,
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
  warnings: string[],
  classLabel: string,
): number[] | null {
  if (!bonusFeatsTableRef) return null;
  const resref = bonusFeatsTableRef.toLowerCase();
  const table = load2da(resref, nwsyncReader, baseGameReader);
  if (!table) {
    warnings.push(`cls_bfeat table '${resref}' not found for class '${classLabel}'`);
    return null;
  }
  const schedule: number[] = [];
  for (const [rowIndex, row] of table.rows) {
    if (row.Bonus === '1' && rowIndex >= 1 && rowIndex <= 20) {
      schedule.push(rowIndex);
    }
  }
  return schedule;
}
```
**Anti-pattern lock (per RESEARCH § Anti-Patterns):** the parser must use `rowIndex >= 1` (NOT `>= 0`) to match `feat-assembler.ts:264` `grantedOnLevel != null && grantedOnLevel > 0` semantics — row 0 is metadata, not class L0.

**Warning idiom (mirror existing `class-assembler.ts:124, 135, 142, 174`):** push human-readable strings into `warnings: string[]`, never throw. Tests under `tests/phase-12.4/extractor-deleted-sentinel.spec.ts` set the precedent.

---

### `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` (test, node env)

**Analog:** `tests/phase-12.4/extractor-deleted-sentinel.spec.ts` (lines 1-80).

**Imports + dataset assertion shape to copy** (this exact pattern, lines 1-11):
```typescript
import { describe, expect, it } from 'vitest';
import { compiledClassCatalog } from '@planner/data/compiled-classes';

describe('Phase 16-01 — extractor surfaces bonusFeatSchedule on CompiledClass', () => {
  it('class:fighter ships a non-null schedule containing canonical Guerrero cadence', () => {
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter');
    expect(fighter).toBeDefined();
    expect(fighter!.bonusFeatSchedule).not.toBeNull();
    expect(fighter!.bonusFeatSchedule).toEqual(
      expect.arrayContaining([1, 2, 4, 6, 8, 10, 12, 14, 16]),
    );
  });

  it('a non-bonus class (e.g., class:wizard via vanilla NWN1 — verify against extracted output) has either null or [] schedule', () => {
    // ...assert per acceptance: at least ONE class has null bonusFeatSchedule.
  });
});
```

**Vitest env note:** No `// @vitest-environment jsdom` directive needed — extractor specs run in node env (default).

**Critical RED-gate:** Until `class-assembler.ts` ships the field, `fighter!.bonusFeatSchedule` is `undefined` and `not.toBeNull()` will FAIL on undefined too — confirm the spec gates correctly with both nullish branches if needed.

---

### `packages/rules-engine/src/feats/feat-eligibility.ts` (rules-engine, transform)

**Analog:** self — refactor `determineFeatSlots` @L102-151 in place. The legacy 6-entry map @L78-87 stays as `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` (fallback role per D-01).

**Current signature to MIGRATE FROM (lines 102-107):**
```typescript
export function determineFeatSlots(
  characterLevel: number,
  classId: CanonicalId | null,
  classLevelInClass: number,
  classFeatLists: FeatCatalog['classFeatLists'],
): FeatSlotsAtLevel {
```

**Current `FeatSlotsAtLevel` shape (lines 13-20)** — extend with one new field:
```typescript
export interface FeatSlotsAtLevel {
  classBonusFeatSlot: boolean;
  generalFeatSlot: boolean;
  raceBonusFeatSlot: boolean;       // ← ADD (Phase 16, D-04)
  autoGrantedFeatIds: string[];
}
```

**Current fallback branch to PRESERVE (lines 137-145)** — D-01 explicitly keeps this; only rename:
```typescript
// Rename: CLASS_BONUS_FEAT_SCHEDULES → LEGACY_CLASS_BONUS_FEAT_SCHEDULES
// New precedence: compiledClass.bonusFeatSchedule first, legacy fallback second.
if (!classBonusFeatSlot) {
  const schedule =
    compiledClass?.bonusFeatSchedule ??
    LEGACY_CLASS_BONUS_FEAT_SCHEDULES[classId] ??
    null;
  if (schedule && schedule.includes(classLevelInClass)) {
    classBonusFeatSlot = true;
  }
}
```

**New race-bonus branch to ADD (after `generalFeatSlot` at line 148):**
```typescript
const raceBonusFeatSlot =
  buildState.raceId != null &&
  RACE_L1_BONUS_FEATS.has(buildState.raceId) &&
  characterLevel === 1;
return { classBonusFeatSlot, generalFeatSlot, raceBonusFeatSlot, autoGrantedFeatIds };
```

**Imports to add at top of file** (after existing `feat-prerequisite` import at L11):
```typescript
import { RACE_L1_BONUS_FEATS } from '../progression/race-constants';
import type { CompiledClass } from '@data-extractor/contracts/class-catalog';
```

**Per-Level-Budget call-site cascade (per RESEARCH PIT-02 + Migration sites table):**
- `per-level-budget.ts:184-189` — already constructs the args inline; convert to passing `BuildStateAtLevel` (build snapshot already carries `raceId` field at L109).
- The `_raceCatalog` parameter @L149 stays unused but the function body now reads `build.raceId` for the predicate (already done @L194).

---

### `packages/rules-engine/src/feats/feat-prerequisite.ts` (rules-engine, contract)

**Analog:** self — additive interface fields on `BuildStateAtLevel` @L13-28.

**Current shape (lines 13-28)** — extend with two new fields:
```typescript
export interface BuildStateAtLevel {
  abilityScores: Record<string, number>;
  bab: number;
  characterLevel: number;
  classLevels: Record<string, number>;
  fortitudeSave: number;
  selectedFeatIds: Set<string>;
  skillRanks: Record<string, number>;
  // NEW (Phase 16, D-03):
  raceId: string | null;
  activeClassIdAtLevel: string | null;
}
```

**Why both** (per RESEARCH § Pattern 2):
- `raceId` — enables Humano L1 + Mediano Fortecor L1 bonus-feat predicate.
- `activeClassIdAtLevel` — disambiguates multiclass: the class for THIS level (not the highest-level class). `determineFeatSlots` reads it via `buildState.activeClassIdAtLevel ?? null`.

**Compile-time fan-out:** All existing call sites that build `BuildStateAtLevel` literals must add the two new fields (or default to `null`). Enumerated in CONTEXT § Plan Decomposition Hints — 5 production call sites + ~9 fixture sites.

---

### `packages/rules-engine/src/progression/race-constants.ts` (rules-engine, static barrel) — **NEW FILE**

**Analog:** `packages/rules-engine/src/progression/per-level-budget.ts:71-73` — the existing constants block to hoist.

**Why a new file (not just hoist into `feat-eligibility.ts`):** Per RESEARCH § Pattern 2, `per-level-budget.ts` already imports from `feats/feat-eligibility`, so adding a back-import would create a circular dep. A neutral third file (`progression/race-constants.ts`) under the same `progression/` directory matches the existing organisation (`per-level-budget.ts`, `compute-hit-points.ts`, `class-entry-rules.ts` are siblings).

**Existing constants to hoist (lines 71-73):**
```typescript
const HUMAN_RACE_ID = 'race:human';
const HUMAN_BONUS_FEAT_AT_L1 = 1;
const HUMAN_SKILL_POINT_PER_LEVEL = 1;
```

**New file shape (per CONTEXT D-06 — Set, not single id):**
```typescript
import type { CanonicalId } from '../contracts/canonical-id';

/**
 * Phase 16 — D-06 Mediano Fortecor scope expansion.
 * Races whose canon description includes
 * "Aprendizaje rápido: Ganan 1 dote adicional a 1.er nivel".
 * Locked by RESEARCH § Anti-Patterns: do NOT auto-promote any race
 * whose description contains the marker — vanilla NWN1 Halfling does NOT
 * grant bonus feat at L1; this is the explicit Puerta-canon allowlist.
 */
export const HUMAN_RACE_ID = 'race:human' as const;
export const RACE_L1_BONUS_FEATS: ReadonlySet<string> = new Set<CanonicalId>([
  'race:human' as CanonicalId,
  'race:mediano-fortecor' as CanonicalId,
]);

/** Skill-point bonus side: kept for per-level-budget back-compat. */
export const HUMAN_BONUS_FEAT_AT_L1 = 1;
export const HUMAN_SKILL_POINT_PER_LEVEL = 1;
```

**Migration of `per-level-budget.ts` (lines 71-73 → import):**
```typescript
import {
  HUMAN_RACE_ID,
  HUMAN_BONUS_FEAT_AT_L1,
  HUMAN_SKILL_POINT_PER_LEVEL,
} from './race-constants';
```

**Verification of mediano-fortecor canonical id:** Per CONTEXT D-06, the canonical id is `race:mediano-fortecor`. The race's TLK description carries the same "Aprendizaje rápido" marker. Verify against `apps/planner/src/data/compiled-races.ts` (`compiled-races.ts:130` per RESEARCH).

---

### `apps/planner/src/features/feats/selectors.ts` (selector, transform)

**Analog:** self — extend `FeatSlotKind` union @L111 + `buildSlotStatuses` @L927-1004 + `chosenFeats` projection @L1233-1261.

**Type union (line 111)** — widen:
```typescript
// Current:
export type FeatSlotKind = 'class-bonus' | 'general';
// New:
export type FeatSlotKind = 'class-bonus' | 'general' | 'race-bonus';
```

**FeatSummaryChosenEntry slotKind (line 208)** — same widening:
```typescript
// Current:
slotKind: 'class-bonus' | 'general';
// New (mirror the FeatSlotKind union):
slotKind: FeatSlotKind;
```

**`buildSlotStatuses` ordering pattern (current lines 980-1001) — three-block insertion (class-bonus → race-bonus → general) per Pitfall 6:**
```typescript
// EXISTING block 1 — class-bonus:
if (hasClassBonusSlot) {
  pushStatus('class-bonus', 0, shellCopyEs.feats.classFeatStepTitle, selectedClassFeatId);
}

// NEW block 2 — race-bonus (insert between):
if (raceBonusFeatSlot) {
  pushStatus(
    'race-bonus',
    0,
    shellCopyEs.feats.raceBonusStepTitle,           // ← NEW copy key
    activeFeatRecord?.bonusGeneralFeatIds[0] ?? null,
  );
}

// EXISTING block 3 — general:
for (let slotIndex = 0; slotIndex < generalSlotCount; slotIndex += 1) {
  pushStatus('general', slotIndex, /* ... */, selectedGeneralFeatIds[slotIndex] ?? null);
}
```
**Note on `generalSlotCount` invariant:** the existing computation @L1120 `const generalSlotCount = budget.featSlots.general + budget.featSlots.raceBonus;` currently OVER-counts general slots when `raceBonus > 0`. After the new race-bonus card lands, change to `budget.featSlots.general` only — race-bonus is now its own card, not a general bonus.

**`chosenFeats` projection (current lines 1233-1261)** — three-block discriminator pattern:
```typescript
// EXISTING block 1 — class-bonus chip:
if (activeFeatRecord?.classFeatId) {
  chosenFeats.push({
    featId: activeFeatRecord.classFeatId,
    label: findLabel(activeFeatRecord.classFeatId),
    slotKind: 'class-bonus',
    slotIndex: 0,
  });
}

// NEW block — race-bonus chip (insert AFTER class-bonus, BEFORE general primary).
// Convention per RESEARCH § Pattern 3:
//   race-bonus chip's slotIndex=0 maps to bonusGeneralFeatIds[0]
//   → store mutator addresses as slotIndex=1 (clearGeneralFeat(level, 1)).
if (
  budget.featSlots.raceBonus > 0 &&
  activeFeatRecord?.bonusGeneralFeatIds[0]
) {
  chosenFeats.push({
    featId: activeFeatRecord.bonusGeneralFeatIds[0],
    label: findLabel(activeFeatRecord.bonusGeneralFeatIds[0]),
    slotKind: 'race-bonus',
    slotIndex: 0,
  });
}

// EXISTING block 2 — general primary chip @L1246-1253: KEEP AS-IS.
// EXISTING block 3 — bonus-general loop @L1254-1261: ADJUST loop bound.
//   When budget.featSlots.raceBonus > 0, skip index 0 (it's now the race-bonus
//   chip). Iterate from index 1 onward to avoid double-rendering.
(activeFeatRecord?.bonusGeneralFeatIds ?? []).forEach((id, idx) => {
  if (budget.featSlots.raceBonus > 0 && idx === 0) return;   // ← skip; already rendered
  chosenFeats.push({
    featId: id,
    label: findLabel(id),
    slotKind: 'general',
    slotIndex: idx + 1,
  });
});
```

**`determineFeatSlots` call-site migration (lines 1067-1072 + 1333-1338):** Both call sites already have `buildState` computed locally; thread it through:
```typescript
// Current (line 1067):
const featSlots = determineFeatSlots(
  activeLevel,
  classId,
  classLevelInClass,
  compiledFeatCatalog.classFeatLists,
);
// New:
const featSlots = determineFeatSlots(
  buildState,                           // already computed @L1060
  compiledFeatCatalog.classFeatLists,
  compiledClassCatalog.classes.find((c) => c.id === classId) ?? null,
);
```
The `buildState` literal at `computeBuildStateAtLevel` (line 295) MUST set `raceId: foundationState.raceId` and `activeClassIdAtLevel: classId` (resolved from `progressionState.levels.find((r) => r.level === level)?.classId ?? null`).

---

### `apps/planner/src/features/feats/feat-board.tsx` (component, event-driven)

**Analog:** self — extend the `onDeselect` discriminator @L138-156.

**Current `onDeselect` (lines 138-156)** — three-block extension:
```typescript
onDeselect={(entry) => {
  if (entry.slotKind === 'class-bonus') {
    clearClassFeat(activeLevel, entry.slotIndex);
  } else if (entry.slotKind === 'race-bonus') {
    // race-bonus chip's slotIndex=0 → store's bonusGeneralFeatIds[0]
    // → store mutator addresses as slotIndex=1 (per CONTEXT D-07).
    clearGeneralFeat(activeLevel, 1);
  } else {
    // general
    clearGeneralFeat(activeLevel, entry.slotIndex);
  }
  setIsEditingCompleted(true);
}}
```

**Why slotIndex=1 (not 0):** the existing `clearGeneralFeat` mutator (`store.ts:107-122`) addresses:
- `slotIndex === 0` → clear `generalFeatId` (the L1 general primary).
- `slotIndex >= 1` → clear `bonusGeneralFeatIds[slotIndex - 1]`.

So race-bonus chip → `bonusGeneralFeatIds[0]` → mutator slotIndex=1.

**No new imports** — `clearClassFeat` + `clearGeneralFeat` already destructured from store.

---

### `apps/planner/src/features/feats/feat-summary-card.tsx` (component, request-response)

**Analog:** self — the existing `data-slot-kind={feat.slotKind}` attribute @L42 already supports any value of `FeatSlotKind`. **Zero JSX changes** required as long as `FeatSlotKind` widens at the type-source (selectors.ts).

**Existing rendering pattern to keep stable (lines 39-56):**
```typescript
{chosenFeats.map((feat) => (
  <li
    className="feat-summary-card__item"
    data-slot-kind={feat.slotKind}             // ← receives 'race-bonus' transparently
    data-slot-index={feat.slotIndex}
    key={`${feat.slotKind}:${feat.slotIndex}:${feat.featId}`}
  >
    <span className="feat-summary-card__label">{feat.label}</span>
    <button
      aria-label={`${shellCopyEs.feats.deselectChipAriaLabel}: ${feat.label}`}
      data-testid={`deselect-chip-${feat.slotKind}-${feat.slotIndex}`}
      onClick={() => onDeselect(feat)}
      type="button"
    >
      ×
    </button>
  </li>
))}
```
**E2E selector contract:** new `data-slot-kind="race-bonus"` + `data-testid="deselect-chip-race-bonus-0"` selectors are now reachable from RTL queries.

**Optional CSS hook** (per RESEARCH § Plan 16-02 scope): `.feat-summary-card__item[data-slot-kind="race-bonus"]` if visual differentiation is wanted. Not required for FEAT-06 acceptance.

---

### `apps/planner/src/features/feats/store.ts` (store, CRUD) — **NO CHANGES per D-07**

**Analog:** self — confirm existing `clearGeneralFeat` mutator @L107-122 handles `slotIndex=1` correctly:
```typescript
clearGeneralFeat: (level, slotIndex = 0) =>
  set((state) => ({
    lastEditedLevel: level,
    levels: state.levels.map((r) =>
      r.level === level
        ? slotIndex === 0
          ? { ...r, generalFeatId: null }
          : {
              ...r,
              bonusGeneralFeatIds: r.bonusGeneralFeatIds.filter(
                (_, index) => index !== slotIndex - 1,
              ),
            }
        : r,
    ),
  })),
```
**Verified:** the `slotIndex >= 1` branch already filters by `index !== slotIndex - 1` — exactly what race-bonus deselect needs. **D-07 confirmed: no store mutator changes.**

The `setGeneralFeat` mutator @L150-167 has the symmetric `slotIndex - 1` write addressing — race-bonus picks land in `bonusGeneralFeatIds[0]` via `setGeneralFeat(level, featId, 1)`.

---

### `apps/planner/src/lib/copy/es.ts` (i18n, static)

**Analog:** self — the `shellCopyEs.feats` namespace @L287-369. New keys added in alphabetical-ish position (the file leans toward grouping rather than strict alphabetical, so insert near `slotStatusEmpty` @L329 with a Phase 16 marker comment).

**Existing nearby copy keys (lines 287-329)** — pattern to follow:
```typescript
feats: {
  classFeatStepTitle: 'Dote de clase',
  classFeatConfirm: 'Confirmar dote de clase',
  // ...
  generalFeatStepTitle: 'Dote general',
  generalFeatConfirm: 'Confirmar dote general',
  // ...
  generalFeatBonusStepTitleTemplate: 'Dote general {N}',
  // ...
  slotStatusCurrent: 'Ahora',
  slotStatusPending: 'Pendiente',
  slotStatusChosen: 'Elegida',
  slotStatusEmpty: 'Sin elegir',
}
```

**New keys to add** (per RESEARCH § Code Examples 4):
```typescript
// Phase 16-02 (FEAT-06, D-04, D-06) — race-bonus feat slot copy.
// Used by selectFeatBoardView::buildSlotStatuses + the new "Dote racial"
// section heading in feat-board.tsx.
raceBonusStepTitle: 'Dote racial',
raceBonusSectionTitleHumano: 'Dote racial: Humano',
raceBonusSectionTitleMedianoFortecor: 'Dote racial: Mediano Fortecor',
// Generic template fallback for future races (kept narrow per CONTEXT D-NO-COPY relaxation):
raceBonusSectionTitleTemplate: 'Dote racial: {raceName}',
```

**Spanish-first invariant:** all new keys land under `shellCopyEs.feats.*` per CONTEXT D-04 + CLAUDE.md "Spanish-first surface". No English fallback strings.

---

### `tests/phase-06/feat-eligibility.spec.ts` + `feat-proficiency.spec.ts` (FIXTURE MIGRATION, ~9 sites)

**Analog:** self — every existing call to `determineFeatSlots(characterLevel, classId, classLevelInClass, classFeatLists)` must migrate to the new 2-3-arg signature.

**Current pattern (lines 27-32, 38-43, 49-54, 61-66, 73-78, 87-92, 100-105, 113-118)** — ~9 invocations:
```typescript
const slots = determineFeatSlots(
  1,                                           // characterLevel
  'class:fighter',                             // classId
  1,                                           // classLevelInClass
  compiledFeatCatalog.classFeatLists,
);
```

**Migration target:**
```typescript
const slots = determineFeatSlots(
  createBuildState({
    characterLevel: 1,
    classLevels: { 'class:fighter': 1 },
    raceId: null,                              // explicit null = non-Humano = no race bonus
    activeClassIdAtLevel: 'class:fighter',
  }),
  compiledFeatCatalog.classFeatLists,
  /* compiledClass: omit; legacy fallback applies */
);
```

**Helper to extend at the top of the file** (`createBuildState` already exists @L1-23; just add the two new fields with sensible defaults):
```typescript
function createBuildState(overrides: Partial<BuildStateAtLevel> = {}): BuildStateAtLevel {
  return {
    abilityScores: {},
    bab: 0,
    characterLevel: 1,
    classLevels: {},
    fortitudeSave: 0,
    selectedFeatIds: new Set(),
    skillRanks: {},
    raceId: null,                       // NEW default
    activeClassIdAtLevel: null,         // NEW default
    ...overrides,
  };
}
```

**Mechanical sweep — 9 sites** (per RESEARCH § Pattern 2 Migration Sites):
- Lines 27, 38, 49, 61 (loop), 73, 87, 100 (loop), 113 (loop) of `feat-eligibility.spec.ts`.
- Plus all `determineFeatSlots(...)` calls in `feat-proficiency.spec.ts` (verify count via `Grep determineFeatSlots tests/phase-06/feat-proficiency.spec.ts`).

---

### `tests/phase-16/determine-feat-slots-race-aware.spec.ts` — **NEW**

**Analog:** `tests/phase-06/feat-eligibility.spec.ts` (build-state factory pattern @L1-23).

**Skeleton:**
```typescript
import { describe, expect, it } from 'vitest';
import {
  determineFeatSlots,
  type BuildStateAtLevel,
} from '@rules-engine/feats/feat-eligibility';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledClassCatalog } from '@planner/data/compiled-classes';

function buildL1(raceId: string | null, classId: string): BuildStateAtLevel {
  return {
    abilityScores: { str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
    bab: 1,
    characterLevel: 1,
    classLevels: { [classId]: 1 },
    fortitudeSave: 0,
    selectedFeatIds: new Set(),
    skillRanks: {},
    raceId,
    activeClassIdAtLevel: classId,
  };
}

describe('Phase 16-02 — race-aware determineFeatSlots (D-03 + D-06)', () => {
  it('Humano L1 Guerrero: raceBonusFeatSlot = true', () => {
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter')!;
    const slots = determineFeatSlots(
      buildL1('race:human', 'class:fighter'),
      compiledFeatCatalog.classFeatLists,
      fighter,
    );
    expect(slots.raceBonusFeatSlot).toBe(true);
    expect(slots.classBonusFeatSlot).toBe(true);   // Guerrero L1 cadence
    expect(slots.generalFeatSlot).toBe(true);      // Char L1 cadence
  });

  it('Mediano Fortecor L1 Guerrero: raceBonusFeatSlot = true (D-06 expansion)', () => { /* ... */ });
  it('Elfo L1 Guerrero: raceBonusFeatSlot = false', () => { /* ... */ });
  it('Humano L2 Guerrero: raceBonusFeatSlot = false (only at L1)', () => { /* ... */ });
  it('Humano L1 Brujo: raceBonusFeatSlot = true even with no class-bonus slot', () => { /* ... */ });
});
```

---

### `tests/phase-16/feat-board-race-bonus-section.spec.tsx` — **NEW**

**Analog:** `tests/phase-12.4/feat-selectability-states.spec.tsx` — RTL spec with multi-`it` suite + `setupL1HumanoGuerrero` fixture (lines 1-178 in the analog).

**Conventions to lock (per CONTEXT § Project-specific conventions + Phase 12.8-03 memory):**
- File header: `// @vitest-environment jsdom` (line 1 of analog).
- `import { createElement } from 'react';` then `render(createElement(FeatBoard))` — NEVER JSX. Esbuild does not auto-inject the React runtime in this codebase.
- Every multi-`it` suite needs `afterEach(cleanup)` (line 178 of analog) — without it, prior renders leak into subsequent assertions.
- `beforeEach` resets all four stores: `useLevelProgressionStore.resetProgression`, `useFeatStore.resetFeatSelections`, `useCharacterFoundationStore.resetFoundation`, `useSkillStore.resetSkillAllocations` (lines 168-176 of analog).

**Skeleton (mirror lines 27-77 + 167-211 of the analog):**
```typescript
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { FeatBoard } from '@planner/features/feats/feat-board';
import { useFeatStore } from '@planner/features/feats/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useSkillStore } from '@planner/features/skills/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function setupL1HumanoGuerrero(): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore.getState().setAlignment('alignment:lawful-good' as CanonicalId);
  useLevelProgressionStore.getState().setLevelClassId(1 as ProgressionLevel, 'class:fighter' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
  useFeatStore.getState().setActiveLevel(1 as ProgressionLevel);
}

describe('Phase 16-02 — Dote racial section (D-04)', () => {
  beforeEach(() => {
    cleanup();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useCharacterFoundationStore.getState().resetFoundation();
    useSkillStore.getState().resetSkillAllocations();
  });
  afterEach(() => cleanup());

  it('Humano L1 Guerrero renders three slot status cards: class-bonus, race-bonus, general', () => {
    setupL1HumanoGuerrero();
    render(createElement(FeatBoard));
    expect(document.querySelector('[data-slot-card="class-bonus-0"]')).not.toBeNull();
    expect(document.querySelector('[data-slot-card="race-bonus-0"]')).not.toBeNull();
    expect(document.querySelector('[data-slot-card="general-0"]')).not.toBeNull();
  });

  it('Humano L1 Guerrero with all three feats selected → counter 3/3, summary card collapses', () => {
    setupL1HumanoGuerrero();
    useFeatStore.getState().setClassFeat(1 as ProgressionLevel, 'feat:derribo' as CanonicalId);
    useFeatStore.getState().setGeneralFeat(1 as ProgressionLevel, 'feat:esquiva' as CanonicalId, 0);
    useFeatStore.getState().setGeneralFeat(1 as ProgressionLevel, 'feat:competencia-armas-marciales' as CanonicalId, 1);
    render(createElement(FeatBoard));
    expect(screen.getByText(/Dotes del nivel 1:\s*3\/3/)).toBeInTheDocument();
    expect(document.querySelector('[data-slot-kind="race-bonus"]')).not.toBeNull();
  });
});
```

---

### `tests/phase-16/humano-l1-build-roundtrip.spec.ts` — **NEW** (Plan 16-03)

**Analog:** `tests/phase-08/json-roundtrip.spec.ts:1-13` + `tests/phase-08/hydrate-build-document.spec.ts:52-60` (the `hydrate → project` round-trip pattern).

**Convention (per `tests/phase-08/setup.ts:1-55`):** import `'fake-indexeddb/auto'` (Dexie polyfill) before any store imports; reuse `sampleBuildDocument()` factory.

**Skeleton — two round-trips per CONTEXT D-05 acceptance:**
```typescript
import { beforeEach, describe, it, expect } from 'vitest';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import { hydrateBuildDocument } from '@planner/features/persistence/hydrate-build-document';
import { projectBuildDocument } from '@planner/features/persistence/project-build-document';
import { buildDocumentSchema } from '@planner/features/persistence/build-document-schema';
import { sampleBuildDocument } from '../phase-08/setup';

describe('Phase 16-03 — Humano L1 round-trip (D-05 invariant)', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    useFeatStore.getState().resetFeatSelections();
  });

  it('Elfo Guerrero L1 v1.0 (empty bonusGeneralFeatIds) round-trips byte-identical', () => {
    const original = sampleBuildDocument({ raceId: 'race:elf' });
    // featSelections[0].bonusGeneralFeatIds === [] (default in factory)
    hydrateBuildDocument(original);
    const projected = projectBuildDocument();
    expect(buildDocumentSchema.parse(projected)).toEqual(original);
    expect(JSON.stringify(projected)).toBe(JSON.stringify(original));
  });

  it('Humano Guerrero L1 v1.1 (bonusGeneralFeatIds populated) round-trips byte-identical', () => {
    const original = sampleBuildDocument({
      raceId: 'race:human',
      featSelections: /* override featSelections[0] with bonusGeneralFeatIds: ['feat:weapon-focus-longsword'] */,
    });
    hydrateBuildDocument(original);
    const projected = projectBuildDocument();
    expect(buildDocumentSchema.parse(projected)).toEqual(original);
    expect(JSON.stringify(projected)).toBe(JSON.stringify(original));
  });

  it('schema-version stays at 2 (D-05: no bump)', () => {
    expect(buildDocumentSchema.shape.schemaVersion.value).toBe(2);
  });
});
```

**Per `setup.ts:31-36`:** `featSelections[0].bonusGeneralFeatIds` defaults to `[]` — perfect for the v1.0 case. Override needs to spread-merge the level-1 slot with `bonusGeneralFeatIds: ['feat:weapon-focus-longsword']`.

---

## Shared Patterns

### Pattern S1 — `load2da` resref-resolution (extractor only)

**Source:** `packages/data-extractor/src/assemblers/feat-assembler.ts:148-161`
**Apply to:** any new extractor table reader (Plan 16-01's `parseBonusFeatSchedule`).
**Why centralised:** the nwsync-first-then-base-game fallback chain is canonical across all 5.1 assemblers. Hand-rolling produces drift. Already-imported `parseTwoDa` + `RESTYPE_2DA` mean copying the helper into a sibling assembler is zero-import-churn.

### Pattern S2 — `BuildStateAtLevel` factory in tests

**Source:** `tests/phase-06/feat-eligibility.spec.ts:1-23` (`createBuildState` helper).
**Apply to:** all new `tests/phase-16/*.spec.ts` rules-engine specs + the migrated `tests/phase-06/feat-eligibility.spec.ts`.
**Why:** centralised factory absorbs the two new `raceId` + `activeClassIdAtLevel` fields with sensible defaults — every per-test override stays minimal.

### Pattern S3 — `slotKind` discriminator + `data-slot-kind` E2E selector

**Source:** `apps/planner/src/features/feats/feat-summary-card.tsx:42` (`data-slot-kind={feat.slotKind}`) + `feat-board.tsx:138-156` dispatch + `selectors.ts:1233-1261` projection.
**Apply to:** anywhere a new chip kind is added (Plan 16-02's `'race-bonus'`).
**Why:** Phase 12.8-03 D-06 invariant. The chip rendering is type-driven — widen `FeatSlotKind` and the JSX/CSS hooks resolve transparently.

### Pattern S4 — Spanish-first copy under `shellCopyEs.feats.*`

**Source:** `apps/planner/src/lib/copy/es.ts:287-369`.
**Apply to:** all new section headings + step titles introduced in Plan 16-02.
**Why:** CLAUDE.md "Spanish-first surface" + CONTEXT D-04 explicit relaxation of D-NO-COPY for v1.1.

### Pattern S5 — RTL spec convention (Phase 12.8-03 memory lock)

**Source:** `tests/phase-12.4/feat-selectability-states.spec.tsx:1, 30-31, 168-178`.
**Apply to:** new `tests/phase-16/feat-board-race-bonus-section.spec.tsx` and any future `.spec.tsx` file.
**Hard locks:**
1. `// @vitest-environment jsdom` directive on line 1.
2. `import { createElement } from 'react';` then `render(createElement(Component))` — NEVER JSX. Esbuild here does not auto-inject the React runtime.
3. Every multi-`it` suite has `afterEach(() => cleanup());` plus a `beforeEach` that resets all four stores.

### Pattern S6 — Round-trip equality via Zod parse

**Source:** `tests/phase-08/json-roundtrip.spec.ts:7-13` + `hydrate-build-document.spec.ts:52-60`.
**Apply to:** Plan 16-03's `humano-l1-build-roundtrip.spec.ts`.
**Why:** D-05 byte-identical invariant — assert via both `buildDocumentSchema.parse(projected).toEqual(original)` AND `JSON.stringify(projected) === JSON.stringify(original)` to catch field-ordering drift.

### Pattern S7 — Read compiled-class metadata at the consumer boundary

**Source:** `apps/planner/src/features/feats/selectors.ts:1086-1093` (already iterating `compiledClassCatalog.classes`).
**Apply to:** every call site that newly threads `compiledClass` into `determineFeatSlots`.
**Why:** rules-engine stays framework-agnostic per CLAUDE.md "Prescriptive Shape" — selectors adapt the extractor catalog to the rules-engine signature at the edge, not in the engine.

---

## No Analog Found

(none — every Phase 16 file has a strong in-repo analog)

---

## Metadata

**Analog search scope:**
- `packages/data-extractor/src/{assemblers,contracts,parsers,readers}/`
- `packages/rules-engine/src/{feats,progression,contracts}/`
- `apps/planner/src/{features/feats,features/persistence,lib/copy,data}/`
- `tests/phase-{06,08,12.4,14}/`

**Files scanned:** 18 (read in full or with targeted offset+limit).
**Pattern extraction date:** 2026-04-26.
**Producer:** GSD pattern-mapper (single-pass; no re-reads; no source edits).
