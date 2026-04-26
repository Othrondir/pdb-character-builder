---
phase: 16-feat-engine-completion
created: 2026-04-26
mode: research
domain: rules-engine + extractor + planner-ui (Spanish-first NWN1 EE / Puerta de Baldur)
---

# Phase 16 — Feat Engine Completion · RESEARCH

**Researched:** 2026-04-26
**Confidence:** HIGH (codebase-grounded; one open variance documented)
**Primary recommendation:** Treat this as **two-and-a-half** atomic plans:
1. Extractor: read `BonusFeatsTable` column from `classes.2da`, parse `cls_bfeat_*.2da`, emit `bonusFeatSchedule: number[] | null` on `compiledClassSchema` (FEAT-05, **D-01**).
2. Rules-engine + UI: thread `BuildStateAtLevel` through `determineFeatSlots`, recognise `bonusFeatSchedule` field, and surface the Humano L1 third slot under a dedicated `slotKind: 'race-bonus'` UI section (FEAT-06, **D-03 + D-04**).
3. Half-plan: regression spec proving v1.0-shaped JSON build round-trips unchanged (**D-05**).

The store shape (D-02) and persistence schema (D-05) need ZERO code change — current `bonusGeneralFeatIds: CanonicalId[]` already supports an arbitrary-length race-bonus pool and is already round-tripped through `bonusGeneralFeatIds.entries()` in `hydrate-build-document.ts:95`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Schedule data origin:** Extractor emits per-class `bonusFeatSchedule: number[] | null` on `CompiledClass`. Runtime falls back to `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` (renamed) when the compiled value is `null`. Extractor-derived takes precedence per-class.
- **D-02 — Humano L1 store shape:** Reuse existing `bonusGeneralFeatIds: CanonicalId[]`. No `schemaVersion` bump. Capacity is dynamic — Humano L1 holds at most 1 race-bonus entry; non-Humano levels stay `[]`.
- **D-03 — Race-aware signature:** Replace `determineFeatSlots(characterLevel, classId, classLevelInClass, classFeatLists)` with `determineFeatSlots(buildState: BuildStateAtLevel, classFeatLists)`. `BuildStateAtLevel` carries `raceId` + level + class info.
- **D-04 — UI surface:** Dedicated "Dote racial" section between class-bonus and general slots in `feat-board.tsx` + `feat-summary-card.tsx`. New `slotKind: 'race-bonus'` branch on `FeatSummaryChosenEntry`.
- **D-05 — Backward compat:** No schema version bump. v1.0-shaped JSON saves load identically into v1.1.

### Claude's Discretion

- Exact boundary between extractor plan and runtime-consumer plan (recommended split below).
- Whether `BuildStateAtLevel` gains a new `raceId: string | null` field or threads `foundationState.raceId` via a separate input wrapper.
- Test fixture race choices for negative-result lockdown (Elfo vs Enano vs Mediano — pick whichever already has fixture support).

### Deferred Ideas (OUT OF SCOPE)

- Subrace-driven feat bonuses.
- Per-feat exclusion lists per race (e.g., Drow restrictions).
- Bonus-feat schedule migration for prestige classes not in `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` — covered by D-01 fallback path; no proactive enrichment.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEAT-05 | Catálogo extraído surfaces bonus-feat schedules per class (`cls_bfeat_*.2da`); `feat-eligibility.ts` consumes contract sin TODOs (cierra Phase 06 L100 TODO). | `## 2DA Schema Reference`, `## Architecture Patterns` (extractor changes), `## Plan Decomposition Hints` Plan 1. |
| FEAT-06 | Humano L1 ofrece la dote bonus extra del servidor — store capacity 2→3 *signaled*, `<LevelEditorActionBar>` resuelve `legal` cuando los 3 slots están llenos (cierra Phase 06 L49 TODO + Phase 12.4-07 known limitation). | `## Architecture Patterns` (runtime threading), `## Don't Hand-Roll` (reuse existing `computePerLevelBudget` raceBonus), Plan 2. |
</phase_requirements>

---

## Summary

The phase has **three layers of misalignment** between the current codebase and the locked decisions:

1. **Extractor blind spot.** `class-assembler.ts:188` reads only `FeatsTable` from `classes.2da` and ignores `BonusFeatsTable`. The Puerta `cls_bfeat_*.2da` tables (40 of them present in `.claude/worktrees/.../server-extract/`) are NEVER opened. Their shape is a single `Bonus` column whose row index IS the class level — drastically simpler than the per-pool `cls_feat_*.2da` already parsed in `feat-assembler.ts`.
2. **Rules-engine signature gap.** `determineFeatSlots` takes 4 positional args (`characterLevel, classId, classLevelInClass, classFeatLists`) and has no `raceId` access. The race-bonus math already lives in `computePerLevelBudget` (`per-level-budget.ts:193-194`) — Humano L1 returns `featSlots.total=3` correctly today. The TODO at `feat-eligibility.ts:100` is the only place the engine still pretends races don't exist.
3. **UI labelling gap.** The store, persistence, and selectors ALL already support 3 slots at Humano L1 — the third slot has been functional since Phase 6. What is missing is a dedicated "Dote racial" label in `slotStatuses` + `chosenFeats`, replacing the current "Dote bonus 2" copy that surfaces because `buildSlotStatuses` treats every general-pool slot beyond index 0 as a generic bonus.

**Primary recommendation (single-line):** Add `bonusFeatSchedule` to `compiledClassSchema`, parse `cls_bfeat_*.2da` via the existing `load2da` + `parseTwoDa` primitives, rename the hardcoded map to `LEGACY_CLASS_BONUS_FEAT_SCHEDULES`, refactor `determineFeatSlots` to read from compiled value first then legacy map, then thread `raceId` via the existing `BuildStateAtLevel` shape and emit a new `slotKind: 'race-bonus'` chip projection.

**Confidence breakdown:** HIGH on extractor shape (verified against on-disk Puerta extracts at `.claude/worktrees/agent-a45dc6e9359486571/.planning/phases/05-skills-derived-statistics/server-extract/cls_bfeat_*.2da`); HIGH on runtime threading (5 call sites enumerated below); MEDIUM on Humano-only race scope (one Puerta-custom race description matches the bonus pattern — see Pitfall 4).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Read `cls_bfeat_*.2da` from nwsync | Extractor (Node CLI) | — | Build-time only. `BaseGameReader` + `NwsyncReader` + `parseTwoDa` already cover this; no runtime access to 2DA. |
| Schema field `bonusFeatSchedule` | Extractor contract (`compiledClassSchema`) | Rules-engine reads it | Schema lives next to existing `featTableRef` in `packages/data-extractor/src/contracts/class-catalog.ts`. |
| Hardcoded fallback map | Rules-engine | — | Keep where it lives today (`feat-eligibility.ts`); only behaviour change is the lookup order: compiled > legacy. |
| `determineFeatSlots` race awareness | Rules-engine | — | Pure function; receives `BuildStateAtLevel` which already carries everything. |
| `raceId` injection into `BuildStateAtLevel` | Already in `computeBuildStateAtLevel` (planner adapter)? | — | **NO** — `BuildStateAtLevel` does NOT carry `raceId` today. Adding it is a small contract extension touching `feat-prerequisite.ts:13-28`. (See Pitfall 1.) |
| Race-bonus slot label "Dote racial" | Planner UI selector + copy | feat-board.tsx + feat-summary-card.tsx | `selectFeatBoardView.buildSlotStatuses` + `chosenFeats` projection — the existing `slotKind` discriminator extends with `'race-bonus'`. |
| Persistence | Already correct | — | `hydrate-build-document.ts:87-98` + `project-build-document.ts:125-130` already iterate `bonusGeneralFeatIds[]` with no fixed cap. |

---

## Standard Stack

### Core (already installed — D-NO-DEPS holds)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.2 | Strict typing for new `bonusFeatSchedule` field + `BuildStateAtLevel` extension | Phase 1 invariant: branded canonical IDs + Zod schemas |
| Zod | 4.3.5 | Validate new optional/nullable schema field | Already used at every catalog boundary |
| Vitest | 4.0.16 | Test the new path (extractor unit + rules-engine unit + RTL integration) | Phase 12.x convention |
| `better-sqlite3` | 12.2.0 | nwsync metadata access at extract time | Already in `NwsyncReader` |
| `fzstd` | 0.8.2 (pure JS) | zstd decompression for nwsync resources | Already in 5.1 pipeline |
| Hand-written 2DA V2.0 parser | `packages/data-extractor/src/parsers/two-da-parser.ts` | Parse `cls_bfeat_*.2da` rows | **Reuse `parseTwoDa(buf.toString('utf-8'))` directly** — no new parser needed |

