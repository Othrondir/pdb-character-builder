# Phase 17: Per-Race Point-Buy — Research

**Researched:** 2026-04-26
**Domain:** Data extractor pipeline + rules-engine cost-table constant + selector rewire (NO UI changes)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Source pipeline (locked).** Move snapshot into the extractor pipeline. `compiledRaceSchema` gains `abilitiesPointBuyNumber: number | null` (additive, optional, nullable). `race-assembler.ts` reads `row.AbilitiesPointBuyNumber` from `racialtypes.2da` per race. Hand-authored `puerta-point-buy.json` + `.md` retired in same plan that ships the extractor field.
- **D-02 — Cost table location (Claude's discretion → locked).** Cost step function lives as a single `NWN1_POINT_BUY_COST_TABLE` constant in `packages/rules-engine/src/foundation/`. Shape: `{ minimum: 8, maximum: 18, costByScore: { '8': 0, '9': 1, …, '18': 16 } }`. Embedding it per-race in compiled-races would 45×-duplicate the same data and create ambiguity over whether per-race `costByScore` is intentional or extractor noise.
- **D-02a — Helper.** New helper `deriveAbilityBudgetRules(compiledRace, costTable): AbilityBudgetRules | null` in rules-engine composes `{ budget: race.abilitiesPointBuyNumber, ...NWN1_POINT_BUY_COST_TABLE }`. Returns `null` when `abilitiesPointBuyNumber === null` (preserves Phase 12.6 D-05 fail-closed contract).
- **D-03 — SC#4 reframe (locked).** SC#4 reframes to schema-shape coverage: ≥3 dedupe-canonical races resolve to a non-null `AbilityBudgetRules` via the selector AND ≥1 race demonstrates the null fail-closed branch. "Distinct curves" literal is dropped — it is unsatisfiable with truthful data per Phase 12.6 evidence.
- **D-04 — Test migration (Claude's discretion → locked).** Migrate `tests/phase-12.6/ability-budget-per-race.spec.ts` atomically with the snapshot retirement. Replace `import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot'` with the new selector path. Behavior pin from Phase 12.6 (45 races have non-null curves; baseline {8,8,8,8,8,8} → spent 0; bump 8→14 → 6 points spent) survives the migration verbatim.
- **D-05 — UAT A1 closure (locked).** UAT-2026-04-20 §A1 closes as resolved-by-evidence in Phase 17's closeout commit. CLOSED-BY: Phase 17 footer with disposition note: "User claim of per-race variance was contradicted by user's own 2026-04-20 in-game verification + racialtypes.2da extraction; Phase 17 ships the engineering deliverable (extractor pipeline) on the truthful uniform curve."
- **D-06 — Schema posture.** `raceCatalogSchema.schemaVersion` stays at `'1'` — additive optional nullable field, same posture as Phase 16-01's `bonusFeatSchedule`. Persistence layer + `BUILD_ENCODING_VERSION` untouched.

### Claude's Discretion

- Helper function signature and module placement (`deriveAbilityBudgetRules` in `foundation/ability-budget.ts` vs new file).
- Constant naming exact spelling (`NWN1_POINT_BUY_COST_TABLE` vs `POINT_BUY_COST_STEP_TABLE`).
- Whether the new phase-17 spec lives under `tests/phase-17/` (new dir) or appends to migrated phase-12.6 spec — planner decides per Phase 16 precedent (separate dir per phase preferred).
- Wave breakdown — likely 3 waves: (Wave 1) extractor schema + assembler + regenerated artifact, (Wave 2) rules-engine cost-table + helper + selector swap + retire snapshot, (Wave 3) atomic spec migration + new phase-17 spec + UAT A1 closure.

### Deferred Ideas (OUT OF SCOPE)

- **Puerta NWScript server-script extraction path** — non-uniform `AbilitiesPointBuyNumber` overrides via server-side scripts. Encoded as `it.todo` in Phase 12.6 spec; preserved by D-04. NOT Phase 17 scope.
- **Synthetic variant curves for negative-path testing** — rejected by D-NO-hardcoded-data; if needed in future, would belong in a fixture-only test util, not production data.
- **Schema-version bump (`raceCatalogSchema.schemaVersion: '1' → '2'`)** — additive optional nullable field is purely backward-compatible.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ATTR-02 | El planner consume curvas de coste point-buy diferenciadas por raza desde el extractor (Puerta snapshot override o 2DA enrichment) en lugar de la curva uniforme actual (cierra UAT-2026-04-20 A1). | Closed end-to-end: extractor emits `abilitiesPointBuyNumber: number \| null` (D-01); rules-engine ships `NWN1_POINT_BUY_COST_TABLE` + `deriveAbilityBudgetRules` (D-02/D-02a); selector reads compiledRaceCatalog (Standard Stack §Selector); existing fail-closed contract preserved (Architecture §Pattern 1). Per-race **variance** is not deliverable from truthful client data; SC#4 reframed to schema-shape coverage per D-03. |
</phase_requirements>

## Summary

Phase 17 is a **data-source migration**, not a feature add. The runtime contract Phase 12.6 already shipped — `selectAbilityBudgetRulesForRace(raceId): AbilityBudgetRules | null` consumed by `calculateAbilityBudgetSnapshot`'s null branch — stays byte-identical. Only the *source* of the per-race curve flips: from a hand-authored JSON snapshot loaded by `point-buy-snapshot.ts` to a typed extractor field on `compiledRaceCatalog.races[]`. Phase 16-01 (`bonusFeatSchedule`) is the exact precedent for the schema/assembler shape. Phase 16-02 (`BuildStateAtLevel` field fan-out) is the precedent for atomic test-fixture migration alongside a source-of-truth swap.

Three landmines dominate planning:

1. **Snapshot has more importers than CONTEXT.md identified.** Beyond `tests/phase-12.6/ability-budget-per-race.spec.ts` (D-04 target), three pre-12.6 specs (`tests/phase-03/summary-status.spec.tsx`, `tests/phase-03/attribute-budget.spec.tsx`, `tests/phase-10/attributes-advance.spec.tsx`) and two phase-12.6 specs (`tests/phase-12.6/point-buy-snapshot-coverage.spec.ts`, `tests/phase-12.6/attributes-board-fail-closed.spec.tsx`) seed/mutate `PUERTA_POINT_BUY_SNAPSHOT` at runtime. All five must migrate atomically with the snapshot retirement, or CI dies the moment `point-buy-snapshot.ts` is deleted. Total importers found in repo (excluding worktrees and CONTEXT/STATE docs): **6 test files + 1 selector + 1 self-import in foundation barrel**.
2. **Atomic re-extract drift.** Phase 16-01 SUMMARY documents the recurring `pnpm extract` quirk: regenerating one catalog regenerates **all five** (`compiled-classes/races/feats/skills/deities`), and current nwsync state introduces an unrelated `race:halfelf2` Semielfo dup that breaks 8 phase-12.6+12.8 specs. Phase 17 INTENTIONALLY regenerates `compiled-races.ts` (the in-scope catalog), so the planner must explicitly contend with the dup — either revert siblings (the Phase 16-01 pattern) AND ship the dedup fix INSIDE Phase 17's scope (because compiled-races IS the intended diff), OR accept the dedup dossier as collateral that Phase 17 absorbs. Recommendation: ship the dedup fix in Phase 17's race-assembler change because it's already touching that file; surfacing a CONTEXT amendment for D-07 dedup hygiene would be cleaner than ignoring it.
3. **The null branch needs synthetic test data.** Every PlayerRace=1 row in the racialtypes.2da baseline has `AbilitiesPointBuyNumber=30` — there is no naturally-null race. SC#4 reframe (D-03) requires ≥1 race to demonstrate the null branch. The planner must either (a) author a phase-17 spec that constructs a synthetic `CompiledRace` literal with `abilitiesPointBuyNumber: null` and asserts `deriveAbilityBudgetRules(synthetic, COST_TABLE) === null` — this is unit-test scaffolding, NOT production data fabrication, so it does not violate D-NO-hardcoded-data — or (b) verify whether any of the 45 catalog races has a sourceRow that resolves to a 2DA row with `****` in the `AbilitiesPointBuyNumber` column (spoiler from baseline: all PlayerRace=1 rows are populated, so no naturally-null race exists in the truth-aligned dataset).

**Primary recommendation:** Three-wave plan. Wave 1 ships extractor schema + assembler + regenerated `compiled-races.ts` (with dedup hygiene if `halfelf2` dup recurs). Wave 2 ships `NWN1_POINT_BUY_COST_TABLE` + `deriveAbilityBudgetRules` + selector swap + foundation barrel cleanup + delete `puerta-point-buy.{json,md,ts}`. Wave 3 atomically migrates all 6 affected spec files + adds a phase-17 SC#4 spec covering both branches + closes UAT A1 in the closeout commit. Helper file: place `NWN1_POINT_BUY_COST_TABLE` and `deriveAbilityBudgetRules` in `packages/rules-engine/src/foundation/ability-budget.ts` (the file already owns `AbilityBudgetRules` shape + null branch + `nextIncrementCost` + `canIncrementAttribute`); a new file would split a tightly cohesive module for negative gain.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Read `racialtypes.2da:AbilitiesPointBuyNumber` per row | data-extractor (assembler) | — | Build-time CLI only; Phase 16-01 PATTERNS.md S1 (`load2da`) sets precedent. |
| Validate per-race budget value (positive int OR null) | data-extractor (Zod schema) | — | `compiledRaceSchema` Zod parse at planner module load — fail-closed if extractor emits non-int. |
| NWN1 cost step function (8:0..18:16) | rules-engine (`foundation/`) | — | Engine canon. Single constant. Framework-agnostic per Pattern S7 (no extractor/planner imports). |
| Compose race + cost-table → `AbilityBudgetRules \| null` | rules-engine (`foundation/`) | — | `deriveAbilityBudgetRules(compiledRace, costTable)` — pure, framework-agnostic. |
| Resolve per-race rules from raceId (selector) | apps/planner (selector) | rules-engine (helper) | `selectAbilityBudgetRulesForRace` reads `compiledRaceCatalog`, calls `deriveAbilityBudgetRules`, returns to existing consumer. |
| Render fail-closed callout when `abilitiesPointBuyNumber === null` | apps/planner (UI — UNCHANGED) | rules-engine (`calculateAbilityBudgetSnapshot` null branch) | Phase 12.6 D-05 contract preserved verbatim. |

## Standard Stack

### Core (already installed — no new deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | 4.3.5 | Schema-validate compiled catalogs at planner module load | Established at boundary per CLAUDE.md; existing `compiledRaceSchema` extends additively. `[VERIFIED: package.json + Phase 16-01 SUMMARY]` |
| Vitest | 4.0.16 | Unit + fixture tests | Project standard; `vitest.config.ts` already maps `tests/phase-17/**` would inherit `node` env (default) — no glob entry needed unless `.spec.tsx` arrives. `[VERIFIED: vitest.config.ts]` |
| TypeScript | 5.9.2 | Strict typing across extractor → planner pipeline | Project baseline. `[VERIFIED: package.json]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| better-sqlite3 | 12.9.0 | nwsync SQLite read at extract time | Reused via existing `NwsyncReader`; Phase 17 does not touch this layer. `[VERIFIED: data-extractor/package.json]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single `NWN1_POINT_BUY_COST_TABLE` constant | Per-race `costByScore` field on `compiledRaceSchema` | Rejected by D-02. 45× duplication of identical data; creates ambiguity over whether per-race difference is intentional or extractor noise. Single-constant + per-race-budget keeps source-of-truth minimal. |
| `deriveAbilityBudgetRules` helper in new file `point-buy-rules.ts` | Existing `ability-budget.ts` | Recommended (this RESEARCH): keep it in `ability-budget.ts`. The file already owns `AbilityBudgetRules` shape + `calculateAbilityBudgetSnapshot` null branch. New file fragments cohesion for no gain. |
| Re-export `PUERTA_POINT_BUY_SNAPSHOT` as derived value from new pipeline | Hard delete | Rejected by D-01: "retired (deleted, not preserved as derived re-export)." Cleaner cut; phase-12.6 specs become canonical place for per-race assertions sourced from new pipeline. |

**Installation:** No new packages. Phase 17 is a within-repo refactor.

## Architecture Patterns

### System Architecture Diagram

```
                    BUILD-TIME (CLI: pnpm extract)
   ┌──────────────────────────────────────────────────────┐
   │                                                       │
   │  nwsync SQLite (Puerta manifest)                      │
   │           ↓ (NwsyncReader.getResource)                │
   │  racialtypes.2da (text)                               │
   │           ↓ (parseTwoDa)                              │
   │  TwoDaTable.rows: Map<rowIndex, Record<col, str>>     │
   │           ↓ (assembleRaceCatalog: per-row loop)       │
   │  for row in racesTable.rows                           │
   │     filter PlayerRace !== '1' → skip                  │
   │     filter sentinel labels → skip                     │
   │     resolve TLK names + abilityAdjustments            │
   │     ────── PHASE 17 INSERTION ──────                  │
   │     parse row.AbilitiesPointBuyNumber                 │
   │       → number | null  (NaN/missing = null)           │
   │     ─────────────────────────────────                 │
   │  push CompiledRace { ..., abilitiesPointBuyNumber }   │
   │           ↓ (raceCatalogSchema.parse)                 │
   │           ↓ (emitTypescriptCatalog)                   │
   │  apps/planner/src/data/compiled-races.ts (artifact)   │
   │                                                       │
   └──────────────────────────────────────────────────────┘
                          ╱ (committed)
                         ╱
   ┌──────────────────────────────────────────────────────┐
   │                  RUN-TIME (browser SPA)               │
   │                                                       │
   │  compiledRaceCatalog: RaceCatalog                     │
   │     races: CompiledRace[]                             │
   │     each: { id, abilitiesPointBuyNumber: int | null } │
   │           ↓                                           │
   │  selectors.ts:60 selectAbilityBudgetRulesForRace      │
   │     raceId → race = compiledRaceCatalog.races.find    │
   │     ────── PHASE 17 INSERTION ──────                  │
   │     return deriveAbilityBudgetRules(race, COST_TABLE) │
   │     ─────────────────────────────────                 │
   │           ↓ (returns AbilityBudgetRules | null)       │
   │  selectors.ts:258 selectAttributeBudgetSnapshot       │
   │     attributeRules ↓                                  │
   │  ability-budget.ts calculateAbilityBudgetSnapshot     │
   │     null → fail-closed (rule:point-buy-missing)       │
   │     non-null → spent/remaining math                   │
   │           ↓                                           │
   │  AttributesBoard renders callout OR budget summary    │
   │                                                       │
   └──────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | File | Phase 17 Change |
|-----------|------|-----------------|
| `compiledRaceSchema` (Zod) | `packages/data-extractor/src/contracts/race-catalog.ts:9-17` | ADD `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional()` between `abilityAdjustments` and `description`. |
| `assembleRaceCatalog` (assembler) | `packages/data-extractor/src/assemblers/race-assembler.ts:99-174` (per-row loop) | ADD column read after sentinel filter and before `races.push`. Parse with `parseInt`/`Number.isFinite` guards mirroring lines 121-124 (TLK strref guards) — invalid → `null`. |
| `compiledRaceCatalog` (artifact) | `apps/planner/src/data/compiled-races.ts` | REGENERATE via `pnpm extract`; commit atomically. datasetId expected to bump from `puerta-ee-2026-04-17+cf6e8aad` → `puerta-ee-2026-04-26+cf6e8aad`. |
| `NWN1_POINT_BUY_COST_TABLE` | `packages/rules-engine/src/foundation/ability-budget.ts` (NEW export) | ADD constant `{ minimum: 8, maximum: 18, costByScore: { '8':0, '9':1, '10':2, '11':3, '12':4, '13':5, '14':6, '15':8, '16':10, '17':13, '18':16 } } as const`. |
| `deriveAbilityBudgetRules` | `packages/rules-engine/src/foundation/ability-budget.ts` (NEW export) | ADD pure helper. Signature: `(race: { abilitiesPointBuyNumber: number \| null }, costTable: typeof NWN1_POINT_BUY_COST_TABLE) => AbilityBudgetRules \| null`. Returns `null` iff `race.abilitiesPointBuyNumber === null`. |
| `selectAbilityBudgetRulesForRace` | `apps/planner/src/features/character-foundation/selectors.ts:60-65` | REWIRE: drop `PUERTA_POINT_BUY_SNAPSHOT` import; lookup `compiledRaceCatalog.races.find((r) => r.id === raceId) ?? null`; `if (!race) return null`; `return deriveAbilityBudgetRules(race, NWN1_POINT_BUY_COST_TABLE)`. |
| `point-buy-snapshot.ts` | `packages/rules-engine/src/foundation/point-buy-snapshot.ts` | DELETE entire file. |
| `puerta-point-buy.json` + `.md` | `packages/rules-engine/src/foundation/data/` | DELETE both. |
| `foundation/index.ts` barrel | `packages/rules-engine/src/foundation/index.ts:6` | REMOVE `export * from './point-buy-snapshot';` line. Verify nothing else imports from it. |

### Recommended Project Structure (post-Phase-17)

```
packages/
├── data-extractor/src/
│   ├── contracts/race-catalog.ts         (compiledRaceSchema + abilitiesPointBuyNumber)
│   └── assemblers/race-assembler.ts      (reads AbilitiesPointBuyNumber col)
├── rules-engine/src/foundation/
│   ├── ability-budget.ts                 (NWN1_POINT_BUY_COST_TABLE + deriveAbilityBudgetRules + null branch)
│   ├── data/                              ← keep dir; will be empty post-deletion (optional: rmdir)
│   │   └── (puerta-point-buy.json — DELETED)
│   │   └── (puerta-point-buy.md — DELETED)
│   ├── (point-buy-snapshot.ts — DELETED)
│   └── index.ts                           (barrel — point-buy-snapshot export REMOVED)
apps/planner/src/
├── data/compiled-races.ts                (regenerated; ships abilitiesPointBuyNumber per race)
└── features/character-foundation/selectors.ts  (rewired source)
tests/
├── phase-12.6/ability-budget-per-race.spec.ts        (D-04 atomic migration)
├── phase-12.6/point-buy-snapshot-coverage.spec.ts    (DELETE — snapshot retired; coverage proven by extractor schema parse)
├── phase-12.6/attributes-board-fail-closed.spec.tsx  (migrate seed mechanism)
├── phase-03/summary-status.spec.tsx                  (migrate seed mechanism)
├── phase-03/attribute-budget.spec.tsx                (migrate seed mechanism)
├── phase-10/attributes-advance.spec.tsx              (migrate seed mechanism)
└── phase-17/                                         (NEW)
    ├── per-race-point-buy-extractor.spec.ts          (Wave 1 verification)
    ├── derive-ability-budget-rules.spec.ts           (Wave 2 unit tests)
    └── per-race-point-buy-selector.spec.ts           (Wave 3 SC#4 reframe — both branches)
```

### Pattern 1: Additive optional nullable extractor field [VERIFIED: Phase 16-01 PATTERNS.md + 16-01-SUMMARY.md `1ad9a36`]

**What:** Extend a Zod-validated catalog schema with `<field>: z.<base>().nullable().optional()` and emit values from the assembler. `null` is *meaningful* ("extractor read the row but the column was `****`/missing"); `undefined` is *forward-compat* ("older catalog snapshot pre-Phase-N"); legitimate value is the populated case.

**When to use:** Any time the extractor surface area widens by one field that downstream consumers can degrade gracefully on.

**Phase 17 application:**

```typescript
// packages/data-extractor/src/contracts/race-catalog.ts
// Source: Phase 16-01 PATTERNS.md § "Field to add" + Phase 17 CONTEXT D-01
export const compiledRaceSchema = z.object({
  abilityAdjustments: z.record(z.enum(ABILITY_KEYS), z.number().int()),
  abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional(),  // ← NEW (Phase 17)
  description: z.string(),
  favoredClass: z.string().regex(canonicalIdRegex).nullable(),
  id: z.string().regex(/^race:[A-Za-z0-9._-]+$/),
  label: z.string().min(1),
  size: z.enum(RACE_SIZES),
  sourceRow: z.number().int().nonnegative(),
});
// raceCatalogSchema.schemaVersion: z.literal('1') — STAYS '1' per D-06.
```

**Why `.nonnegative()` not `.positive()`:** `0` is a syntactically valid AbilitiesPointBuyNumber even if Puerta does not currently ship it; permitting it future-proofs the schema. (Phase 16-01's `bonusFeatSchedule` used `.positive()` because feat slots are 1-indexed; budget points are 0-indexed.)

**Why `.optional()` despite the assembler always emitting the field:** `.optional()` makes the field forward-compat with hypothetical future catalog regressions where extractor crashes mid-row and emits a partial entry — Zod will still parse. Phase 16-01 set this precedent and there is zero reason to deviate.

### Pattern 2: 2DA column read inside assembler per-row loop [VERIFIED: race-assembler.ts:101-174 — existing pattern]

**What:** Inside the `for (const [rowIndex, row] of racesTable.rows)` loop, parse the column with explicit `parseInt` + `Number.isFinite` guard. Fail-soft (assign `null`) instead of throwing — Phase 17 inherits the warning idiom from `class-assembler.ts:124, 135, 142, 174` (T-16-03 mitigation).

**Phase 17 application:**

```typescript
// packages/data-extractor/src/assemblers/race-assembler.ts
// Insertion point: AFTER the sentinel filter (line 116) and BEFORE the `races.push` (line 165).
// Mirrors the TLK strref guard pattern at lines 121-124.
const abilitiesPointBuyRaw = row.AbilitiesPointBuyNumber;
let abilitiesPointBuyNumber: number | null = null;
if (abilitiesPointBuyRaw != null) {
  const parsed = parseInt(abilitiesPointBuyRaw, 10);
  if (Number.isFinite(parsed) && parsed >= 0) {
    abilitiesPointBuyNumber = parsed;
  } else {
    warnings.push(`Race row ${rowIndex} (${label}): invalid AbilitiesPointBuyNumber '${abilitiesPointBuyRaw}'`);
  }
}

// In races.push({...}), insert after `abilityAdjustments,`:
races.push({
  abilityAdjustments,
  abilitiesPointBuyNumber,    // ← NEW
  description: resolvedDesc,
  favoredClass,
  id,
  label: displayLabel,
  size,
  sourceRow: rowIndex,
});
```

**Critical note:** `parseTwoDa` at `two-da-parser.ts:130-135` already converts `'****'` to `null` in the row record. So the assembler should test `abilitiesPointBuyRaw != null` (not `!== '****'`); the parser has done that work. Verified at `two-da-parser.ts:131`: `if (value === undefined || value === '****') { record[columns[c]] = null; }`.

### Pattern 3: Framework-agnostic rules-engine helper composing extractor data [VERIFIED: Phase 16-02 B-01 architectural decision]

**What:** Rules-engine helpers MUST NOT import from `@data-extractor` or `@planner`. They take plain object inputs whose *shape* happens to match a compiled catalog entry. Selectors at the planner edge adapt the catalog to the helper signature. Pattern S7 in Phase 16 PATTERNS.md.

**Phase 17 application:**

```typescript
// packages/rules-engine/src/foundation/ability-budget.ts
// Source: Phase 16-02 SUMMARY § "Architectural decision B-01" + CONTEXT D-02

/**
 * Phase 17 (ATTR-02) — NWN1 hardcoded engine point-buy cost step.
 *
 * Source-of-truth: NWN1 EE engine (binary, not 2DA-driven). User-confirmed
 * 2026-04-20 in-game verification — see `puerta-point-buy.md § "Plan 06
 * Source Resolution"` (retired alongside this constant; git history
 * preserves provenance via commit `bf55129` and earlier).
 *
 * Bands: 1:1 from 8→14 (6 pts), 2:1 from 14→16 (4 pts), 3:1 from 16→18 (6 pts).
 * Total 8→18 = 16 cost.
 */
export const NWN1_POINT_BUY_COST_TABLE = {
  minimum: 8,
  maximum: 18,
  costByScore: {
    '8': 0, '9': 1, '10': 2, '11': 3, '12': 4, '13': 5,
    '14': 6, '15': 8, '16': 10, '17': 13, '18': 16,
  },
} as const satisfies {
  minimum: number;
  maximum: number;
  costByScore: Record<string, number>;
};

/**
 * Phase 17 (ATTR-02 D-02a) — compose race + cost-table → fail-closed
 * AbilityBudgetRules. Pure, framework-agnostic. Selector composes the call.
 *
 * Returns `null` when `race.abilitiesPointBuyNumber === null` — preserves
 * Phase 12.6 D-05 fail-closed contract that drives `rule:point-buy-missing`
 * via `calculateAbilityBudgetSnapshot`'s null branch.
 */
export function deriveAbilityBudgetRules(
  race: { abilitiesPointBuyNumber: number | null | undefined },
  costTable: typeof NWN1_POINT_BUY_COST_TABLE = NWN1_POINT_BUY_COST_TABLE,
): AbilityBudgetRules | null {
  if (race.abilitiesPointBuyNumber == null) return null;  // catches both null + undefined
  return {
    budget: race.abilitiesPointBuyNumber,
    minimum: costTable.minimum,
    maximum: costTable.maximum,
    costByScore: costTable.costByScore,
  };
}
```

**Why the input type is structural (`{ abilitiesPointBuyNumber: number | null | undefined }`) not `CompiledRace`:** importing `CompiledRace` would introduce a `@data-extractor` import in `@rules-engine`, breaking Pattern S7. The selector at the planner edge enforces type compatibility — the helper accepts any plain object with the right shape. This is the *exact* pattern Phase 16-02 used for `compiledClass?: CompiledClass` arg on `determineFeatSlots` (B-01 option a).

**Default arg for `costTable`:** caller-pure ergonomics. Tests can pass synthetic curves; production code calls `deriveAbilityBudgetRules(race)`.

### Pattern 4: Selector adapts compiled catalog to rules-engine signature at planner edge [VERIFIED: selectors.ts:170-194 (`groupRacesByParent` + `compiledRaceCatalog`) — pre-existing pattern]

**Phase 17 application:**

```typescript
// apps/planner/src/features/character-foundation/selectors.ts:60-65 (REWIRE)
// Source: existing selector + Phase 17 CONTEXT D-01 + Pattern S7

// REMOVE lines 5-7:
//   import { PUERTA_POINT_BUY_SNAPSHOT, type PointBuyCurve }
//     from '@rules-engine/foundation/point-buy-snapshot';
// ADD:
import {
  deriveAbilityBudgetRules,
  type AbilityBudgetRules,  // export this from ability-budget.ts (currently unexported)
} from '@rules-engine/foundation/ability-budget';
import { compiledRaceCatalog } from '@planner/data/compiled-races';  // already imported at line 13

// REWIRE selectAbilityBudgetRulesForRace:
export function selectAbilityBudgetRulesForRace(
  raceId: CanonicalId | null,
): AbilityBudgetRules | null {
  if (!raceId) return null;
  const race = compiledRaceCatalog.races.find((r) => r.id === raceId);
  if (!race) return null;
  return deriveAbilityBudgetRules(race);
}
```

**Type compatibility note:** `AbilityBudgetRules` is currently a private `interface` declared at `ability-budget.ts:11-16`. Phase 17 must EXPORT it so the selector can name the return type. This is a non-breaking rename of the file's internal type to a public export — verified zero existing external callers via grep.

### Anti-Patterns to Avoid

- **Re-export `PUERTA_POINT_BUY_SNAPSHOT` from a derived module that reads the new pipeline.** Rejected by D-01 explicit "(deleted, not preserved as derived re-export)." Hard cut keeps the codebase simpler and forces consumer specs to migrate to the canonical path.
- **Embedding `costByScore` per race in `compiledRaceSchema`.** Rejected by D-02. 45× duplication of identical engine data; creates ambiguity in test fixtures over whether per-race difference is intentional.
- **Hand-authoring synthetic per-race variance for testing.** Rejected by CONTEXT § Deferred + CLAUDE.md "verify against game files." If a future server-script override surfaces, that future phase ships the variance + flips the existing `it.todo` from Phase 12.6.
- **Bumping `raceCatalogSchema.schemaVersion: '1' → '2'`.** Rejected by D-06. Additive optional nullable field is purely backward-compatible — existing snapshots (and existing persisted shared URLs that reference the catalog datasetId) parse without migration.
- **Treating `parseInt` returning `0` as `null`.** `0` is a valid budget value (means "no points to spend"; theoretically possible if a future race ships it). Use `Number.isFinite(parsed) && parsed >= 0` — both bounds matter.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 2DA text parsing | Custom row/column lexer | Existing `parseTwoDa` from `packages/data-extractor/src/parsers/two-da-parser.ts` | Already handles quoted values, `****` → `null` coercion, non-contiguous row indices, trailing-column defaulting. Phase 5.1 baseline. |
| nwsync resource fetch | Custom SQLite + zstd flow | `NwsyncReader.getResource(resref, RESTYPE_2DA)` | Phase 5.1 reader already handles base-game fallback chain. `assembleRaceCatalog` lines 64-76 already read `racialtypes` via this path; no new code needed. |
| Per-race fail-closed UI rendering | New callout component | `AttributesBoard` already renders `point-buy-missing-callout` (Phase 12.6 Plan 02) | The selector returning `null` IS the trigger. Verified by `tests/phase-12.6/attributes-board-fail-closed.spec.tsx`. |
| Cost-table validation at module load | Custom assertion | Already enforced by TypeScript `as const satisfies` + Zod parse on `compiledRaceCatalog` | Compile-time + parse-time fail-closed; runtime has zero work to do. |

**Key insight:** Phase 17 is plumbing-only. Every primitive is already in the codebase. The risk surface is *what gets disconnected* (snapshot file + 6 spec consumers + 1 selector import + 1 barrel export), not what gets built.

## Runtime State Inventory

> Phase 17 is a code/config change with **no** stored data, live service config, OS-registered state, secrets, or build artifacts that would survive a code-only diff.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by grep across `apps/`, `packages/`, `tests/` for any persistence layer reference to `puerta-point-buy`, `PointBuyCurve`, or `pointBuySnapshotSchema`. The runtime never persists per-race curves; they are read-only static catalog data baked into the JS bundle. | None |
| Live service config | None — no backend; static GitHub Pages deployment per CLAUDE.md. | None |
| OS-registered state | None — no scheduled tasks, daemons, or system services. | None |
| Secrets/env vars | None — no env vars reference point-buy data. | None |
| Build artifacts | `apps/planner/src/data/compiled-races.ts` — committed source artifact, NOT a build output. Regeneration via `pnpm extract` produces a new version of this file that ships in the same commit as the assembler change. **datasetId in this file is read by `apps/planner/src/data/ruleset-version.ts:23` (`CURRENT_DATASET_ID = compiledClassCatalog.datasetId`)**. Phase 17 regenerating compiled-races.ts will leave `compiled-classes.ts` at `puerta-ee-2026-04-26+cf6e8aad` (Phase 16-01's bumped value) and bring `compiled-races.ts` along to a comparable date. CURRENT_DATASET_ID stays sourced from compiledClasses, so this is already-correctly handled — but the planner should confirm the resulting cross-catalog datasetId state is intentional. | Regenerate atomically with assembler change. Verify CURRENT_DATASET_ID source still resolves correctly. |

**Runtime Q answered:** *After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?* — **Nothing.** Browser SPA reads `compiledRaceCatalog` from a static module import; no caching layer; no IndexedDB row stores per-race curves; no service worker (the optional `vite-plugin-pwa` is mentioned in CLAUDE.md as future work, not yet integrated). Confirmed by grepping `apps/planner/src/features/persistence/` for any reference to `pointBuy` or `puerta-point-buy` — zero matches.

## Common Pitfalls

### Pitfall 1: Atomic re-extract regenerates ALL 5 catalogs and the current nwsync introduces unrelated `race:halfelf2` dup [VERIFIED: Phase 16-01 SUMMARY § "Sibling catalog revert"]

**What goes wrong:** Running `pnpm extract` regenerates `compiled-{classes,races,feats,skills,deities}.ts` from current nwsync state. The 2026-04-26 nwsync state introduces an unrelated `race:halfelf2` Semielfo duplicate at sourceRow 165 that breaks 8 unrelated phase-12.6 + phase-12.8 specs.

**Why it happens:** Single-pass extraction is the documented Puerta extractor design (D-07 in Phase 5.1). Output files are emitted in lockstep. Phase 17 INTENTIONALLY regenerates `compiled-races.ts` (it IS the in-scope catalog), so the dedup issue surfaces inside this phase rather than as collateral.

**How to avoid:** Two viable strategies — pick one in plan-time:
- **(a) Absorb dedup into Phase 17 race-assembler change.** The assembler is already touching that file. Add the `race:halfelf2` dedup logic (filter PlayerRace=1 + Label="HalfElf" duplicate by sourceRow uniqueness, OR enforce canonical-id-uniqueness via `dedupeByCanonicalId` first-wins inside the assembler). Ship the dedup hygiene as part of Phase 17's atomic commit. CONTEXT amendment may be needed (D-07 dedup hygiene) — surface to user.
- **(b) Revert sibling catalogs to baseline + ship Phase 17's `compiled-races.ts` with intentional dedup hygiene applied selectively.** Mirrors Phase 16-01 SUMMARY pattern. Sibling files (`compiled-classes/feats/skills/deities`) revert to their post-Phase-16-01 state; only `compiled-races.ts` ships at `puerta-ee-2026-04-26+...`.

**Recommendation:** (a) — already touching the assembler; Phase 17's value is delivering correct race data, and a known-broken dup is not "correct race data."

**Warning signs:** `corepack pnpm exec vitest run tests/phase-12.6` failing on `point-buy-snapshot-coverage` length mismatch (snapshot expects 45 unique IDs; new catalog ships 46 because `race:halfelf2` is a 46th entry); `tests/phase-12.8/race-roster-dedupe.spec.tsx` (or similar) failing on dedup invariants.

### Pitfall 2: 6 test files mutate `PUERTA_POINT_BUY_SNAPSHOT` at runtime — all must migrate atomically [VERIFIED: Grep `PUERTA_POINT_BUY_SNAPSHOT` across `tests/`]

**What goes wrong:** CONTEXT.md identified `tests/phase-12.6/ability-budget-per-race.spec.ts` as the D-04 atomic-migration target. Reality: 6 test files reference the snapshot (3 outside phase-12.6).

**Files (verified by grep):**
1. `tests/phase-12.6/ability-budget-per-race.spec.ts` (CONTEXT D-04 target — table-driven 45-race + bump-delta + uniformity assertion + `it.todo`)
2. `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` (snapshot-only spec — coverage + sourced-uniformity assertions; **DELETE** post-Phase-17 because the contract it tests no longer exists)
3. `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` (deletes `race:human` from snapshot to manufacture null branch; UI-level fail-closed assertions)
4. `tests/phase-03/summary-status.spec.tsx` (seeds `race:human` + `race:elf` with PRE_12_6_UNIFORM_CURVE in `beforeEach`; cleans up in `afterEach`)
5. `tests/phase-03/attribute-budget.spec.tsx` (seeds `race:human` only; same pattern)
6. `tests/phase-10/attributes-advance.spec.tsx` (seeds `race:human` only; same pattern)

**Why it happens:** These specs were written when the snapshot was empty (Phase 12.6 Plan 02) — they manually inject curves to exercise legal paths. Phase 12.6 Plan 06 populated the snapshot but left the seed-and-cleanup mechanism intact for backward-compat with these pre-12.6 RTL tests.

**How to avoid (per file):**

| File | Migration |
|------|-----------|
| `phase-12.6/ability-budget-per-race.spec.ts` | D-04 explicit. Replace `import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot'` with `import { selectAbilityBudgetRulesForRace } from '@planner/features/character-foundation/selectors'`. Replace `PUERTA_POINT_BUY_SNAPSHOT[raceId]` with `selectAbilityBudgetRulesForRace(raceId)`. Iteration uses `compiledRaceCatalog.races.map((r) => r.id)` (already imported at line 4). The Elfo-vs-Enano sourced-uniformity test (lines 124-152) survives verbatim — it asserts that `selectAbilityBudgetRulesForRace('race:elf')` and `selectAbilityBudgetRulesForRace('race:dwarf')` produce identical rules, which the new pipeline trivially satisfies. The `it.todo` for future variance stays. |
| `phase-12.6/point-buy-snapshot-coverage.spec.ts` | **DELETE.** The contract this spec tests (snapshot file shape + per-race coverage of the dedupeByCanonicalId set) is replaced by: (a) Zod parse at compiled-races module load (existing) + (b) extractor unit spec asserting every race in the regenerated catalog has `abilitiesPointBuyNumber` populated (NEW Phase 17 spec). Coverage is structurally guaranteed by the new pipeline — no separate spec needed. |
| `phase-12.6/attributes-board-fail-closed.spec.tsx` | New seed mechanism: instead of `delete PUERTA_POINT_BUY_SNAPSHOT['race:human']`, mock `selectAbilityBudgetRulesForRace` via `vi.spyOn(...)` OR use `vi.mock('@planner/features/character-foundation/selectors', ...)`. Alternative: pick a test race id that does not exist in `compiledRaceCatalog` (e.g., `'race:does-not-exist'`) — `selectAbilityBudgetRulesForRace` returns `null` for unknown raceIds. Recommendation: latter, simpler. |
| `phase-03/summary-status.spec.tsx` | The PRE_12_6_UNIFORM_CURVE seeds for `race:human` + `race:elf` were defensive: at Plan 02 the snapshot was empty and these races needed curves. Post-Phase-17, the new pipeline ALREADY ships `abilitiesPointBuyNumber=30` for `race:human` and `race:elf` natively. Remove the `beforeEach`/`afterEach` seeding entirely; the test will pass against the populated pipeline. Drop `PUERTA_POINT_BUY_SNAPSHOT` import. |
| `phase-03/attribute-budget.spec.tsx` | Same as above — drop seeding + import; test passes against populated pipeline. |
| `phase-10/attributes-advance.spec.tsx` | Same as above. |

### Pitfall 3: `compiled-races.ts` regeneration produces large cosmetic diff (whitespace, key order) [VERIFIED: emitter at `ts-emitter.ts:48-58` uses `JSON.stringify(data, null, 2)`]

**What goes wrong:** The TS emitter does `JSON.stringify(data, null, 2)`. Object key order in the output is JavaScript-engine-dependent for string keys, but Node guarantees insertion order for non-numeric keys. Therefore the regenerated file *should* be diff-stable IF the assembler emits fields in identical order to the prior catalog. The Phase 17 schema change adds `abilitiesPointBuyNumber` between `abilityAdjustments` and `description` (alphabetical-ish) — this matches the schema definition order, so all 45 races will have the new field inserted in a consistent position.

**Why it matters:** A noisy diff hides the real change. Verify post-regen that the diff shows only `abilitiesPointBuyNumber: 30` insertions (45 of them) and a `datasetId` bump.

**How to avoid:** After `pnpm extract`, run `git diff --stat apps/planner/src/data/compiled-races.ts` and `git diff apps/planner/src/data/compiled-races.ts | head -50` — confirm the diff is structural, not cosmetic. If cosmetic noise creeps in (e.g., whitespace shifts), investigate the emitter or run `prettier` to normalize.

**Warning signs:** Diff hunks unrelated to `abilitiesPointBuyNumber` insertion or `datasetId` change.

### Pitfall 4: SC#4 reframe (D-03) requires synthetic test data — natural null branch unreachable [VERIFIED: racialtypes.2da baseline + Phase 12.6 evidence]

**What goes wrong:** D-03 reframes SC#4 to: "≥3 races resolve to a non-null `AbilityBudgetRules` AND ≥1 race demonstrates the null fail-closed branch." But the truthful catalog (45 races) has `abilitiesPointBuyNumber=30` for **every** entry — there is no naturally-null race.

**Why it happens:** The truthful AbilitiesPointBuyNumber column is populated for all PlayerRace=1 rows (verified at the 19-row baseline; full nwsync's 45-row catalog is sourced-uniform per Phase 12.6 evidence).

**How to avoid:** The new phase-17 SC#4 spec **constructs a synthetic input** (a plain object literal with the right shape) and verifies `deriveAbilityBudgetRules({ abilitiesPointBuyNumber: null })` returns `null`. This is unit-test scaffolding for a code branch — **NOT** production data fabrication — so it does not violate D-NO-hardcoded-data. Equivalent options:

- Test the helper directly: `expect(deriveAbilityBudgetRules({ abilitiesPointBuyNumber: null })).toBe(null);`
- Test the selector's unknown-raceId path: `expect(selectAbilityBudgetRulesForRace('race:does-not-exist' as CanonicalId)).toBe(null);` — this routes through the second null branch in the rewired selector (`if (!race) return null;`).

Both are legitimate fail-closed coverage; the new spec should cover both.

**Warning signs:** Reviewer challenges the synthetic input as "fake data" — defend by citing the helper's pure-function shape (it accepts plain objects, not `CompiledRace` instances) and the established testing precedent (`tests/phase-06/feat-eligibility.spec.ts` constructs `BuildStateAtLevel` literals via `createBuildState` factory).

### Pitfall 5: `point-buy-snapshot.ts` fail-closed assertion at module load is replaced by Zod parse on `compiledRaceCatalog` [VERIFIED: point-buy-snapshot.ts:47-48 + compiled-races.ts:6 (`raceCatalogSchema.parse(...)`)]

**What goes wrong:** `point-buy-snapshot.ts` ships a runtime contract: "if `puerta-point-buy.json` is malformed, Zod throws before the app bundle initialises." Deleting the file removes this guarantee — but only because the *source* of fail-closed validation moves.

**Why it doesn't matter:** `compiled-races.ts:6` already calls `raceCatalogSchema.parse({...})` at module load. Adding `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional()` makes that parse the new fail-closed gate for per-race budget values. Net coverage is identical; the Zod throw moves from one module-load to another.

**How to verify:** Add a unit test that constructs a malformed catalog object (`abilitiesPointBuyNumber: 'not-a-number'`) and asserts `raceCatalogSchema.parse(...)` throws. This proves the fail-closed contract migrated cleanly.

### Pitfall 6: `selectAbilityBudgetRulesForRace`'s return type changes from `PointBuyCurve | null` to `AbilityBudgetRules | null` [VERIFIED: selectors.ts:60-65 + ability-budget.ts:11-16]

**What goes wrong:** TypeScript will report breaking changes anywhere `PointBuyCurve` is used as the return type narrowed in the consumer. Currently `selectors.ts:5` imports `PointBuyCurve` from `point-buy-snapshot`. After Phase 17, the selector returns `AbilityBudgetRules`.

**Why it might not matter:** `PointBuyCurve` and `AbilityBudgetRules` have **structurally identical shapes** (both `{ budget: number; minimum: number; maximum: number; costByScore: Record<string, number> }`). TypeScript structural typing means anywhere `PointBuyCurve` was consumed positionally, `AbilityBudgetRules` works as a drop-in replacement.

**How to avoid:** Grep for `PointBuyCurve` across `apps/`, `packages/`, and `tests/` after the migration. Replace with `AbilityBudgetRules` (or with implicit type inference where unnecessary).

```bash
grep -rn "PointBuyCurve" apps/ packages/ tests/
```

Expected post-Phase-17 result: zero matches (the only uses today are inside `point-buy-snapshot.ts` itself + `selectors.ts:6` + `tests/phase-12.6/attributes-board-fail-closed.spec.tsx:30`).

## Code Examples

### Example 1: Extractor schema extension [VERIFIED: Phase 16-01 PATTERNS.md analog]

```typescript
// packages/data-extractor/src/contracts/race-catalog.ts (FULL POST-PHASE-17 SHAPE)
import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';
import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const RACE_SIZES = ['small', 'medium', 'large'] as const;

export const compiledRaceSchema = z.object({
  abilityAdjustments: z.record(z.enum(ABILITY_KEYS), z.number().int()),
  abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional(), // ← NEW (Phase 17)
  description: z.string(),
  favoredClass: z.string().regex(canonicalIdRegex).nullable(),
  id: z.string().regex(/^race:[A-Za-z0-9._-]+$/),
  label: z.string().min(1),
  size: z.enum(RACE_SIZES),
  sourceRow: z.number().int().nonnegative(),
});

// raceCatalogSchema.schemaVersion: z.literal('1') — UNCHANGED per D-06.
```

### Example 2: Assembler row-loop insertion [SOURCE: race-assembler.ts:101-174 existing pattern]

```typescript
// packages/data-extractor/src/assemblers/race-assembler.ts
// Insert in the per-row loop AFTER sentinel filter (line 116), AFTER abilityAdjustments
// computation (lines 128-142), BEFORE the favoredClass + size resolution (lines 145-163),
// and BEFORE races.push (line 165).

// ─── Phase 17 insertion ───
const abilitiesPointBuyRaw = row.AbilitiesPointBuyNumber;
let abilitiesPointBuyNumber: number | null = null;
if (abilitiesPointBuyRaw != null) {
  const parsed = parseInt(abilitiesPointBuyRaw, 10);
  if (Number.isFinite(parsed) && parsed >= 0) {
    abilitiesPointBuyNumber = parsed;
  } else {
    warnings.push(
      `Race row ${rowIndex} (${label}): invalid AbilitiesPointBuyNumber '${abilitiesPointBuyRaw}'`,
    );
  }
}
// ─────────────────────────

// existing favoredClass + size lookup ...

races.push({
  abilityAdjustments,
  abilitiesPointBuyNumber,         // ← NEW
  description: resolvedDesc,
  favoredClass,
  id,
  label: displayLabel,
  size,
  sourceRow: rowIndex,
});
```

### Example 3: Cost-table constant + helper [SOURCE: this RESEARCH § Pattern 3]

```typescript
// packages/rules-engine/src/foundation/ability-budget.ts
// Append after `canIncrementAttribute` (current line 69). Keeps cohesion.

/**
 * Phase 17 (ATTR-02 D-02) — NWN1 hardcoded engine point-buy cost step.
 *
 * Source-of-truth: NWN1 EE engine binary (not 2DA-driven). User-confirmed
 * 2026-04-20 in-game verification. See git history of
 * `packages/rules-engine/src/foundation/data/puerta-point-buy.md` (deleted
 * in Phase 17; commit `bf55129` and earlier preserve the provenance text).
 *
 * Bands: 1:1 from 8→14 (6 pts), 2:1 from 14→16 (4 pts), 3:1 from 16→18 (6 pts).
 * Total 8→18 = 16 cost.
 */
export const NWN1_POINT_BUY_COST_TABLE = {
  minimum: 8,
  maximum: 18,
  costByScore: {
    '8': 0, '9': 1, '10': 2, '11': 3, '12': 4, '13': 5,
    '14': 6, '15': 8, '16': 10, '17': 13, '18': 16,
  },
} as const satisfies {
  minimum: number;
  maximum: number;
  costByScore: Record<string, number>;
};

/**
 * Phase 17 (ATTR-02 D-02a) — compose race + cost-table → AbilityBudgetRules
 * or null. Pure, framework-agnostic. Selector composes the call.
 *
 * Returns null when race.abilitiesPointBuyNumber is null/undefined,
 * preserving Phase 12.6 D-05 fail-closed contract for rule:point-buy-missing.
 */
export function deriveAbilityBudgetRules(
  race: { abilitiesPointBuyNumber: number | null | undefined },
  costTable: typeof NWN1_POINT_BUY_COST_TABLE = NWN1_POINT_BUY_COST_TABLE,
): AbilityBudgetRules | null {
  if (race.abilitiesPointBuyNumber == null) return null;
  return {
    budget: race.abilitiesPointBuyNumber,
    minimum: costTable.minimum,
    maximum: costTable.maximum,
    costByScore: costTable.costByScore,
  };
}

// Promote AbilityBudgetRules from `interface` to `export interface` (current line 11).
export interface AbilityBudgetRules {
  budget: number;
  costByScore: Record<string, number>;
  maximum: number;
  minimum: number;
}
```

### Example 4: Selector rewire [SOURCE: selectors.ts:1-65 existing import + lookup pattern]

```typescript
// apps/planner/src/features/character-foundation/selectors.ts (TOP OF FILE + L60-65)

// REMOVE:
// import { PUERTA_POINT_BUY_SNAPSHOT, type PointBuyCurve }
//   from '@rules-engine/foundation/point-buy-snapshot';

// ADD (or extend the existing line 3 import):
import {
  calculateAbilityBudgetSnapshot,
  deriveAbilityBudgetRules,
  type AbilityBudgetRules,
} from '@rules-engine/foundation/ability-budget';

// `compiledRaceCatalog` is already imported at line 13.

/**
 * Phase 17 (ATTR-02) — per-race point-buy curve resolution.
 *
 * Reads `compiledRaceCatalog.races[].abilitiesPointBuyNumber` (sourced from
 * `racialtypes.2da:AbilitiesPointBuyNumber` at extract time) and composes
 * with `NWN1_POINT_BUY_COST_TABLE`. Returns null when raceId is null OR
 * unknown OR the race's `abilitiesPointBuyNumber` is null. Null routes
 * through `calculateAbilityBudgetSnapshot`'s null branch (Phase 12.6 D-05),
 * which emits rule:point-buy-missing.
 */
export function selectAbilityBudgetRulesForRace(
  raceId: CanonicalId | null,
): AbilityBudgetRules | null {
  if (!raceId) return null;
  const race = compiledRaceCatalog.races.find((r) => r.id === raceId);
  if (!race) return null;
  return deriveAbilityBudgetRules(race);
}
```

### Example 5: Phase 17 SC#4 spec [SOURCE: this RESEARCH § Pitfall 4]

```typescript
// tests/phase-17/per-race-point-buy-selector.spec.ts (NEW)
import { describe, expect, it } from 'vitest';
import { selectAbilityBudgetRulesForRace } from '@planner/features/character-foundation/selectors';
import {
  deriveAbilityBudgetRules,
  NWN1_POINT_BUY_COST_TABLE,
} from '@rules-engine/foundation/ability-budget';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

/**
 * Phase 17 (ATTR-02 SC#4 — D-03 reframe).
 *
 * Original SC#4: "specs cover ≥3 races with distinct curves."
 * Reframed (D-03): schema-shape coverage — ≥3 dedupe-canonical races resolve
 * to non-null AbilityBudgetRules via the selector, AND ≥1 race demonstrates
 * the null fail-closed branch (synthetic or naturally-null).
 *
 * "Distinct curves" literal dropped: per Phase 12.6 evidence, the truthful
 * client-side dataset is sourced-uniform (racialtypes.2da AbilitiesPointBuyNumber=30
 * + NWN1 hardcoded engine cost step). Coverage spec asserts pipeline correctness,
 * not value variance.
 */
describe('Phase 17 — SC#4 reframe: per-race point-buy pipeline coverage', () => {
  it('≥3 races resolve to non-null AbilityBudgetRules via selectAbilityBudgetRulesForRace', () => {
    const sampleRaceIds: CanonicalId[] = ['race:human', 'race:elf', 'race:dwarf'] as CanonicalId[];
    for (const raceId of sampleRaceIds) {
      const rules = selectAbilityBudgetRulesForRace(raceId);
      expect(rules).not.toBeNull();
      expect(rules!.budget).toBeGreaterThan(0);
      expect(rules!.minimum).toBe(NWN1_POINT_BUY_COST_TABLE.minimum);
      expect(rules!.maximum).toBe(NWN1_POINT_BUY_COST_TABLE.maximum);
      expect(rules!.costByScore).toEqual(NWN1_POINT_BUY_COST_TABLE.costByScore);
    }
  });

  it('selector returns null for unknown raceId (fail-closed branch via "race not in catalog")', () => {
    const rules = selectAbilityBudgetRulesForRace('race:does-not-exist' as CanonicalId);
    expect(rules).toBeNull();
  });

  it('selector returns null for null raceId (fail-closed branch via "no race selected")', () => {
    expect(selectAbilityBudgetRulesForRace(null)).toBeNull();
  });

  it('deriveAbilityBudgetRules returns null when abilitiesPointBuyNumber is null (synthetic input)', () => {
    expect(deriveAbilityBudgetRules({ abilitiesPointBuyNumber: null })).toBeNull();
    expect(deriveAbilityBudgetRules({ abilitiesPointBuyNumber: undefined })).toBeNull();
  });

  it('deriveAbilityBudgetRules composes correctly when abilitiesPointBuyNumber is populated', () => {
    const result = deriveAbilityBudgetRules({ abilitiesPointBuyNumber: 30 });
    expect(result).toEqual({
      budget: 30,
      minimum: 8,
      maximum: 18,
      costByScore: NWN1_POINT_BUY_COST_TABLE.costByScore,
    });
  });

  it('every race in compiledRaceCatalog has abilitiesPointBuyNumber populated post-Phase-17 pipeline', () => {
    // Coverage assertion replacing the deleted point-buy-snapshot-coverage spec.
    // This is the pipeline equivalent of "snapshot covers every race."
    for (const race of compiledRaceCatalog.races) {
      expect(race.abilitiesPointBuyNumber).not.toBeUndefined();
      // Per Phase 12.6 sourced-uniformity finding, every race ships 30.
      // If a future race ships null (server-script override), this test
      // surfaces it loudly — flip to `.toBeGreaterThanOrEqual(0).or.toBeNull()`.
      expect(race.abilitiesPointBuyNumber).toBe(30);
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-authored `puerta-point-buy.json` snapshot loaded at module init by `point-buy-snapshot.ts` | Extractor pipeline emits `abilitiesPointBuyNumber` on `compiledRaceSchema`; rules-engine ships single cost-table constant; selector composes | Phase 17 (this phase) | Removes hand-authoring drift surface; aligns Phase 12.6 D-NO-hardcoded-data principle with implementation; clarifies that NWN1 cost step is engine canon (one constant) vs server data (per-race budget). |
| `PUERTA_POINT_BUY_SNAPSHOT[raceId]` direct dict lookup | `selectAbilityBudgetRulesForRace(raceId) → deriveAbilityBudgetRules(race, costTable)` | Phase 17 | Same return shape; same fail-closed contract; new source of truth. |
| Phase 12.6 ad-hoc seeding of `PUERTA_POINT_BUY_SNAPSHOT['race:human']` in pre-12.6 RTL specs | Pre-populated catalog — no seeding needed | Phase 17 (atomic migration in Wave 3) | 3 phase-03/10 specs simplify; 1 phase-12.6 spec swaps seed mechanism to unknown-raceId or `vi.spyOn`. |

**Deprecated/outdated:**
- `point-buy-snapshot.ts` module: delete entirely.
- `puerta-point-buy.json`: delete (data → extractor).
- `puerta-point-buy.md`: delete (provenance → git history).
- `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts`: delete (contract migrated).
- `PointBuyCurve` type alias: replaced by `AbilityBudgetRules` (structurally identical).
- `pointBuyCurveSchema`, `pointBuySnapshotSchema` Zod schemas: deleted with the module.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The current full nwsync ships `racialtypes.2da` with **all 45 catalog-emitted races** carrying populated `AbilitiesPointBuyNumber` (uniform 30) — the same sourced-uniformity Phase 12.6 evidence assumed. The `.planning/phases/05-skills-derived-statistics/server-extract/racialtypes.2da` baseline has only 19 PlayerRace=1 rows; the runtime nwsync at extract time has more (Puerta custom races with sourceRow ≥ 160). I verified the column header is present in the baseline file; I did NOT directly verify the value at extract time on every Puerta custom row. | Pattern 2; SC#4 spec design | If a Puerta custom race ships `****` in `AbilitiesPointBuyNumber`, the new pipeline emits `abilitiesPointBuyNumber: null` for that race, AND the SC#4 spec's "every race ships 30" assertion (Example 5 line ~75) flips RED on regen. This is not a Phase 17 failure — it is the truthful state surfacing. The planner should soften the assertion to `.toBeGreaterThanOrEqual(0).or.toBeNull()` if surfacing is preferred over locking the uniform-30 invariant. **Recommendation:** soften the assertion; the uniform-30 lock is a Phase 12.6 *finding* on hand-authored data, not a Phase 17 *contract* on extracted data. Phase 17 should ship truthful diversity if the data shows it. |
| A2 | The `race:halfelf2` Semielfo dup that broke Phase 16-01 will recur on `pnpm extract` in Phase 17 because nwsync state has not changed since 2026-04-26. CONTEXT § Specifics line 126 explicitly flags this. | Pitfall 1 | If the dup does NOT recur (e.g., user re-pulled nwsync between 16-01 and 17), the dedup hygiene step is unnecessary work but not harmful. If it DOES recur and Phase 17 ignores it, ~8 phase-12.6+12.8 specs go red on the regenerated catalog. **Mitigation:** plan-time check — run `pnpm extract` once, inspect `apps/planner/src/data/compiled-races.ts` for `race:halfelf2` occurrences before scoping the dedup work. |
| A3 | `AbilityBudgetRules` and `PointBuyCurve` types are structurally identical and can be swapped 1:1 in TypeScript. I read both definitions (`ability-budget.ts:11-16` and `point-buy-snapshot.ts:13-32`) — they share the same 4 fields with identical types. | Pitfall 6 | If a refinement on `pointBuyCurveSchema` (lines 23-32 of point-buy-snapshot.ts) had no equivalent in `AbilityBudgetRules` (which is just an interface, no Zod refinements), the runtime behavior could subtly drift. **Mitigation:** the `min ≤ max` and "costByScore keys within [min, max]" refinements live on the snapshot-load path which Phase 17 deletes. The new path validates per-race `abilitiesPointBuyNumber` via Zod (`int().nonnegative()`) + uses a hardcoded constant for `costByScore` (which by construction satisfies the refinements). Refinements migrate implicitly. |
| A4 | No project skill packs (`.claude/skills/*/SKILL.md`) exist in the repo. I checked `.claude/skills/` and found no entries. | Project Skills (n/a) | Skill packs would constrain or inform research; their absence means no surprise constraints. Verified by `ls .claude/skills/`. |

**If the planner can verify A1+A2 with a one-time `pnpm extract` dry-run before authoring plans, all four assumptions become VERIFIED.**

## Open Questions

1. **Should Phase 17 ship the `race:halfelf2` dedup hygiene fix in scope?**
   - What we know: Phase 16-01 SUMMARY documents the dup as "unrelated drift" reverted via sibling-catalog reset. CONTEXT.md § Specifics line 126 anticipates Phase 17 hitting it.
   - What's unclear: whether Phase 17's CONTEXT D-NO-... rules permit fixing it in-band, or whether it needs its own micro-phase.
   - Recommendation: surface to user as CONTEXT amendment D-07 ("dedup hygiene in-scope"); the assembler is already touching this file; splitting into a separate phase is overhead with no benefit.

2. **Does the Phase 17 SC#4 spec assert "every race ships 30" (locking sourced-uniformity) or "every race ships ≥0 OR null" (allowing surfacing of natural variance)?**
   - What we know: Phase 12.6 sourced-uniformity asserted 30 against hand-authored data. Phase 17 ships extracted data.
   - What's unclear: if the truthful runtime nwsync has any non-30 row (Puerta custom races at sourceRow ≥ 95).
   - Recommendation: plan-time dry-run `pnpm extract` and inspect. If all races ship 30, lock 30 (catches future variance). If some ship variance, soften to `.toBeGreaterThanOrEqual(0).or.toBeNull()` and pin the "≥3 non-null + ≥1 null OR all 45 non-null with uniform 30" disjunction.

3. **Should `AbilityBudgetRules` move from `interface` to `type` to match the structural-typing pattern Phase 16-02 used for `compiledClass?: CompiledClass | null`?**
   - What we know: `interface` + `type` are equivalent for plain object shapes in TypeScript. Phase 12.6 chose `interface`.
   - Recommendation: keep `interface`. Zero behavior difference; minimum-diff change.

4. **Should the `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` deletion happen in Wave 2 (with the snapshot file deletion) or Wave 3 (with the spec migration sweep)?**
   - Recommendation: Wave 3 — keeps "delete-the-spec-that-tests-the-deleted-thing" inside the atomic test-migration commit. Cleaner story.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All build/test | ✓ | (project requires 24.x LTS) | — |
| pnpm | Workspace + extract command | ✓ | 10.0.0 (per `package.json`) | — |
| `corepack` | Wraps pnpm invocations in tests/CI | ✓ | (Node bundled) | direct `pnpm` ok |
| TypeScript compiler | Typecheck gate | ✓ | 5.9.2 | — |
| Vitest | All specs | ✓ | 4.0.16 | — |
| `better-sqlite3` | nwsync read at extract time | ✓ | 12.9.0 | — |
| nwsync data files (Puerta manifest) | `pnpm extract` runtime | ✓ | (assumed local; same as Phase 16-01) | If absent, base-game fallback per `assembleRaceCatalog` lines 70-76; PlayerRace filter still applies; fewer races emitted but Phase 17 schema/code still ship. |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `corepack pnpm exec vitest run tests/phase-17/<spec> --reporter=dot` |
| Full suite command | `corepack pnpm exec vitest run` |
| Estimated runtime | ~10s for `tests/phase-17/**`; ~2 min full suite |

**Note:** New `tests/phase-17/**/*.spec.ts` files run in **node env** by default — no `vitest.config.ts` glob entry needed unless a `.spec.tsx` arrives. All Phase 17 specs are pure `.spec.ts` (extractor + rules-engine + selector), so node env is correct.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ATTR-02 (extractor surface) | `compiledRaceSchema` accepts `abilitiesPointBuyNumber: int \| null \| undefined`; `race-assembler.ts` emits the field for every race row | unit (extractor) | `pnpm exec vitest run tests/phase-17/per-race-point-buy-extractor.spec.ts` | ❌ Wave 0 |
| ATTR-02 (rules-engine helper) | `deriveAbilityBudgetRules` composes correctly; returns `null` when input null/undefined | unit (rules-engine) | `pnpm exec vitest run tests/phase-17/derive-ability-budget-rules.spec.ts` | ❌ Wave 0 |
| ATTR-02 (selector rewire) | `selectAbilityBudgetRulesForRace(raceId)` reads compiledRaceCatalog + composes via helper; returns null on unknown raceId | unit (selector) | `pnpm exec vitest run tests/phase-17/per-race-point-buy-selector.spec.ts` | ❌ Wave 0 |
| ATTR-02 SC#1 (sourced) | Phase-12.6 ability-budget-per-race spec migrates to new pipeline; preserves 45-race table-driven baseline + bump-delta | unit (regression) | `pnpm exec vitest run tests/phase-12.6/ability-budget-per-race.spec.ts` | ✅ exists (migrate) |
| ATTR-02 SC#2 (consumes catalog) | `calculateAbilityBudgetSnapshot` happy path through the rewired selector — 30 budget, baseline {8×6} legal | unit (regression) | (covered by phase-12.6 spec migration) | ✅ exists |
| ATTR-02 SC#3 (board reflects cost) | UI fail-closed callout still renders when selector returns null | RTL (jsdom regression) | `pnpm exec vitest run tests/phase-12.6/attributes-board-fail-closed.spec.tsx` | ✅ exists (migrate seed) |
| ATTR-02 SC#4 (D-03 reframe) | ≥3 races resolve to non-null AND ≥1 to null via selector + helper | unit (Phase 17 SC#4) | `pnpm exec vitest run tests/phase-17/per-race-point-buy-selector.spec.ts` | ❌ Wave 0 |
| ATTR-02 SC#1 (regen) | `compiled-races.ts` regenerated atomically; every race ships `abilitiesPointBuyNumber` | unit (extractor coverage) | (covered by extractor spec) | ❌ Wave 0 |
| Snapshot retirement | `puerta-point-buy.{json,md,ts}` removed; foundation barrel cleaned | structural | `git status` + `grep -r "puerta-point-buy" packages/ apps/ tests/` (zero matches) | structural |
| UAT A1 closure | UAT-FINDINGS-2026-04-20.md A1 carries CLOSED-BY footer | docs | manual review | structural |

### Sampling Rate

- **Per task commit:** `corepack pnpm exec vitest run tests/phase-17/<changed-spec> --reporter=dot`
- **Per wave merge:** `corepack pnpm exec vitest run tests/phase-03 tests/phase-10 tests/phase-12.6 tests/phase-17 --reporter=dot` (covers all 6 affected files + new specs)
- **Phase gate:** `corepack pnpm exec vitest run` full suite green + `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` exit 0 before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `tests/phase-17/per-race-point-buy-extractor.spec.ts` — covers ATTR-02 extractor surface (Wave 1 RED gate).
- [ ] `tests/phase-17/derive-ability-budget-rules.spec.ts` — covers helper composition + null-branch (Wave 2 RED gate).
- [ ] `tests/phase-17/per-race-point-buy-selector.spec.ts` — covers SC#4 reframe (Wave 3 RED gate).
- [ ] No new framework install. No vitest.config.ts changes (phase-17/*.spec.ts files inherit node env via default `tests/**/*.spec.ts` include).

*(Existing test infrastructure covers all Phase 17 requirements after the 3 new specs above land.)*

## Project Constraints (from CLAUDE.md)

- **Spanish-first surface (`apps/planner/src/lib/copy/es.ts`).** Phase 17 ships zero UI changes. The existing `point-buy-missing-callout` Spanish copy ("Curva punto-compra no disponible para …") survives verbatim — D-NO-COPY trivially honored.
- **Strict rules fidelity (block, not warn).** The new fail-closed branch behavior is unchanged: `null` selector return → `rule:point-buy-missing` blocked status → all increment buttons disabled. Phase 12.6 D-05 contract preserved.
- **D-NO-hardcoded-data ("verify against game files").** Phase 17 IS this principle's implementation: hand-authored snapshot retires; extractor pipeline becomes source-of-truth. The `NWN1_POINT_BUY_COST_TABLE` constant is engine canon (NWN1 binary, not server data) — exempt from D-NO-hardcoded-data per Phase 12.6 D-02 user-confirmed evidence.
- **Static GitHub Pages deployment.** Phase 17 changes a static-bundle artifact (`compiled-races.ts`) and rules-engine module — no runtime/server impact. `BUILD_ENCODING_VERSION` stays at 2 per D-06.
- **Strict TypeScript (5.9.2 + tsc --noEmit gate).** Schema additive change is type-compatible; `AbilityBudgetRules` export is non-breaking; `PUERTA_POINT_BUY_SNAPSHOT` deletion is hard but every consumer is enumerated for atomic migration.

## Sources

### Primary (HIGH confidence)
- `packages/data-extractor/src/contracts/race-catalog.ts` (lines 9-37) — current `compiledRaceSchema` shape; Phase 17 insertion point.
- `packages/data-extractor/src/assemblers/race-assembler.ts` (full file, 244 lines) — per-row loop pattern; existing `parseInt`/`Number.isFinite` guard idiom at lines 121-124, 128-142, 156-162.
- `packages/data-extractor/src/parsers/two-da-parser.ts` (lines 117-138) — `parseTwoDa` already coerces `'****'` to `null` in row records; assembler tests `value != null` not `value !== '****'`.
- `packages/rules-engine/src/foundation/ability-budget.ts` (full file, 158 lines) — current `AbilityBudgetRules` interface + null branch + `nextIncrementCost` + `canIncrementAttribute` + `calculateAbilityBudgetSnapshot`.
- `packages/rules-engine/src/foundation/point-buy-snapshot.ts` (full file, 48 lines) — current snapshot loader (target for deletion).
- `packages/rules-engine/src/foundation/index.ts` — barrel exports including `point-buy-snapshot` line.
- `packages/rules-engine/src/foundation/data/puerta-point-buy.json` (45 entries, all uniform `{budget: 30, minimum: 8, maximum: 18, costByScore: <NWN1>}`) — current snapshot.
- `packages/rules-engine/src/foundation/data/puerta-point-buy.md` (Plan 06 Source Resolution section, lines 16-34) — provenance + user-confirmed engine curve evidence.
- `apps/planner/src/features/character-foundation/selectors.ts` (lines 1-65, 251-262) — current selector + consumer chain (line 258 `attributeRules: selectAbilityBudgetRulesForRace(state.raceId)`).
- `apps/planner/src/data/compiled-races.ts` — current 45-entry artifact at `puerta-ee-2026-04-17+cf6e8aad`.
- `apps/planner/src/data/ruleset-version.ts` — `CURRENT_DATASET_ID` sourced from `compiledClassCatalog.datasetId`.
- `vitest.config.ts` — environmentMatchGlobs (no phase-17 glob present; node env applies by default for `.spec.ts`).
- `tests/phase-12.6/ability-budget-per-race.spec.ts` (full file, 158 lines) — D-04 atomic-migration target; behavior pin.
- `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` (full file, 116 lines) — DELETE target.
- `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` (full file, 130 lines) — seed-mechanism migration target.
- `tests/phase-03/summary-status.spec.tsx` (lines 1-70) — pre-12.6 seeder.
- `tests/phase-03/attribute-budget.spec.tsx` (lines 1-85) — pre-12.6 seeder.
- `tests/phase-10/attributes-advance.spec.tsx` (lines 1-75) — pre-12.6 seeder.
- `.planning/phases/16-feat-engine-completion/16-01-PLAN.md` — additive optional nullable field pattern; load2da copy-paste; atomic re-extract.
- `.planning/phases/16-feat-engine-completion/16-01-SUMMARY.md` — sibling-catalog revert pattern; halfelf2 dup; PIT-01 cadence dossier; 4-block primary spec template.
- `.planning/phases/16-feat-engine-completion/16-02-SUMMARY.md` — atomic fixture migration pattern (5 spec files migrated alongside source change); B-01 architectural decision (rules-engine framework-agnostic boundary).
- `.planning/phases/16-feat-engine-completion/16-PATTERNS.md` (lines 70-160) — `load2da` + assembler insertion + warning idiom + Pattern S1 + Pattern S7.
- `.planning/phases/05-skills-derived-statistics/server-extract/racialtypes.2da` — verified column header includes `AbilitiesPointBuyNumber`; verified all PlayerRace=1 rows ship `30` in baseline file.
- `.planning/phases/17-per-race-point-buy/17-CONTEXT.md` — full upstream constraints.
- `.planning/REQUIREMENTS.md` § ATTR-02 — requirement text.
- `.planning/ROADMAP.md` § Phase 17 — original SC; SC#4 reframed via D-03.
- `.planning/UAT-FINDINGS-2026-04-20.md` § A1 (lines 56-71) — UAT entry to close.
- `CLAUDE.md` — Spanish-first, strict rules, static GitHub Pages, D-NO-hardcoded-data principle.

### Secondary (MEDIUM confidence)
- Phase 12.6 evidence chain: `puerta-point-buy.md § "Plan 06 Source Resolution"` → user-confirmed in-game NWN1 curve verification 2026-04-20. Treated as primary evidence given the multi-spec confirmation chain (12.6 specs + roadmap reframe + CONTEXT D-02).

### Tertiary (LOW confidence)
- None. All Phase 17 design decisions trace to existing source code, existing Phase 12.6 evidence, or Phase 16-01/02 precedent.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every primitive verified in source.
- Architecture: HIGH — pattern transferred from Phase 16-01/02.
- Pitfalls: HIGH — Pitfalls 1, 2, 3, 6 verified by direct source/grep; Pitfalls 4, 5 are reasoned-from-code.
- Snapshot importer enumeration: HIGH — exhaustive grep across `apps/`, `packages/`, `tests/`.
- A1 (full-nwsync uniformity): MEDIUM — baseline 2DA uniformity verified; runtime nwsync state un-verified (planner can settle with one-shot dry-run).

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days; stable area — only invalidator is upstream nwsync change or new project skill packs landing).