**Version verification (npm registry, 2026-04-26):** Versions in `package.json:39-44` match phase 12.x baseline. No version bumps required for this phase. `[VERIFIED: package.json L39-44 + corepack pnpm@10]`

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `parseTwoDa(buf.toString('utf-8'))` | New typed schema parser for single-column tables | Trivial gain; existing parser already returns `Map<rowIndex, Record<col, string>>` which is sufficient. Adds D-NO-DEPS pressure for nothing. |
| Extend `BuildStateAtLevel` with `raceId` | Pass `raceId` as separate arg on `determineFeatSlots` | D-03 explicitly chose `BuildStateAtLevel`-threading. Single point of truth, future extensibility (subrace, race-restricted feat lists). |
| Schema version bump on `compiledClassSchema` | Optional + nullable field (12.4-08 precedent — `parameterizedFeatFamily`) | Plan 12.4-08 SPEC R7 already established the optional+nullable convention for additive class-shape fields. Reproduce it byte-for-byte. |

---

## Architecture Patterns

### System Architecture Diagram

```
                              ┌────────────────────────────┐
nwsync                        │  classes.2da               │
(SQLite + zstd)──────read────▶│  • Label                   │
                              │  • FeatsTable    (existing)│
                              │  • BonusFeatsTable (NEW!!) │  ──┐
                              └────────────────────────────┘    │
                                                                │ resref
                                                                ▼
                              ┌────────────────────────────┐
                              │  cls_bfeat_<resref>.2da    │
                              │  Single col: Bonus         │
                              │  Row idx = class level     │
                              │  Cell value: 0 | 1         │
                              └──────────┬─────────────────┘
                                         │ parse
                                         ▼
       ┌─────────────────────────────────────────────────────┐
       │  class-assembler.ts                                  │
       │    NEW step: parseBonusFeatSchedule(resref)          │
       │    → number[] | null  (e.g. [1,2,4,6,8,10,12,14,16]) │
       └──────────────────────┬──────────────────────────────┘
                              │ emits compiledClass
                              ▼
       ┌──────────────────────────────────────────────────────┐
       │  compiled-classes.ts                                 │
       │    bonusFeatSchedule: number[] | null on each class  │
       └──────────────────────┬───────────────────────────────┘
                              │ runtime read
                              ▼
       ┌──────────────────────────────────────────────────────┐
       │  feat-eligibility.ts::determineFeatSlots             │
       │    1. Look up class.bonusFeatSchedule (compiled)     │
       │    2. If null, fallback to LEGACY_CLASS_BONUS_FEAT_SCHEDULES │
       │    3. raceId === 'race:human' && level===1 ? +raceBonusSlot │
       │    4. Return { classBonusFeatSlot, generalFeatSlot,  │
       │                raceBonusFeatSlot, autoGrantedFeatIds }│
       └────┬────────────────────────────────┬────────────────┘
            │                                │
            ▼                                ▼
   ┌────────────────────┐         ┌──────────────────────────┐
   │ per-level-budget.ts│         │ selectors.ts             │
   │ (already correct)  │         │ buildSlotStatuses adds   │
   │  raceBonus already │         │ slotKind:'race-bonus'    │
   │  computed          │         │ when raceBonusFeatSlot=t │
   └────────────────────┘         └─────────┬────────────────┘
                                            │
                                            ▼
                                 ┌──────────────────────────┐
                                 │ feat-board.tsx +         │
                                 │ feat-summary-card.tsx    │
                                 │ • New section heading    │
                                 │   "Dote racial: Humano"  │
                                 │ • Chip data-slot-kind=   │
                                 │   "race-bonus"           │
                                 └──────────────────────────┘
```

### Recommended Project Structure (additive only)

```
packages/data-extractor/
└── src/
    ├── contracts/
    │   └── class-catalog.ts              ← ADD bonusFeatSchedule field
    └── assemblers/
        └── class-assembler.ts            ← READ BonusFeatsTable + parse cls_bfeat
                                             (~30 lines added; mirrors feat-assembler 195-272)

packages/rules-engine/
└── src/feats/
    ├── feat-eligibility.ts               ← rename schedule map; refactor determineFeatSlots
    └── feat-prerequisite.ts              ← ADD raceId to BuildStateAtLevel

apps/planner/
└── src/
    ├── features/
    │   ├── feats/
    │   │   ├── selectors.ts              ← extend buildSlotStatuses + chosenFeats
    │   │   ├── feat-board.tsx            ← onDeselect dispatch handles 'race-bonus'
    │   │   ├── feat-summary-card.tsx     ← chip data-slot-kind="race-bonus"
    │   │   └── feat-sheet.tsx            ← section heading per slotKind
    │   ├── level-progression/
    │   │   └── prestige-gate-build.ts    ← migrate determineFeatSlots call (1 site)
    │   └── persistence/
    │       └── (NO CHANGES — already iterates bonusGeneralFeatIds.entries())
    ├── data/
    │   └── compiled-classes.ts           ← regenerated (extractor output)
    └── lib/copy/es.ts                    ← NEW key: shellCopyEs.feats.raceBonusSection*
                                             (Humano-flavoured)

tests/phase-16/
├── bonus-feat-schedule-extractor.spec.ts  ← Extractor unit (HUGE)
├── determine-feat-slots-race-aware.spec.ts ← Rules-engine unit (race threading)
├── feat-board-race-bonus-section.spec.tsx ← UI integration (jsdom)
└── humano-l1-build-roundtrip.spec.ts      ← D-05 regression
```

### Pattern 1: Composable single-column 2DA reader (mirror `feat-assembler.ts:148-161`)

**What:** Reuse the existing `load2da` helper-pattern that tries nwsync first, then BIF.
**When to use:** Any per-class schedule table parse (cls_bfeat is the canonical example, but cls_skill_*, cls_spgn_* follow same shape).
**Example:**

```typescript
// Source: existing pattern at packages/data-extractor/src/assemblers/feat-assembler.ts:148-161
function load2da(
  resref: string,
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
): TwoDaTable | null {
  const buf = nwsyncReader.getResource(resref, RESTYPE_2DA);
  if (buf) return parseTwoDa(buf.toString('utf-8'));
  const baseBuf = baseGameReader.getResource(resref, RESTYPE_2DA);
  if (baseBuf) return parseTwoDa(baseBuf.toString('utf-8'));
  return null;
}

// New helper to add to class-assembler.ts:
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
    // Single 'Bonus' column; cell '1' = bonus feat slot at this class level.
    if (row.Bonus === '1' && rowIndex >= 1 && rowIndex <= 20) {
      schedule.push(rowIndex);
    }
  }
  // Returning [] (empty array) is meaningful — "extractor read the table and
  // confirmed zero bonus feats in 1-20". Distinct from null (= unknown).
  return schedule;
}
```

### Pattern 2: Race-aware `determineFeatSlots` (D-03)

**What:** Replace 4-arg signature with `(buildState, classFeatLists)`. Add `raceId` to `BuildStateAtLevel`.

**Migration sites (5 call sites):**

| Caller | File:Line | Migration cost |
|--------|-----------|----------------|
| `computePerLevelBudget` | `packages/rules-engine/src/progression/per-level-budget.ts:184` | Construct minimal `BuildStateAtLevel` from `BuildSnapshot` — only needs `raceId`, `characterLevel`, `classLevels`. (Other fields can be defaulted/zero since `determineFeatSlots` only reads those three from the new contract.) |
| `selectFeatBoardView` | `apps/planner/src/features/feats/selectors.ts:1067` | Already calls `computeBuildStateAtLevel(...)` at line 1060; just thread `buildState` instead of separate args. |
| `selectFeatSheetTabView` | `apps/planner/src/features/feats/selectors.ts:1333` (used to pull `autoGrantedFeatIds`) | Same — thread `buildState` already computed at line 1324. |
| `computeBuildStateAtLevel` (auto-grant collection loop) | `apps/planner/src/features/feats/selectors.ts:355` | Recursive call inside the auto-grant loop — needs a temp `BuildStateAtLevel` for each prior level. Refactor to thread the loop's per-level `BuildStateAtLevel` snapshot. |
| `prestige-gate-build.ts::collectFeatIdsFromPriorLevels` | `apps/planner/src/features/level-progression/prestige-gate-build.ts:256` | Same per-level loop pattern. |

Plus 9 test fixture sites in `tests/phase-06/feat-eligibility.spec.ts` (call signatures only — fixtures construct `BuildStateAtLevel` already in tests/phase-12.4 specs, mirror that pattern).

**Example refactored signature:**

```typescript
// packages/rules-engine/src/feats/feat-eligibility.ts (new shape)
export function determineFeatSlots(
  buildState: BuildStateAtLevel,
  classFeatLists: FeatCatalog['classFeatLists'],
  bonusFeatSchedule?: number[] | null,  // NEW: from CompiledClass.bonusFeatSchedule
): FeatSlotsAtLevel {
  const characterLevel = buildState.characterLevel;
  const classId = (() => {
    // Resolve active class from classLevels — caller's responsibility to pass
    // a buildState whose classLevels.{classId}===classLevelInClass for the
    // level being evaluated.  Pull from BuildSnapshot/progression upstream.
    return buildState.activeClassIdAtLevel ?? null;  // see field addition below
  })();
  // ...
  const raceBonusFeatSlot =
    buildState.raceId === HUMAN_RACE_ID && characterLevel === 1;
  // ...
  return { classBonusFeatSlot, generalFeatSlot, raceBonusFeatSlot, autoGrantedFeatIds };
}
```

**HUMAN_RACE_ID alignment:** The constant already lives at `per-level-budget.ts:71` as `'race:human'`. `feat-eligibility.ts` should `import { HUMAN_RACE_ID } from '../progression/per-level-budget'` (or hoist to a shared `progression/race-constants.ts` if circular-dep concerns surface — `per-level-budget.ts` already imports from `feats/feat-eligibility` so circular is real; hoist to a third file).

### Pattern 3: New `slotKind` discriminator branch (D-04)

The chip projection at `selectors.ts:1233-1261` walks the store record. Extend with:

```typescript
// Phase 12.8-03 D-06 chip projection extends with raceBonus slotIndex sentinel.
// Convention: slotKind='race-bonus' uses slotIndex=0..N referring to bonusGeneralFeatIds[N]
// when budget.featSlots.raceBonus > 0.  General slots beyond index 0 stay slotKind='general'
// only when raceBonus===0 — i.e. multiclass swashbuckler granting an extra general bonus
// stays general, but Humano L1 first bonusGeneralFeatIds[0] flips to race-bonus.
//
// The discriminator is computed from buildState.raceId + level (race-bonus only at L1 Humano)
// not from slot index alone.
if (activeFeatRecord?.bonusGeneralFeatIds[0] && budget.featSlots.raceBonus > 0) {
  chosenFeats.push({
    featId: activeFeatRecord.bonusGeneralFeatIds[0],
    label: findLabel(activeFeatRecord.bonusGeneralFeatIds[0]),
    slotKind: 'race-bonus',
    slotIndex: 0,
  });
}
```

`FeatSummaryChosenEntry.slotKind` union widens from `'class-bonus' | 'general'` (current at `selectors.ts:208`) to `'class-bonus' | 'general' | 'race-bonus'`. The `onDeselect` callback in `feat-board.tsx:138-156` gains a third branch — race-bonus dispatches `clearGeneralFeat(activeLevel, slotIndex + 1)` (slotIndex+1 because raceBonus chip's slotIndex=0 maps to `bonusGeneralFeatIds[0]` which the store mutator addresses as slotIndex=1).

### Anti-Patterns to Avoid

- **Hand-rolling a single-column 2DA parser.** `parseTwoDa(buf.toString('utf-8'))` already returns the right shape. The existing parser handles `2DA V2.0\n\n   Bonus  \n` whitespace variance (verified against on-disk samples — see `## Code Examples` below).
- **Dropping the LEGACY_CLASS_BONUS_FEAT_SCHEDULES map.** D-01 explicitly preserves the 6-entry hardcoded map as a per-class fallback. The 6 entries are battle-tested against Phase 12.4 fixture suites (Guerrero L1/L2/L4/.../L16, Mago L1/L5/L10/L15, Pícaro L10/L13/L16, Monje L1/L2/L6) — removing them before extractor coverage is verified would regress those green paths.
- **Treating `cls_bfeat_*.2da` row-0 as class L0.** Phase 5.1's existing extractors normalize "row index = class level" with NO off-by-one (see `feat-assembler.ts:264` — `grantedOnLevel != null && grantedOnLevel > 0`). Apply the same `> 0` guard.
- **Over-eager extension of HUMAN_RACE_ID.** The `mediano-fortecor` race description (`compiled-races.ts:130`) ALSO contains "Aprendizaje rápido: Ganan 1 dote adicional a 1.er nivel" but this is a Puerta-CUSTOM race (canonical NWN1 Halfling does NOT grant bonus feat at L1). Don't auto-promote to "all races whose description contains the marker" — see Pitfall 4.
- **Adding a new test directory under `tests/phase-12.4/` or `tests/phase-15/`.** Use `tests/phase-16/` for new specs. The vitest config glob already picks up new dirs (`tests/phase-*/` pattern at `vitest.config.ts`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 2DA parsing | Hand-rolled Bonus-column parser | `parseTwoDa(buf.toString('utf-8'))` from `packages/data-extractor/src/parsers/two-da-parser.ts` | Existing parser handles whitespace variance (multi-space columns, trailing whitespace, blank lines) verified against on-disk Puerta extracts. |
| nwsync resource lookup | Direct SQLite query | `nwsyncReader.getResource(resref, RESTYPE_2DA)` | Prepared SQL statements scoped to `PUERTA_MANIFEST_SHA1`; falls back to base-game BIF via `baseGameReader.getResource`. |
| Race-bonus computation | New rules-engine helper | `computePerLevelBudget` (`per-level-budget.ts:193-194`) already returns `featSlots.raceBonus` correctly | Don't duplicate the `HUMAN_RACE_ID && level === 1` predicate — it's already canon-cited and locked by the Phase 12.4-03 fixture spec. |
| Persistence/serialization changes | Schema bump or new `featSelections` field | Existing `bonusGeneralFeatIds: z.array(canonicalId)` at `build-document-schema.ts:86` | Already supports any-length array; hydrate-build-document.ts:95 already iterates `bonusGeneralFeatIds.entries()`. **Zero migration work.** |
| Slot-counter math | New chosen/total computation | `budget.featSlots.{chosen,total}` already covers the 3-slot Humano L1 case | Phase 12.4-07 D-04 locked this; collapse-on-complete predicate at `feat-board.tsx:118-121` already triggers correctly when `chosen >= slots`. |
| Class-Bonus signal coalescence | Custom merge of compiled vs legacy schedule | `compiled?.bonusFeatSchedule ?? LEGACY_CLASS_BONUS_FEAT_SCHEDULES[classId]` | Two-line nullish-coalesce. The fallback path is the original 6-entry hardcoded map verbatim. |

**Key insight:** The codebase has already done 90% of the work for FEAT-06. The Phase 12.4-07 SUMMARY's "known limitation" was written before the `budget.featSlots.raceBonus` cleanup — re-reading the current `selectors.ts:1120` (`generalSlotCount = budget.featSlots.general + budget.featSlots.raceBonus`) and the persistence `bonusGeneralFeatIds.entries()` round-trip shows the only ACTUAL gap is the slot-label copy + onDeselect dispatch. The "store cap 2→3" framing in REQUIREMENTS.md FEAT-06 is misleading: the store ALREADY holds 3 entries; what's missing is the UI + selectors discriminating the third entry as a race bonus.

---

## 2DA Schema Reference

### `classes.2da` (existing — used by `class-assembler.ts`)

```
Header columns (positions 1-20+):
  Label, Name, Plural, Lower, Description, Icon, HitDie, AttackBonusTable,
  FeatsTable, SavingThrowTable, SkillsTable, BonusFeatsTable, SkillPointBase,
  SpellGainTable, SpellKnownTable, PlayerClass, SpellCaster, ...

Source: [VERIFIED: .claude/worktrees/agent-a45dc6e9359486571/.planning/phases/05-skills-derived-statistics/server-extract/classes.2da line 3]
```

**Existing read:** `class-assembler.ts:188` — `const featTableRef = row.FeatsTable ?? null;`
**NEW read needed:** `const bonusFeatsTableRef = row.BonusFeatsTable ?? null;`

Sample fighter row (row index 4, Label `Fighter`):
```
4 Fighter ... CLS_ATK_1 CLS_FEAT_FIGHT CLS_SAVTHR_FIGHT CLS_SKILL_FIGHT CLS_BFEAT_FIGHT 4 ...
```
Source: [VERIFIED: line 8 of `.claude/worktrees/.../server-extract/classes.2da`]

### `cls_bfeat_*.2da` (NEW for Phase 16)

**Shape:** ONE column, named `Bonus`. Row index = class level. Cell value: `0` (no bonus feat that level) or `1` (grant a bonus feat slot).

```
2DA V2.0

Bonus
0 0
1 0          ← class L1: no bonus
2 0
3 0
4 0
5 0
6 0
7 1          ← class L7: bonus feat slot   (Puerta rogue)
8 0
9 0
10 1         ← class L10: bonus feat slot
11 0
12 0
13 1         ← class L13: bonus feat slot
14 0
15 1         ← class L15: bonus feat slot   (Puerta-only; vanilla NWN1 has L16 not L15)
16 0
17 1         ← class L17: bonus feat slot
18 0
19 1
20 0
21 0
...up to L40
```
Source: [VERIFIED: full file content of `.claude/worktrees/agent-a45dc6e9359486571/.planning/phases/05-skills-derived-statistics/server-extract/cls_bfeat_rog.2da`]

**Other observed schedules from Puerta extracts:**

| File | L1-L20 schedule (Bonus=1 levels) | Notes |
|------|----------------------------------|-------|
| `cls_bfeat_rog.2da` | 7, 10, 13, 15, 17, 19 | Puerta-CUSTOM (vanilla NWN1: 10, 13, 16, 19) |
| `cls_bfeat_rang.2da` | 1, 2, 4, 9, 14, 19 | Puerta-CUSTOM (vanilla: usually no bonus before epic; this looks like Puerta has expanded ranger) |
| `cls_bfeat_pal.2da` | 5 | Single bonus at L5 — likely a Puerta-specific fix |
| `cls_bfeat_cler.2da` | 3 | Puerta-CUSTOM (vanilla NWN1 cleric has NO bonus feats) |
| `cls_bfeat_dru.2da` | (none in 1-20) | Druid never grants bonus in canon |
| `cls_bfeat_bard.2da` | 9 | Single Puerta-custom bonus |
| `cls_bfeat_barb.2da` | (none in 1-20; epic-only at 22+) | Vanilla canon |
| `cls_bfeat_war.2da` | 0, 4, 9, 14, 19 | The `war` resref appears to be a special "Warrior" archetype; the L0=1 is suspicious — guard with `rowIndex >= 1`. |

Source: [VERIFIED: head of each file in worktree extract directory]

**Important:** The local worktree extract is INCOMPLETE — it lacks `cls_bfeat_fight.2da`, `cls_bfeat_monk.2da`, `cls_bfeat_wiz.2da` (the three classes most critical to Phase 12.4-03's hardcoded entries). They DO exist in nwsync (referenced from `classes.2da` BonusFeatsTable column for those rows) — a fresh `pnpm extract` run will populate them. Plan 1 (extractor) MUST run a real extract to confirm Fighter's schedule matches `[1,2,4,6,8,10,12,14,16]`. If it diverges, Phase 12.4-03's locked tests will RED-fail and the planner must decide between:
  - (a) accepting the extractor-derived Puerta cadence (preferred; matches D-01 "extractor primary"), OR
  - (b) updating fixture specs to assert the new cadence.

### `racialtypes.2da` (relevant column survey)

Already read by `race-assembler.ts`. Columns surveyed:
- `Label`, `Name`, `Description`, `Appearance`, `Favored`
- Ability adjustments: `StrAdjust`, `DexAdjust`, etc.
- `PlayerRace` filter

**No NWN1 EE column exists for "extra feat at first level" or "extra skill points per level".** These mechanics are encoded SOLELY in TLK description text — Phase 12.4-03's `per-level-budget.ts:60-73` documents this exactly: *"Evidence: `compiled-races.ts` race:human description text says 'Aprendizaje rápido: Ganan 1 dote adicional a 1.er nivel'"*. The current hardcode against `HUMAN_RACE_ID = 'race:human'` is canon-cited but extractor-blind.

Source: [VERIFIED: `packages/rules-engine/src/progression/per-level-budget.ts:60-73`]

**Conclusion for D-03 race scope:** Only `race:human` carries the canonical NWN1 EE +1 dote at L1. The `race:mediano-fortecor` description text matches the same pattern but is a Puerta-custom race — see Pitfall 4 for the deliberate scope decision.

---

## Runtime State Inventory

This is **NOT a rename/refactor phase** — Phase 16 adds new functionality (bonusFeatSchedule field, race-bonus slot UI). Pure additive work.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `bonusGeneralFeatIds: CanonicalId[]` already supports any-length array; v1.0 saves persist `[]` and v1.1 Humano L1 saves persist `[<feat-id>]`. | No data migration. Existing slot data unchanged. |
| Live service config | None — no external services; static SPA. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | `apps/planner/src/data/compiled-classes.ts` — extractor regenerates it on next `pnpm extract` run. | Re-run extractor (mandatory verification step at end of Plan 1). |

---

## Common Pitfalls

### Pitfall 1: `BuildStateAtLevel` does not currently carry `raceId`

**What goes wrong:** D-03 says "thread `BuildStateAtLevel` to `determineFeatSlots`" — but `BuildStateAtLevel` at `feat-prerequisite.ts:13-28` has SIX fields (abilityScores, bab, characterLevel, classLevels, fortitudeSave, selectedFeatIds, skillRanks) — NO `raceId`. The race detection inside the new `determineFeatSlots` branch will read `buildState.raceId` against `undefined`, silently returning `false` for the Humano check.

**Why it happens:** Phase 12.8-02 added `BuildStateAtLevel` extensions for prestige-gate caster-level checks but never threaded race. The TODO at line 100 of feat-eligibility.ts has been there since Phase 6 and was simply left because no caller needed race info before now.

**How to avoid:** Plan 2 MUST extend `BuildStateAtLevel` with `raceId: string | null`. Migration cost: 4 sites (`computeBuildStateAtLevel` in `selectors.ts:301-380`, `prestige-gate-build.ts` build-state computer, the test fixture `createBuildState` helper at `tests/phase-06/feat-eligibility.spec.ts:10-23`, and the inline construction in 4 `tests/phase-12.x/*.spec.ts` files).

**Warning signs:** Test runner reports `slots.raceBonusFeatSlot === false` at L1 Humano Guerrero. The fix: ensure the new spec reads `raceId` from `foundationState.raceId` and threads it through.

### Pitfall 2: `cls_bfeat_*.2da` row 0 ambiguity

**What goes wrong:** Some Puerta tables (e.g., `cls_bfeat_war.2da`) put a `1` at row 0. Treating row 0 as "class L0" would incorrectly grant a bonus feat to a multiclass build at any level (since class-level-in-class is computed as 1 at first dip).

**Why it happens:** NWN engine treats row 0 as a per-class default-state row (similar to how `feat.2da` row 0 is a special sentinel in some custom servers).

**How to avoid:** Filter `rowIndex >= 1 && rowIndex <= 20` in the `parseBonusFeatSchedule` helper. Phase 12.4-09 already imposes the `level <= 16` cap elsewhere; for v1.1 with level 1-20 progression, cap at 20.

**Warning signs:** Multiclass test fixture (e.g., Guerrero L1 + Pícaro L1) reports `classBonusFeatSlot=true` at TWO levels for one class.

### Pitfall 3: Multiclass interaction — each class grants its own schedule independently

**What goes wrong:** Conceptual ambiguity — does "Fighter L1 + Wizard L1" Humano get both Fighter's L1 bonus + Wizard's L1 bonus + Humano L1 race bonus + general L1?

**Resolution (NWN1 EE canon):** YES. Each class's bonus feat schedule is read against `classLevelInClass` (the count of levels in that specific class), NOT the character level. So:

- Multiclass build with Fighter-1 + Wizard-1: Wizard's L1 bonus feat is granted at character level 2 (when the Wizard dip happens). Fighter's L1 bonus feat is granted at character level 1 (when Fighter is taken).
- Each class's `bonusFeatSchedule` array is INDEPENDENTLY consulted via the existing `classLevelInClass` mechanic at `feat-eligibility.ts:111-145`. NO aggregation across classes.
- Humano L1 race bonus is granted at character level 1 REGARDLESS of starting class. `Humano + Wizard L1 + Fighter L2` = race bonus at L1 Wizard (because the L1 character level is the trigger, not the class).

**How to avoid:** Lock test fixtures for: `Humano + Fighter L1` (3 slots), `Humano + Wizard L1` (3 slots: class wizard bonus + general + race), `Elfo + Fighter L1 + Wizard L2` (2 slots at L1, 1 slot at L2). The current Phase 12.4-03 fixture suite already has the non-Humano cases — add the Humano multiclass ones.

**Warning signs:** Humano starting at non-Fighter class shows only 2 slots at L1 (race bonus missed because dispatch keyed off classId).

### Pitfall 4: Puerta-custom race with bonus-feat language (`race:mediano-fortecor`)

**What goes wrong:** Lone `race:mediano-fortecor` (Mediano Fortecor — Stout Halfling subrace promoted to a top-level race in Puerta's racialtypes.2da) carries the EXACT same description text as Humano: *"Aprendizaje rápido: Ganan 1 dote adicional a 1.er nivel."* (compiled-races.ts:130). NWN1 EE canon does NOT give Halflings a bonus feat at L1 — this is a Puerta-server custom rule.

**Why it happens:** The Puerta TLK description was hand-written; the +1 dote rule was likely added to the Mediano Fortecor in a balance pass that was NOT mirrored into a 2DA column. The current `per-level-budget.ts` HUMAN_RACE_ID hardcode silently undercounts Mediano Fortecor's L1 budget.

**How to avoid:** Phase 16 scope (per CONTEXT.md "Deferred Ideas") explicitly defers per-race feat-bonus enrichment beyond Humano. Phase 16 should:
  1. Verify the locked decision: confirm with the user (in plan-checker review) whether `race:mediano-fortecor` should also receive +1 dote at L1, OR whether the description text is decorative.
  2. **Recommendation:** [ASSUMED] keep scope as Humano-only for v1.1, document this race-with-similar-text as a deferred item under `Deferred Ideas`. Tracked via assumption A1 in the Assumptions Log.

**Warning signs:** UAT-2026-04-26 (post-Phase-16 close) reports a Mediano Fortecor build showing 2 slots at L1 — flag for v1.2 scope expansion.

### Pitfall 5: Hardcoded LEGACY map drift vs extractor output

**What goes wrong:** Phase 12.4-03 locked the legacy `CLASS_BONUS_FEAT_SCHEDULES` map at `[10, 13, 16]` for Rogue. Puerta's `cls_bfeat_rog.2da` shows `[7, 10, 13, 15, 17, 19]`. If the extractor lands first and the legacy fallback is consulted second, the Phase 12.4-03 spec suite (`tests/phase-12.4/per-level-budget.fixture.spec.ts`) will RED-fail because `Pícaro L7` will now grant a bonus slot but the fixture asserts `total: 1` (general only) at L7.

**Why it happens:** D-01 explicitly chose extractor-primary. The legacy map is a fallback only. Once the extractor populates `bonusFeatSchedule` for rogue, the runtime ignores the legacy `[10,13,16]` value entirely.

**How to avoid:** Plan 1 (extractor) MUST update the Phase 12.4-03 fixture spec to consume the extractor-derived value, NOT the legacy hardcode. The acceptance criterion: `Pícaro L7` returns `featSlots.classBonus: 1` AFTER the extractor lands. This is not a regression — it's the correct Puerta-canon value, replacing a vanilla-NWN1-derived placeholder.

**Warning signs:** RED test failure pattern: `expected 0 to be 1 at Pícaro L7`. Update fixture, document the schedule diff in Plan 1's SUMMARY.

### Pitfall 6: Feat-board `slotKind` discriminator order

**What goes wrong:** The current `buildSlotStatuses` at `selectors.ts:933-1004` iterates: 1× class-bonus, then N× general. Adding a third kind in the wrong order will break the existing E2E selectors at Phase 12.4-09 (`tests/phase-12.4/level-editor-action-bar-flow.e2e.spec.ts`) that use `[data-slot-kind="general"][data-slot-index="1"]` to find the second general slot at multi-bonus class levels.

**Why it happens:** The discriminator order is implicit in the array iteration — class-bonus first, general N second. Inserting `race-bonus` between them changes the visual + DOM order.

**How to avoid:** Match CONTEXT D-04 verbatim: "dedicated 'Dote racial' section between class-bonus and general slots." Insert the race-bonus push AFTER class-bonus, BEFORE the general loop:

```typescript
// In buildSlotStatuses (selectors.ts ~983):
if (hasClassBonusSlot) {
  pushStatus('class-bonus', 0, ..., selectedClassFeatId);
}

// NEW: race-bonus inserted between class-bonus and general
if (hasRaceBonusSlot) {
  pushStatus('race-bonus', 0, shellCopyEs.feats.raceBonusStepTitle, selectedRaceBonusFeatId);
}

// EXISTING: general loop (decremented by 1 if raceBonus ate one slot)
for (let slotIndex = 0; slotIndex < generalSlotCount; slotIndex += 1) { ... }
```

Race-bonus chip's `slotIndex=0` semantically maps to `bonusGeneralFeatIds[0]`. The general loop iterates `generalSlotCount = budget.featSlots.general + 0` (NOT `+ raceBonus` anymore — race-bonus is its own kind now).

**Warning signs:** Phase 12.8-03 chip-deselect E2E flips red because `data-slot-index="1"` in the general pool no longer maps to bonusGeneralFeatIds[0] (it's now race-bonus).

---

## Code Examples

### Example 1: Extractor — read BonusFeatsTable column

```typescript
// packages/data-extractor/src/assemblers/class-assembler.ts (extend existing assembleClassCatalog)
// Around line 188 — currently:
//   const featTableRef = row.FeatsTable ?? null;
// ADD:
const bonusFeatsTableRef = row.BonusFeatsTable ?? null;

// And at the row.push call (line 200-218), add:
classes.push({
  attackBonusProgression,
  bonusFeatSchedule: parseBonusFeatSchedule(   // NEW
    bonusFeatsTableRef,
    nwsyncReader,
    baseGameReader,
    warnings,
    label,
  ),
  description: resolvedDesc,
  featTableRef,
  hitDie: hitDie > 0 ? hitDie : 4,
  id,
  // ... rest unchanged
});
```

Source: [VERIFIED: existing pattern at `packages/data-extractor/src/assemblers/class-assembler.ts:188-218`]

### Example 2: Runtime — race-aware `determineFeatSlots`

```typescript
// packages/rules-engine/src/feats/feat-eligibility.ts (refactored)
import type { CompiledClass } from '@data-extractor/contracts/class-catalog';
import { HUMAN_RACE_ID } from '../progression/race-constants';  // hoisted from per-level-budget.ts

const LEGACY_CLASS_BONUS_FEAT_SCHEDULES: Record<string, number[]> = {
  // unchanged from current CLASS_BONUS_FEAT_SCHEDULES (6 entries)
};

export interface FeatSlotsAtLevel {
  classBonusFeatSlot: boolean;
  generalFeatSlot: boolean;
  raceBonusFeatSlot: boolean;        // NEW
  autoGrantedFeatIds: string[];
}

export function determineFeatSlots(
  buildState: BuildStateAtLevel,
  classFeatLists: FeatCatalog['classFeatLists'],
  compiledClass?: CompiledClass | null,  // NEW: pass active class's compiled record
): FeatSlotsAtLevel {
  const characterLevel = buildState.characterLevel;
  const classId = buildState.activeClassIdAtLevel ?? null;
  const classLevelInClass = classId
    ? buildState.classLevels[classId] ?? 0
    : 0;

  const autoGrantedFeatIds: string[] = [];
  let classBonusFeatSlot = false;

  // ... existing per-row scan unchanged ...

  // PRECEDENCE: compiled value first (D-01), legacy fallback only when null
  if (!classBonusFeatSlot && classId) {
    const schedule =
      compiledClass?.bonusFeatSchedule ??
      LEGACY_CLASS_BONUS_FEAT_SCHEDULES[classId] ??
      null;
    if (schedule && schedule.includes(classLevelInClass)) {
      classBonusFeatSlot = true;
    }
  }

  const generalFeatSlot = GENERAL_FEAT_LEVELS.includes(characterLevel);

  // NEW: race-bonus
  const raceBonusFeatSlot =
    buildState.raceId === HUMAN_RACE_ID && characterLevel === 1;

  return { classBonusFeatSlot, generalFeatSlot, raceBonusFeatSlot, autoGrantedFeatIds };
}
```

Source: [VERIFIED: refactor of existing `feat-eligibility.ts:102-151`]

### Example 3: BuildStateAtLevel extension

```typescript
// packages/rules-engine/src/feats/feat-prerequisite.ts (extend existing interface)
export interface BuildStateAtLevel {
  abilityScores: Record<string, number>;
  bab: number;
  characterLevel: number;
  classLevels: Record<string, number>;
  fortitudeSave: number;
  selectedFeatIds: Set<string>;
  skillRanks: Record<string, number>;
  raceId: string | null;                    // NEW (Phase 16, D-03)
  activeClassIdAtLevel: string | null;      // NEW (Phase 16, D-03) — disambiguates
                                             // multiclass; the class for THIS level
                                             // (not the highest-level class).
}
```

Source: [VERIFIED: extension of `packages/rules-engine/src/feats/feat-prerequisite.ts:13-28`]

### Example 4: UI selector — race-bonus slotKind

```typescript
// apps/planner/src/features/feats/selectors.ts (extend buildSlotStatuses + chosenFeats)
export type FeatSlotKind = 'class-bonus' | 'general' | 'race-bonus';   // EXTEND

// In selectFeatBoardView, after class-bonus chip push (~line 1238):
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

// In buildSlotStatuses, between class-bonus and general loops (~line 985):
if (raceBonusFeatSlot) {
  pushStatus(
    'race-bonus',
    0,
    shellCopyEs.feats.raceBonusStepTitle,   // NEW copy key: "Dote racial: Humano"
    activeFeatRecord?.bonusGeneralFeatIds[0] ?? null,
  );
}
```

Source: [VERIFIED: extension of `apps/planner/src/features/feats/selectors.ts:933-1004` + `:1233-1261`]

### Example 5: feat-board onDeselect dispatch (race-bonus branch)

```typescript
// apps/planner/src/features/feats/feat-board.tsx (extend existing onDeselect, ~L138)
onDeselect={(entry) => {
  if (entry.slotKind === 'class-bonus') {
    clearClassFeat(activeLevel, entry.slotIndex);
  } else if (entry.slotKind === 'race-bonus') {
    // race-bonus chip's slotIndex=0 → store's bonusGeneralFeatIds[0]
    // → store mutator addresses as slotIndex=1.
    clearGeneralFeat(activeLevel, 1);
  } else {
    clearGeneralFeat(activeLevel, entry.slotIndex);
  }
  setIsEditingCompleted(true);
}}
```

Source: [VERIFIED: extension of `apps/planner/src/features/feats/feat-board.tsx:138-156`]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `CLASS_BONUS_FEAT_SCHEDULES` 6-entry hardcoded map covering only fighter/swashbuckler/caballero-arcano (Phase 6) | Extended to 6 entries with wizard/monk/rogue (Phase 12.4-03) | 2026-04-19 | All Phase 12.4-03 fixture suites green; Puerta-prestige classes still fall through to `classBonusFeatSlot=false` |
| Hardcoded fallback only | **NEW (Phase 16):** Extractor-derived `bonusFeatSchedule` field on `CompiledClass` with the 6-entry hardcoded map as fallback | 2026-04-26 (this phase) | Brings Puerta-custom prestige classes' bonus-feat cadence under runtime evaluation; legacy map stays for any class the extractor doesn't yet surface (D-01 explicit) |
| `BuildStateAtLevel` 7 fields, no race | **NEW (Phase 16):** `raceId: string \| null` + `activeClassIdAtLevel: string \| null` added | 2026-04-26 | Enables D-03's race-aware feat slots; future-proofs subrace + race-restricted feat-list extensions |
| Phase 12.4-07 documented "store cap=2 vs total=3 mismatch" | **CORRECTION (Phase 16 research):** Store ALREADY supports 3 slots via `bonusGeneralFeatIds[]`; the actual bug is UI labelling + onDeselect dispatch | 2026-04-26 (research finding) | Plan 2 scope shrinks — no store mutator changes, no schema bump |

**Deprecated/outdated:**
- "store capacity 2→3" wording in REQUIREMENTS.md FEAT-06: misleading. The store has ALWAYS supported the 3rd slot since Phase 6's `bonusGeneralFeatIds: CanonicalId[]` shape. What's "missing" is the SIGNAL that the 3rd slot is a race bonus (vs a generic general bonus).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Only `race:human` should grant +1 dote at L1 in v1.1 (per locked CONTEXT D-04 + Deferred Ideas: "Subrace-driven feat bonuses... none in current Puerta roster — defer until extractor surfaces a candidate"). The `race:mediano-fortecor` description text suggests +1 dote at L1 should ALSO apply, but no 2DA column carries this. | Pitfall 4, Code Example 2 | If the user wants Mediano Fortecor to ALSO grant +1 dote at L1, Plan 2's race detection extends from a single equality (`raceId === HUMAN_RACE_ID`) to a Set lookup against an explicit allowlist. One-line change. Discuss-phase MUST confirm with user before Plan 2 lands. |
| A2 | Puerta's actual `cls_bfeat_fight.2da` schedule will match `[1,2,4,6,8,10,12,14,16]` (Phase 12.4-03 hardcoded) — NWN1 vanilla canon | Pitfall 5, 2DA Schema Reference | If the extractor reveals Puerta-custom Fighter cadence (e.g., extra L20 entry), Phase 12.4-03 fixture spec needs the new value. Low risk — Fighter is iconic and unlikely to be Puerta-customized, but the L1-L20 extension might surface an L20 bonus that the hardcoded `[1,2,4,...,16]` truncates. |
| A3 | `BuildStateAtLevel.activeClassIdAtLevel` is the right field name (not `classIdAtLevel` / `currentClassId` / `levelClassId`) | Code Example 3 | Naming convention; rename is trivial pre-merge. Phase 12.8 conventions favor `activeXxx` for "the X being inspected at this build-state moment" (cf. `activeLevel`, `activeFeatRecord`). |
| A4 | Phase 12.4-09 E2E fixture's `Elfo + Fighter` reference (`level-editor-action-bar-flow.e2e.spec.ts`) does NOT need pivot — Elfo's lack of race-bonus keeps the existing 2-slot path green | Migration sites table, Pitfall 6 | If the existing E2E asserts `data-slot-index="1"` in general pool at any Humano scenario, that assertion shifts to `data-slot-kind="race-bonus"`. Quick grep at plan time will surface. |

**Not assumed (verified):**
- All 5 `determineFeatSlots` call sites enumerated. [VERIFIED: grep against current main branch]
- `bonusGeneralFeatIds: CanonicalId[]` already round-trips through hydrate/project. [VERIFIED: hydrate-build-document.ts:87-98 + project-build-document.ts:125-130]
- `computePerLevelBudget` already returns `featSlots.raceBonus: 1` for Humano L1. [VERIFIED: per-level-budget.ts:193-194]
- 40 `cls_bfeat_*.2da` tables exist in Puerta extracts (one per most playable class). [VERIFIED: file count in `.claude/worktrees/agent-a45dc6e9359486571/.planning/phases/05-skills-derived-statistics/server-extract/`]
- `cls_bfeat_*.2da` is single-column `Bonus` with row index = class level. [VERIFIED: head + full-file inspection of `cls_bfeat_barb.2da`, `cls_bfeat_rog.2da`, `cls_bfeat_cler.2da`]
- `classes.2da` carries `BonusFeatsTable` column at position 12. [VERIFIED: `classes.2da` line 3 header]

---

## Open Questions (RESOLVED)

1. **Should `race:mediano-fortecor` also receive +1 dote at L1?**
   - What we know: TLK description text says yes. Phase 12.4-03 + per-level-budget.ts hardcode says no.
   - What's unclear: Is the Mediano Fortecor description text load-bearing canon, or decorative copy?
   - Recommendation: Plan-checker stage MUST surface this to the user as an explicit confirmation question. Default scope: Humano-only. Tracked as A1.
   - **RESOLVED: YES — Mediano Fortecor receives +1 dote at L1 (per CONTEXT.md D-06).** Description text is load-bearing canon. `RACE_L1_BONUS_FEATS` allowlist includes both `race:human` and `race:mediano-fortecor`. Plan 16-02 § interfaces locks the canonical IDs.

2. **What happens at character level 1 if user multiclasses at L1?**
   - NWN1 EE does not allow multiclassing AT level 1 — first level must be a single class. So this question is moot for L1 specifically.
   - Verified: progression-fixture.ts requires `levels[0].classId` set as the only class for L1 (single-classed start). Subsequent levels can multiclass.
   - **RESOLVED: moot (engine constraint — multiclass disallowed at L1 by NWN1 EE; verified via progression-fixture.ts).**

3. **Does the extractor need to handle epic-level entries (L21+) in `cls_bfeat_*.2da`?**
   - L1-L20 is sufficient for v1 scope (PROG-04 R5 caps at L20).
   - Recommendation: Plan 1 caps `parseBonusFeatSchedule` at `rowIndex >= 1 && rowIndex <= 20`. Out-of-range rows ignored silently (no warning — Puerta tables routinely include L21-40 epic data that is out of v1 scope).
   - **RESOLVED: NO (out of v1 scope — PROG-04 R5 caps at L20; Plan 16-01 caps `parseBonusFeatSchedule` at `rowIndex <= 20`).**

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 22+ | Extractor + Vitest | ✓ | 22.20.0 | — |
| corepack pnpm@10 | Workspace install + extractor | ✓ | 10.0.0 | — |
| nwsync sqlite + zstd | Extractor (build-time) | ✓ (already used by Phase 5.1) | — | — |
| `better-sqlite3` 12.2.0 | Extractor SQL access | ✓ | 12.2.0 | — |
| `fzstd` 0.1.1 | nwsync zstd decompression | ✓ | 0.1.1 | — |
| Puerta nwsync local install | Extractor source data | ✓ (per `packages/data-extractor/src/config.ts:20-27`) | manifest sha1 `cf6e8aad...` | — |
| `cls_bfeat_fight.2da` etc. in nwsync | New extractor parse path | ✓ EXPECTED (nwsync manifest references CLS_BFEAT_FIGHT for class row 4) | — | If extractor fails to find the resref, `parseBonusFeatSchedule` returns null and runtime falls back to `LEGACY_CLASS_BONUS_FEAT_SCHEDULES['class:fighter'] = [1,2,4,6,8,10,12,14,16]`. Fail-soft by design (D-01). |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None blocking — D-01's fallback path covers all "extractor blind" cases.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `corepack pnpm exec vitest run tests/phase-16/<spec> --reporter=dot` |
| Full suite command | `corepack pnpm exec vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FEAT-05 | Extractor reads `BonusFeatsTable` and emits `bonusFeatSchedule: number[]` for fighter/wizard/monk/rogue/swashbuckler/caballero-arcano matching legacy hardcode (or extractor-derived Puerta cadence) | unit (extractor) | `corepack pnpm exec vitest run tests/phase-16/bonus-feat-schedule-extractor.spec.ts -x` | ❌ Wave 0 |
| FEAT-05 | `compiledClass.bonusFeatSchedule` returns `null` (not `[]`) for classes whose `BonusFeatsTable` ref is `****` | unit (extractor) | same file | ❌ Wave 0 |
| FEAT-05 | `determineFeatSlots` reads `compiledClass.bonusFeatSchedule` first, falls back to `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` only when compiled value is null | unit (rules-engine) | `corepack pnpm exec vitest run tests/phase-16/determine-feat-slots-race-aware.spec.ts -x` | ❌ Wave 0 |
| FEAT-06 | Humano + Fighter L1 returns `featSlots = { classBonus: true, general: true, raceBonus: true }` | unit (rules-engine) | same file | ❌ Wave 0 |
| FEAT-06 | Elfo + Fighter L1 returns `featSlots = { classBonus: true, general: true, raceBonus: false }` | unit (rules-engine) | same file | ❌ Wave 0 |
| FEAT-06 | Humano + Wizard L1 returns 3 slots (class-wizard-bonus + general + race) | unit (rules-engine) | same file | ❌ Wave 0 |
| FEAT-06 | `<FeatBoard>` renders dedicated "Dote racial: Humano" section between class-bonus and general | RTL (jsdom) | `corepack pnpm exec vitest run tests/phase-16/feat-board-race-bonus-section.spec.tsx -x` | ❌ Wave 0 |
| FEAT-06 | `<FeatSummaryCard>` chip carries `data-slot-kind="race-bonus"` for Humano L1 race-bonus pick | RTL (jsdom) | same file | ❌ Wave 0 |
| FEAT-06 | `<LevelEditorActionBar>` resolves `legal` (3 slots filled) at Humano L1 Fighter when class-bonus + general + race-bonus all picked | RTL (jsdom) | same file | ❌ Wave 0 |
| FEAT-06 (D-05) | v1.0-shaped JSON build (Elfo Guerrero L1, no `bonusGeneralFeatIds`) round-trips identically through hydrate → project on v1.1 | unit (persistence) | `corepack pnpm exec vitest run tests/phase-16/humano-l1-build-roundtrip.spec.ts -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `corepack pnpm exec vitest run tests/phase-16/<changed-spec> --reporter=dot`
- **Per wave merge:** `corepack pnpm exec vitest run tests/phase-06 tests/phase-12.4 tests/phase-15 tests/phase-16`
- **Phase gate:** Full `vitest run` green + `tsc --noEmit` exit 0 + manual UAT (Humano L1 Fighter; Humano L1 Wizard; Elfo L1 Fighter; load v1.0 saved JSON)

### Wave 0 Gaps

- [ ] `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` — covers FEAT-05
- [ ] `tests/phase-16/determine-feat-slots-race-aware.spec.ts` — covers FEAT-05 + FEAT-06 rules-engine
- [ ] `tests/phase-16/feat-board-race-bonus-section.spec.tsx` — covers FEAT-06 UI
- [ ] `tests/phase-16/humano-l1-build-roundtrip.spec.ts` — covers FEAT-06 D-05 regression
- [ ] **Update existing fixtures**: 9 call sites in `tests/phase-06/feat-eligibility.spec.ts` + `tests/phase-06/feat-proficiency.spec.ts` migrate from `determineFeatSlots(level, classId, classLevelInClass, classFeatLists)` to `determineFeatSlots(buildState, classFeatLists, compiledClass)`. Trivial mechanical update; the existing `createBuildState` test helper at L10-23 already constructs `BuildStateAtLevel` and just needs `raceId: null` + `activeClassIdAtLevel: classId` added.

---

## Plan Decomposition Hints

The phase decomposes into **3 atomic plans** (recommended order):

### Plan 16-01: Extractor — `bonusFeatSchedule` field (FEAT-05)

**Scope:**
- Add `bonusFeatSchedule: z.array(z.number().int().positive()).nullable().optional()` to `compiledClassSchema` (`packages/data-extractor/src/contracts/class-catalog.ts:10-31`).
- Add `parseBonusFeatSchedule(bonusFeatsTableRef, ...)` helper to `class-assembler.ts` (mirror `feat-assembler.ts:148-161` `load2da` pattern).
- Add `BonusFeatsTable` column read at `class-assembler.ts:188`.
- Wire `bonusFeatSchedule` field into `classes.push({...})` at `class-assembler.ts:200`.
- Re-run `pnpm extract` to regenerate `apps/planner/src/data/compiled-classes.ts`.
- Add unit spec `tests/phase-16/bonus-feat-schedule-extractor.spec.ts`.

**Out of scope:** Runtime consumer changes (Plan 16-02). UI changes.

**Files touched:** 3 (`class-catalog.ts`, `class-assembler.ts`, `compiled-classes.ts` regenerated).

**Acceptance:**
- `compiledClassCatalog.classes.find(c => c.id === 'class:fighter')!.bonusFeatSchedule` is `number[]` (not null).
- For at least one class with `BonusFeatsTable=****` (likely a non-bonus prestige class), the field is `null`.
- Existing Phase 12.4-03 fixture suite still green (because runtime hasn't switched to compiled value yet).

### Plan 16-02: Rules-engine + UI — race-aware feat slots (FEAT-06 + half of FEAT-05)

**Scope:**
- Hoist `HUMAN_RACE_ID` constant from `per-level-budget.ts:71` to a new `packages/rules-engine/src/progression/race-constants.ts` (avoids circular dep).
- Extend `BuildStateAtLevel` (`feat-prerequisite.ts:13-28`) with `raceId: string | null` + `activeClassIdAtLevel: string | null`.
- Refactor `determineFeatSlots` (`feat-eligibility.ts:102-151`):
  - New signature: `(buildState, classFeatLists, compiledClass?)`.
  - Read `compiledClass.bonusFeatSchedule ?? LEGACY_CLASS_BONUS_FEAT_SCHEDULES[classId]`.
  - Add `raceBonusFeatSlot` field to `FeatSlotsAtLevel`.
- Migrate 5 call sites (per Migration sites table above).
- Update 2 test fixture files (`tests/phase-06/feat-eligibility.spec.ts`, `tests/phase-06/feat-proficiency.spec.ts`).
- Extend `FeatSlotKind` union: `'class-bonus' | 'general' | 'race-bonus'` (`apps/planner/src/features/feats/selectors.ts:111` + `:208`).
- Update `buildSlotStatuses` to insert race-bonus chip between class-bonus and general (Pitfall 6 ordering).
- Update `chosenFeats` projection to discriminate race-bonus when `budget.featSlots.raceBonus > 0` (selectors.ts:1233-1261).
- Update `feat-board.tsx` `onDeselect` (line 138-156) with race-bonus branch.
- Add new copy keys: `shellCopyEs.feats.raceBonusStepTitle = 'Dote racial: Humano'` + `raceBonusSectionTitle` + section heading copy.
- Update CSS `.feat-board__slot-card` selectors if section heading needs different visual treatment (likely append-only `.feat-summary-card__item--race-bonus` class — minimal/optional).
- Add specs: `tests/phase-16/determine-feat-slots-race-aware.spec.ts`, `tests/phase-16/feat-board-race-bonus-section.spec.tsx`.

**Out of scope:** Persistence regression (Plan 16-03).

**Files touched:** ~10 (rules-engine: 3-4; planner: 5-6; tests: 2 new).

**Acceptance:**
- Humano L1 Fighter shows 3 slot status cards (Dote de clase / Dote racial: Humano / Dote general).
- Filling all 3 → counter `3/3`, action bar enabled, summary-card collapses.
- Elfo L1 Fighter shows 2 slot status cards (Dote de clase / Dote general). Filling both → 2/2, action bar enabled. (Regression-proof for non-Humano.)
- Phase 06 + 12.4 + 12.7 + 12.8 + 15 test suites green.

### Plan 16-03: Persistence regression spec (D-05)

**Scope:**
- Single spec file `tests/phase-16/humano-l1-build-roundtrip.spec.ts`.
- Construct an Elfo Guerrero L1 v1.0-shaped JSON build (no `bonusGeneralFeatIds` populated; `featSelections[0].bonusGeneralFeatIds = []`).
- Hydrate via `hydrate-build-document.ts` → assert store state matches expected.
- Project via `project-build-document.ts` → assert byte-identical to input JSON.
- Construct a Humano Guerrero L1 v1.1-shaped JSON (with `bonusGeneralFeatIds: ['feat:weapon-focus-longsword']`).
- Hydrate → assert race-bonus slot populated.
- Project → assert byte-identical.

**Out of scope:** Schema changes (none — D-05 explicitly preserves shape).

**Files touched:** 1 new spec file.

**Acceptance:** Both round-trips byte-identical. Confirms D-05 invariant.

---

## Project Constraints (from CLAUDE.md)

- **Spanish-first surface**: All new UI copy lands under `shellCopyEs.feats.*` namespace (per CONTEXT D-04 explicit relaxation of D-NO-COPY for v1.1).
- **D-NO-DEPS**: Zero new npm packages. All Plan 16 work uses existing 5.1 extractor primitives + existing planner UI components.
- **Strict server-valid validation**: Race-bonus mechanic is NWN1 EE canon for Humano per `racialtypes.2da` description text (already documented at `per-level-budget.ts:60-73`). Plan 16 makes it consistent across the engine.
- **Static SPA / GitHub Pages**: Extractor runs at build-time only (Node CLI). No runtime 2DA access.
- **Phase 12.8-03 D-06 chip projection invariant**: PRESERVE — extending `slotKind` union is additive (third member), not a rewrite.
- **share-URL contract**: NO `schemaVersion` bump. NO new field in `featSelections`. (Locked by D-02 + D-05.)
- **GSD workflow enforcement**: Plans run via `/gsd:execute-phase 16` after `/gsd:plan-phase 16`. Each plan commits via TDD RED→GREEN cadence (Phase 12.x convention).

Source: [VERIFIED: project-level CLAUDE.md sections "Constraints" + "GSD Workflow Enforcement"]

---

## Sources

### Primary (HIGH confidence — verified in current codebase)

- `packages/rules-engine/src/feats/feat-eligibility.ts:78-151` — current `CLASS_BONUS_FEAT_SCHEDULES` + `determineFeatSlots`
- `packages/rules-engine/src/feats/feat-prerequisite.ts:13-28` — `BuildStateAtLevel` shape (no raceId)
- `packages/rules-engine/src/progression/per-level-budget.ts:60-73, 193-194` — Humano L1 raceBonus canon + HUMAN_RACE_ID constant
- `packages/data-extractor/src/contracts/class-catalog.ts:10-31` — `compiledClassSchema`
- `packages/data-extractor/src/contracts/feat-catalog.ts:73-78, 80-88` — `classFeatEntrySchema` + `featCatalogSchema`
- `packages/data-extractor/src/assemblers/class-assembler.ts:188-218` — current class assembly (BonusFeatsTable NOT read)
- `packages/data-extractor/src/assemblers/feat-assembler.ts:148-161, 195-272` — `load2da` pattern + cls_feat_* loop
- `apps/planner/src/features/feats/store.ts:10-15, 76-83, 150-167` — `FeatLevelRecord` shape + `setGeneralFeat` slotIndex semantics
- `apps/planner/src/features/feats/selectors.ts:111, 208, 933-1004, 1067, 1120, 1233-1261` — `FeatSlotKind` union + `buildSlotStatuses` + `chosenFeats` projection
- `apps/planner/src/features/feats/feat-board.tsx:138-156` — `onDeselect` dispatch
- `apps/planner/src/features/feats/feat-summary-card.tsx:1-68` — chip rendering + `data-slot-kind`
- `apps/planner/src/features/persistence/build-document-schema.ts:81-92` — `featSelections` schema (zero-cap on bonusGeneralFeatIds)
- `apps/planner/src/features/persistence/hydrate-build-document.ts:84-98` — `bonusGeneralFeatIds.entries()` round-trip
- `apps/planner/src/features/persistence/project-build-document.ts:115-130` — projection read
- `apps/planner/src/data/compiled-races.ts:114-119, 130-134` — `race:human` + `race:mediano-fortecor` description text
- `apps/planner/src/data/compiled-feats.ts:4432, 7776, 11712, 13324` — Fighter/Monk/Rogue/Wizard classFeatList line ranges (verified pool sizes via grep)
- `.claude/worktrees/agent-a45dc6e9359486571/.planning/phases/05-skills-derived-statistics/server-extract/cls_bfeat_*.2da` — 40 sample files, full-text inspection of barb/rog/cler/dru/bard/rang/pal/war
- `.claude/worktrees/agent-a45dc6e9359486571/.planning/phases/05-skills-derived-statistics/server-extract/classes.2da:3, 8` — header + Fighter row showing BonusFeatsTable column

### Secondary (MEDIUM confidence — phase planning docs)

- `.planning/phases/06-feats-proficiencies/06-RESEARCH.md` — Phase 6 original feat-eligibility research
- `.planning/phases/05.1-data-extractor-pipeline/05.1-RESEARCH.md:520-545` — feat prerequisite + cls_feat column convention
- `.planning/phases/05.1-data-extractor-pipeline/05.1-04-PLAN.md:151, 169-175, 199-203` — feat-assembler design rationale
- `.planning/phases/12.4-construccion-correctness-clarity/12.4-03-SUMMARY.md` — extension of CLASS_BONUS_FEAT_SCHEDULES (wizard/monk/rogue)
- `.planning/phases/12.4-construccion-correctness-clarity/12.4-07-SUMMARY.md:55` — known limitation (now corrected by this research's "State of the Art")
- `.planning/phases/16-feat-engine-completion/16-CONTEXT.md` — phase decisions D-01..D-05

### Tertiary (LOW confidence — flagged for plan-checker confirmation)

- NWN1 EE vanilla-vs-Puerta cls_bfeat schedule comparison: only verified for ranger/rogue/cleric/paladin/druid/bard/barbarian against the worktree extract. Fighter/monk/wizard NOT in worktree extract — Plan 1 must re-extract to confirm. [LOW: ASSUMED that Fighter still gets `[1,2,4,6,8,10,12,14,16]` until extractor proves otherwise.]
- Mediano Fortecor +1 dote at L1 canonicality: TLK description text says yes, but no 2DA column carries the rule. [ASSUMED scope-deferred to v1.2 per CONTEXT Deferred Ideas; user confirmation in plan-checker recommended.]

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every needed primitive is already installed and battle-tested.
- 2DA schema (cls_bfeat): HIGH — verified against on-disk Puerta extracts in worktree.
- Architecture (extractor + runtime threading): HIGH — both touch existing patterns.
- UI surface: HIGH — Phase 12.8-03 D-06 chip projection invariant covers the extension model.
- Race scope (Humano-only): MEDIUM — `race:mediano-fortecor` description text suggests broader applicability; explicit user confirmation recommended.
- Pitfalls: HIGH — all five pitfalls are codebase-grounded with file/line references.

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days — stable; no upstream library bumps expected)
**Next research trigger:** If user accepts/rejects A1 (Mediano Fortecor scope) or if Plan 1 extract reveals unexpected Fighter/Monk/Wizard schedule divergence requiring fixture revision.
