---
phase: 17-per-race-point-buy
created: 2026-04-26
mode: pattern-mapping
---

# Phase 17 — Per-Race Point-Buy · PATTERNS

**Mapped:** 2026-04-26
**Files analyzed:** 16 (2 modify-extractor · 1 regenerate · 2 modify-rules-engine · 1 modify-selector · 5 migrate-tests · 3 create-tests · 4 delete · 1 doc footer)
**Analogs found:** 16 / 16 — every file has a direct in-repo analog (mostly Phase 16 precedent + self-extension).

> **Cross-reference:** This map heavily reuses Phase 16-01/16-02 PATTERNS.md. Where this file says "Phase 16 S1" or "Phase 16 S7" it refers to `.planning/phases/16-feat-engine-completion/16-PATTERNS.md` Shared Patterns S1 (load2da resref-resolution) and S7 (read compiled-class metadata at the consumer boundary / framework-agnostic rules-engine). Phase 17 is a thin Phase-16-shaped data-source migration with **no UI changes**.

---

## File Classification

| Action | File | Role | Data Flow | Closest Analog | Match Quality |
|--------|------|------|-----------|----------------|---------------|
| Modify | `packages/data-extractor/src/contracts/race-catalog.ts` | contract (Zod schema) | transform | self · Phase 16-01 `compiledClassSchema.bonusFeatSchedule` (16-PATTERNS.md L43-67) | exact — additive optional nullable field |
| Modify | `packages/data-extractor/src/assemblers/race-assembler.ts` | assembler (build-time CLI) | batch / file-I/O | self (in-file `parseInt`/`Number.isFinite` guards @ L121-142, L147-152, L156-162) + Phase 16-01 16-PATTERNS.md S1 | exact — same per-row column-read shape; no `load2da` needed (table already loaded @ L66-76) |
| Regenerate | `apps/planner/src/data/compiled-races.ts` | generated artifact | regenerate | itself (Phase 16-01 SUMMARY § "Sibling regenerated catalogs reverted") | n/a — overwritten by `pnpm extract` |
| Modify | `packages/rules-engine/src/foundation/ability-budget.ts` | rules-engine (pure) | transform | self (`AbilityBudgetRules` interface @ L11-16; `nextIncrementCost` + `canIncrementAttribute` @ L40-69) | exact — append constant + helper, promote interface to exported |
| Modify | `packages/rules-engine/src/foundation/index.ts` | barrel | static | self (current export list L1-6) | exact — remove one line |
| Modify | `apps/planner/src/features/character-foundation/selectors.ts` | selector (pure projection) | transform | self (`selectAbilityBudgetRulesForRace` @ L60-65 + existing `compiledRaceCatalog` use @ L172-175) | exact — swap import + lookup body |
| Migrate | `tests/phase-12.6/ability-budget-per-race.spec.ts` | test (vitest, node env) | request-response | self (current 158-line spec) + Phase 16-02 SUMMARY § atomic fixture migration | exact — swap import + iteration source |
| Migrate | `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` | test (vitest, jsdom + RTL) | event-driven | self (current `delete PUERTA_POINT_BUY_SNAPSHOT['race:human']` mechanism @ L52-66) | exact — swap seed mechanism to unknown-raceId |
| Migrate | `tests/phase-03/summary-status.spec.tsx` | test (vitest, jsdom + RTL) | event-driven | self (`PRE_12_6_UNIFORM_CURVE` seed @ L17-50) | exact — drop seeds entirely (catalog ships native curve) |
| Migrate | `tests/phase-03/attribute-budget.spec.tsx` | test (vitest, jsdom + RTL) | request-response | self (`PRE_12_6_UNIFORM_CURVE` seed @ L14-72) | exact — drop seeds entirely |
| Migrate | `tests/phase-10/attributes-advance.spec.tsx` | test (vitest, jsdom + RTL) | event-driven | self (`PRE_12_6_UNIFORM_CURVE` seed @ L19-60) | exact — drop seeds entirely |
| Create | `tests/phase-17/per-race-point-buy-extractor.spec.ts` | test (vitest, node env) | request-response | Phase 16-01 `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` (16-PATTERNS L165-186) + `tests/phase-12.4/extractor-deleted-sentinel.spec.ts:1-30` | exact — extractor catalog assertion shape |
| Create | `tests/phase-17/derive-ability-budget-rules.spec.ts` | test (vitest, node env) | request-response | `tests/phase-12.6/ability-budget-per-race.spec.ts` (rules-engine pure-helper assertions L30-78) | exact — pure helper, node env |
| Create | `tests/phase-17/per-race-point-buy-selector.spec.ts` | test (vitest, node env) | request-response | self (RESEARCH § Code Examples 5 skeleton at L630-701) + Phase 16-PATTERNS S2 (build-state factory) | exact — selector + helper coverage |
| Delete | `packages/rules-engine/src/foundation/data/puerta-point-buy.json` | data fixture | n/a | n/a — hard delete | n/a |
| Delete | `packages/rules-engine/src/foundation/data/puerta-point-buy.md` | provenance dossier | n/a | n/a — hard delete (preserved via git history) | n/a |
| Delete | `packages/rules-engine/src/foundation/point-buy-snapshot.ts` | rules-engine module | n/a | n/a — hard delete | n/a |
| Delete | `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` | test | n/a | n/a — contract retired | n/a |
| Modify | `.planning/UAT-FINDINGS-2026-04-20.md` | doc footer | static | self (existing CLOSED-BY footer pattern from Phase 16) | exact — add D-05 footer |

---

## Pattern Assignments

### `packages/data-extractor/src/contracts/race-catalog.ts` (contract, transform)

**Analog:** self (current shape L9-17) + Phase 16-PATTERNS.md S1 (additive optional nullable; "Field to add" pattern) — direct transfer of the bonusFeatSchedule shape.

**Existing schema (race-catalog.ts:9-17)** — additive insertion point between `abilityAdjustments` (L10) and `description` (L11):
```typescript
export const compiledRaceSchema = z.object({
  abilityAdjustments: z.record(z.enum(ABILITY_KEYS), z.number().int()),
  description: z.string(),
  favoredClass: z.string().regex(canonicalIdRegex).nullable(),
  id: z.string().regex(/^race:[A-Za-z0-9._-]+$/),
  label: z.string().min(1),
  size: z.enum(RACE_SIZES),
  sourceRow: z.number().int().nonnegative(),
});
```

**Field to add** (alphabetical-ish; mirror Phase 16-01's `bonusFeatSchedule` stance):
```typescript
abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional(),
```

**Why `.nonnegative()` not `.positive()`:** `0` is syntactically valid (means "no points to spend"). Phase 16-01 used `.positive()` because feat slot levels are 1-indexed; budget points are 0-indexed.

**Why `.optional()` despite the assembler always emitting:** forward-compat with extractor-mid-row-crash partial entries. Phase 16-01 set this precedent; deviate at no benefit.

**Schema version (L31):** `z.literal('1')` STAYS `'1'` per CONTEXT D-06. No bump.

**Cross-ref:** Phase 16-PATTERNS.md L43-67 ("Field to add" + "Why optional + nullable") — copy-paste posture, swap field name.

---

### `packages/data-extractor/src/assemblers/race-assembler.ts` (assembler, batch + file-I/O)

**Analog:** self — the per-row loop @ L101-174 already establishes the `parseInt` + `Number.isFinite` guard idiom (TLK strrefs @ L121-124, ability adjustments @ L128-142, favoredClass @ L147-152, size @ L156-162). The 2DA table (`racesTable`) is already loaded @ L66-76 — **no `load2da` helper needed** (unlike Phase 16-01 class-assembler which had to read a sibling table). This is a pure new-column-read.

**Existing TLK strref guard (race-assembler.ts:121-124)** — exact idiom to mirror for `AbilitiesPointBuyNumber`:
```typescript
const nameStrref = row.Name ? parseInt(row.Name, 10) : NaN;
const descStrref = row.Description ? parseInt(row.Description, 10) : NaN;
const resolvedName = Number.isFinite(nameStrref) ? tlkResolver.resolve(nameStrref) : '';
const resolvedDesc = Number.isFinite(descStrref) ? tlkResolver.resolve(descStrref) : '';
```

**Existing favoredClass guard (race-assembler.ts:144-152)** — closer match (returns `null` on missing/invalid):
```typescript
let favoredClass: string | null = null;
const favoredRaw = row.Favored;
if (favoredRaw && classesTable) {
  const favoredIdx = parseInt(favoredRaw, 10);
  if (Number.isFinite(favoredIdx) && favoredIdx >= 0) {
    favoredClass = classIdFromRow(favoredIdx, classesTable);
  }
}
```

**Insertion point — column read** (after sentinel filter @ L113-116, before `races.push` @ L165). Mirror the favoredClass pattern verbatim:
```typescript
// Phase 17 — AbilitiesPointBuyNumber column read (per-race point-buy budget).
// `parseTwoDa` already coerces '****' → null in row records (two-da-parser.ts:131),
// so test `!= null`, not `!== '****'`.
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
```

**Insertion point — `races.push({...})` @ L165-173** (alphabetical insertion; matches schema order):
```typescript
races.push({
  abilityAdjustments,
  abilitiesPointBuyNumber,    // ← INSERT (between abilityAdjustments and description)
  description: resolvedDesc,
  favoredClass,
  id,
  label: displayLabel,
  size,
  sourceRow: rowIndex,
});
```

**Warning idiom:** push human-readable strings into `warnings: string[]`, never throw. Existing pattern @ L75, 88, 107, 114 — exact precedent.

**Critical:** Use `>= 0` (not `> 0`). `0` is a valid budget. `Number.isFinite(parsed) && parsed >= 0` matches Phase 17 anti-pattern lock from RESEARCH § Anti-Patterns.

**Cross-ref:** Phase 16-PATTERNS.md L70-160 (assembler insertion + warning idiom). Phase 17 is simpler — no `load2da` because `racesTable` is already in scope.

---

### `apps/planner/src/data/compiled-races.ts` (generated artifact, regenerate)

**Analog:** itself — overwritten by `pnpm extract`. Phase 16-01 SUMMARY § "Sibling regenerated catalogs reverted to 2026-04-17 baseline" sets the atomic-extract scoping pattern.

**Pattern S-RegenAtomic (from Phase 16-01):**
1. Run `pnpm extract` once.
2. `git diff --stat apps/planner/src/data/` — expect 5 catalog files touched.
3. **Revert** `compiled-{classes,feats,skills,deities}.ts` to the post-Phase-16 baseline (their changes are unrelated drift).
4. **Keep** `compiled-races.ts` — this is the in-scope artifact.
5. Verify diff hunks on `compiled-races.ts` are ONLY: (a) `abilitiesPointBuyNumber: 30` insertions per race entry, (b) `datasetId` bump, (c) any in-scope dedup hygiene (see Pitfall 1 below).

**Datasetid expectation:** post-extract value is whatever the current nwsync state generates (likely `puerta-ee-2026-04-26+cf6e8aad` or similar). `apps/planner/src/data/ruleset-version.ts:23` reads `CURRENT_DATASET_ID` from `compiledClassCatalog.datasetId` — Phase 17 does NOT regenerate `compiled-classes.ts`, so `CURRENT_DATASET_ID` stays at Phase 16-01's value. Cross-catalog datasetId divergence is expected and intentional per Phase 16-01 SUMMARY precedent.

**Pitfall 1 — `race:halfelf2` recurrence (RESEARCH Pitfall 1):** Phase 16-01 documented an unrelated `race:halfelf2` Semielfo dup that breaks `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` (which Phase 17 deletes anyway) + 7 other phase-12.6/12.8 specs. Phase 17 EITHER ships a dedup hygiene fix in-band (RESEARCH-recommended Strategy A) OR reverts via Phase 16-01's sibling-revert posture (Strategy B). The planner picks at plan-time after a dry-run extract; surface CONTEXT amendment D-07 if Strategy A is chosen.

---

### `packages/rules-engine/src/foundation/ability-budget.ts` (rules-engine, transform)

**Analog:** self — the file already owns `AbilityBudgetRules` (L11-16) + `calculateAbilityBudgetSnapshot` null branch (L74-91) + `nextIncrementCost` (L40-51) + `canIncrementAttribute` (L60-69). Phase 17 appends the cost-table constant + composer helper (D-02/D-02a) and promotes the interface to exported.

**Existing interface (ability-budget.ts:11-16)** — promote to exported (current `interface` is module-private):
```typescript
// CURRENT (private):
interface AbilityBudgetRules {
  budget: number;
  costByScore: Record<string, number>;
  maximum: number;
  minimum: number;
}

// PHASE 17 (exported):
export interface AbilityBudgetRules {
  budget: number;
  costByScore: Record<string, number>;
  maximum: number;
  minimum: number;
}
```

**Constant to add** (append after `canIncrementAttribute` @ L69; preserves cohesion):
```typescript
/**
 * Phase 17 (ATTR-02 D-02) — NWN1 hardcoded engine point-buy cost step.
 *
 * Source-of-truth: NWN1 EE engine (binary, not 2DA-driven). User-confirmed
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
```

**Helper to add** (Phase 16 S7 framework-agnostic boundary — structural input type, no `@data-extractor` import):
```typescript
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
  if (race.abilitiesPointBuyNumber == null) return null;  // catches both null + undefined
  return {
    budget: race.abilitiesPointBuyNumber,
    minimum: costTable.minimum,
    maximum: costTable.maximum,
    costByScore: costTable.costByScore,
  };
}
```

**Why the input type is structural (`{ abilitiesPointBuyNumber: number | null | undefined }`) and NOT `CompiledRace`:** importing `CompiledRace` from `@data-extractor/contracts/race-catalog` would break Phase 16 S7 (rules-engine framework-agnostic). The selector at the planner edge enforces type compatibility. Exact same posture as Phase 16-02 B-01 `compiledClass?: CompiledClass | null` arg on `determineFeatSlots`.

**Why default arg for `costTable`:** caller-pure ergonomics. Tests can pass synthetic curves; production code calls `deriveAbilityBudgetRules(race)` without the second arg.

**No changes to `calculateAbilityBudgetSnapshot` (L71-158):** the null branch (L74-91) IS the fail-closed contract. Phase 12.6 D-05 preserved verbatim.

**Cross-ref:** Phase 16-PATTERNS.md S7 (rules-engine framework-agnostic boundary) + RESEARCH § Pattern 3 (Framework-agnostic rules-engine helper composing extractor data).

---

### `packages/rules-engine/src/foundation/index.ts` (barrel)

**Analog:** self — current 6-line barrel. One line removed.

**Current (index.ts:1-6):**
```typescript
export * from './ability-budget';
export * from './ability-modifier';
export * from './origin-rules';
export * from './group-races-by-parent';
export * from './apply-race-modifiers';
export * from './point-buy-snapshot';      // ← REMOVE (Phase 17, snapshot retired)
```

**Phase 17 (5 lines):**
```typescript
export * from './ability-budget';
export * from './ability-modifier';
export * from './origin-rules';
export * from './group-races-by-parent';
export * from './apply-race-modifiers';
```

**Verification:** grep `from '@rules-engine/foundation'` (the barrel path) across `apps/`, `packages/`, `tests/` to confirm nothing imports `PUERTA_POINT_BUY_SNAPSHOT` or `PointBuyCurve` via the barrel before removal. Direct-path imports (`'@rules-engine/foundation/point-buy-snapshot'`) are enumerated in Pitfall 2 below — they all migrate atomically.

---

### `apps/planner/src/features/character-foundation/selectors.ts` (selector, transform)

**Analog:** self (current `selectAbilityBudgetRulesForRace` @ L60-65) + existing `compiledRaceCatalog` use @ L172-175 (groupRacesByParent reads same source).

**Current imports (selectors.ts:1-14)** — swap two lines:
```typescript
// REMOVE (L4-7):
import {
  PUERTA_POINT_BUY_SNAPSHOT,
  type PointBuyCurve,
} from '@rules-engine/foundation/point-buy-snapshot';

// ADD (extend the existing L3 import):
import {
  calculateAbilityBudgetSnapshot,
  deriveAbilityBudgetRules,
  type AbilityBudgetRules,
} from '@rules-engine/foundation/ability-budget';
```
`compiledRaceCatalog` is already imported @ L13 — no new import for the catalog.

**Current selector body (selectors.ts:60-65)** — REWIRE:
```typescript
// CURRENT:
export function selectAbilityBudgetRulesForRace(
  raceId: CanonicalId | null,
): PointBuyCurve | null {
  if (!raceId) return null;
  return PUERTA_POINT_BUY_SNAPSHOT[raceId] ?? null;
}

// PHASE 17:
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

**Downstream consumer (`selectAttributeBudgetSnapshot` @ L251-262)** — UNCHANGED. The `attributeRules:` field still receives the selector return; the type narrows from `PointBuyCurve | null` to `AbilityBudgetRules | null` but they are structurally identical (RESEARCH Pitfall 6 + Assumption A3).

**Pitfall 6 type-rename sweep:** grep `PointBuyCurve` across `apps/`, `packages/`, `tests/` post-rewire. Expected zero matches after the snapshot module deletion. The only consumer outside `point-buy-snapshot.ts` itself is the selector + `tests/phase-12.6/attributes-board-fail-closed.spec.tsx:30`.

**Cross-ref:** Phase 16-PATTERNS.md S7 (consumer-edge adaptation) + RESEARCH § Pattern 4.

---

### `tests/phase-12.6/ability-budget-per-race.spec.ts` (test, MIGRATE — D-04 atomic)

**Analog:** self (current 158-line spec). The behavior pin (45 races have non-null curves; baseline `{8,8,8,8,8,8}` → spent 0; bump 8→14 → 6 points spent) survives verbatim — only the source flips.

**Current import (L3) — REMOVE:**
```typescript
import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';
```

**Phase 17 import — ADD (selector path):**
```typescript
import { selectAbilityBudgetRulesForRace } from '@planner/features/character-foundation/selectors';
```

**Current iteration source (L86-88):**
```typescript
const uniqueRaces = [
  ...new Set(compiledRaceCatalog.races.map((r) => r.id)),
] as CanonicalId[];
```
**UNCHANGED** — already reads `compiledRaceCatalog`. Phase 17 makes this the canonical (and only) source.

**Current per-race assertion (L93-95) — replace dict lookup with selector call:**
```typescript
// CURRENT:
it('snapshot entry exists for every unique race ID', () => {
  expect(PUERTA_POINT_BUY_SNAPSHOT[raceId]).toBeDefined();
});

// PHASE 17:
it('selector returns non-null AbilityBudgetRules for every unique race ID', () => {
  expect(selectAbilityBudgetRulesForRace(raceId)).not.toBeNull();
});
```

**Current rules retrieval (L97-101, L109-113) — same swap pattern:**
```typescript
// CURRENT:
const rules = PUERTA_POINT_BUY_SNAPSHOT[raceId];

// PHASE 17:
const rules = selectAbilityBudgetRulesForRace(raceId);
expect(rules).not.toBeNull();          // type-guard the next assertions
```

**Variance note (L124-152) — surviving Elfo-vs-Enano sourced-uniformity assertion:** swap both lookups:
```typescript
// CURRENT:
const elfRules = PUERTA_POINT_BUY_SNAPSHOT['race:elf'];
const dwarfRules = PUERTA_POINT_BUY_SNAPSHOT['race:dwarf'];

// PHASE 17:
const elfRules = selectAbilityBudgetRulesForRace('race:elf' as CanonicalId);
const dwarfRules = selectAbilityBudgetRulesForRace('race:dwarf' as CanonicalId);
expect(elfRules).not.toBeNull();
expect(dwarfRules).not.toBeNull();
```

**`it.todo` at L154-156 — PRESERVE VERBATIM.** Future work pin for server-script override evidence; D-04 explicitly preserves.

**Null-branch describe (L30-78) — UNCHANGED.** Already passes `attributeRules: null` directly to `calculateAbilityBudgetSnapshot`; doesn't touch the snapshot.

**Cross-ref:** Phase 16-PATTERNS.md "FIXTURE MIGRATION" pattern (L566-616) + Phase 16-02 SUMMARY § atomic fixture migration.

---

### `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` (test, MIGRATE seed mechanism)

**Analog:** self (current `delete PUERTA_POINT_BUY_SNAPSHOT['race:human']` mechanism @ L52-66).

**Strategy (RESEARCH Pitfall 2 recommendation):** swap from "delete the snapshot key" to "use a non-existent raceId" — the rewired selector returns `null` for unknown raceIds via the second null branch (`if (!race) return null`). This is simpler than `vi.spyOn` and avoids module-internal mutation entirely.

**Current import (L28-31) — REMOVE:**
```typescript
import {
  PUERTA_POINT_BUY_SNAPSHOT,
  type PointBuyCurve,
} from '@rules-engine/foundation/point-buy-snapshot';
```

**Current setup (L50-66) — REPLACE entire `let savedHumanCurve` + `beforeEach` mutation + `afterEach` restoration:**
```typescript
// CURRENT:
let savedHumanCurve: PointBuyCurve | undefined;

beforeEach(() => {
  cleanup();
  document.body.innerHTML = '';
  resetStores();
  savedHumanCurve = PUERTA_POINT_BUY_SNAPSHOT['race:human' as CanonicalId];
  delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'];
});

afterEach(() => {
  cleanup();
  if (savedHumanCurve !== undefined) {
    (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'] = savedHumanCurve;
  }
});

// PHASE 17:
beforeEach(() => {
  cleanup();
  document.body.innerHTML = '';
  resetStores();
});

afterEach(() => {
  cleanup();
});
```

**Current per-test setup (L69, 78, 91, 104, 111) — REPLACE the race id with one not in `compiledRaceCatalog`:**
```typescript
// CURRENT (every test):
useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);

// PHASE 17:
useCharacterFoundationStore.getState().setRace('race:does-not-exist' as CanonicalId);
```

**Caveat — race-label fallback test (L110-121):** the current test asserts the callout includes the race label; with `race:does-not-exist`, the label lookup in `compiledRaceCatalog.races.find` returns undefined and the AttributesBoard component falls back to `'—'` (em-dash) for the label — exactly matching the existing "null race" test @ L123-129. Either rewrite to assert `'—'` for both tests, OR pick a real race id and use `vi.mock` on the selector — RESEARCH recommends the simpler approach (assert em-dash).

**Cross-ref:** RESEARCH Pitfall 2 (per-file migration table row 3).

---

### `tests/phase-03/summary-status.spec.tsx` (test, MIGRATE — drop seed)

**Analog:** self (current `PRE_12_6_UNIFORM_CURVE` seed @ L17-50).

**Why simpler than phase-12.6:** the new pipeline natively ships `abilitiesPointBuyNumber=30` for `race:human` and `race:elf`. The old defensive seed (Plan 02 era when snapshot was empty) is now **redundant** — the populated catalog satisfies the test naturally.

**Current imports (L11) — REMOVE:**
```typescript
import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';
```

**Current curve constant (L17-34) — DELETE.** No longer needed.

**Current `beforeEach` (L37-51) — REMOVE seeding lines (47-50):**
```typescript
// CURRENT:
beforeEach(() => {
  document.body.innerHTML = '';
  useCharacterFoundationStore.getState().resetFoundation();
  usePlannerShellStore.setState({ /* ... */ });
  (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'] = PRE_12_6_UNIFORM_CURVE;
  (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:elf'] = PRE_12_6_UNIFORM_CURVE;
});

// PHASE 17:
beforeEach(() => {
  document.body.innerHTML = '';
  useCharacterFoundationStore.getState().resetFoundation();
  usePlannerShellStore.setState({ /* ... */ });
});
```

**Current `afterEach` (L53-56) — DROP entirely (no mutations to clean up):**
```typescript
// CURRENT — DELETE:
afterEach(() => {
  delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'];
  delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:elf'];
});
```

**Test bodies (L58+) — UNCHANGED.** They assert against the live catalog which now ships the curves natively.

**Cross-ref:** RESEARCH Pitfall 2 (per-file migration table rows 4-6, all share this exact pattern).

---

### `tests/phase-03/attribute-budget.spec.tsx` (test, MIGRATE — drop seed)

**Analog:** self (current `PRE_12_6_UNIFORM_CURVE` seed @ L14-72).

**Migration:** identical to `summary-status.spec.tsx` above:
- Remove `import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';` (L9).
- Delete `PRE_12_6_UNIFORM_CURVE` constant (L14-).
- Drop `beforeEach` seeding @ L67-68 (`(PUERTA_POINT_BUY_SNAPSHOT...)['race:human'] = PRE_12_6_UNIFORM_CURVE`).
- Drop `afterEach` cleanup @ L72 (`delete (PUERTA_POINT_BUY_SNAPSHOT...)['race:human']`).
- Test bodies unchanged.

**Why this works post-Phase-17:** the new pipeline's `compiledRaceCatalog.races.find((r) => r.id === 'race:human').abilitiesPointBuyNumber === 30` natively, so `selectAbilityBudgetRulesForRace('race:human')` returns the same curve the test was hand-seeding.

---

### `tests/phase-10/attributes-advance.spec.tsx` (test, MIGRATE — drop seed)

**Analog:** self (current `PRE_12_6_UNIFORM_CURVE` seed @ L19-60).

**Migration:** identical to `summary-status.spec.tsx`:
- Remove `import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';` (L10).
- Delete `PRE_12_6_UNIFORM_CURVE` constant (L19-).
- Drop `beforeEach` seeding @ L54-55.
- Drop `afterEach` cleanup @ L60.
- Test bodies unchanged.

---

### `tests/phase-17/per-race-point-buy-extractor.spec.ts` (test, CREATE — Wave 1 RED gate)

**Analog:** Phase 16-01 `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` (16-PATTERNS.md L165-186) + `tests/phase-12.4/extractor-deleted-sentinel.spec.ts:1-30` (compiled-catalog assertion shape).

**Vitest env:** No `// @vitest-environment jsdom` directive — extractor specs run in **node env** (default).

**Skeleton:**
```typescript
import { describe, expect, it } from 'vitest';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import { compiledRaceSchema } from '@data-extractor/contracts/race-catalog';

/**
 * Phase 17 — V-01, V-08, V-12 extractor surface gate.
 *
 * Locks: (a) every race in compiledRaceCatalog has abilitiesPointBuyNumber
 * populated; (b) the schema rejects malformed values (Zod fail-closed
 * migrates from point-buy-snapshot module-load gate to compiledRaceSchema
 * parse — see RESEARCH Pitfall 5); (c) Wave 1 RED gate before Wave 2 lands.
 */
describe('Phase 17 — extractor surfaces abilitiesPointBuyNumber on CompiledRace', () => {
  it('every race in compiledRaceCatalog ships abilitiesPointBuyNumber (non-undefined)', () => {
    for (const race of compiledRaceCatalog.races) {
      expect(race.abilitiesPointBuyNumber).not.toBeUndefined();
    }
  });

  it('every race ships a non-negative integer or null (Phase 17 schema contract)', () => {
    for (const race of compiledRaceCatalog.races) {
      const v = race.abilitiesPointBuyNumber;
      expect(v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0)).toBe(true);
    }
  });

  it('Phase 12.6 sourced-uniformity finding holds: every race ships budget=30 (RESEARCH Assumption A1)', () => {
    // If this flips RED post-extract, surface variance to user before Phase 17 closeout.
    for (const race of compiledRaceCatalog.races) {
      expect(race.abilitiesPointBuyNumber).toBe(30);
    }
  });

  it('compiledRaceSchema rejects malformed abilitiesPointBuyNumber (fail-closed Zod gate)', () => {
    expect(() =>
      compiledRaceSchema.parse({
        abilityAdjustments: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        abilitiesPointBuyNumber: 'not-a-number',
        description: '',
        favoredClass: null,
        id: 'race:test',
        label: 'Test',
        size: 'medium',
        sourceRow: 0,
      }),
    ).toThrow();
  });

  it('compiledRaceSchema accepts null abilitiesPointBuyNumber', () => {
    expect(() =>
      compiledRaceSchema.parse({
        abilityAdjustments: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        abilitiesPointBuyNumber: null,
        description: '',
        favoredClass: null,
        id: 'race:test',
        label: 'Test',
        size: 'medium',
        sourceRow: 0,
      }),
    ).not.toThrow();
  });
});
```

**Soften "every race ships 30" assertion** (RESEARCH Assumption A1 escape hatch): if the dry-run extract surfaces variance (any Puerta custom row carrying != 30), flip that assertion to `expect(v === null || v >= 0).toBe(true)` and pin sourced-uniformity in a separate test that explicitly enumerates the variant races.

**Cross-ref:** Phase 16-PATTERNS.md L165-191 (extractor spec template) + RESEARCH § Code Examples 5.

---

### `tests/phase-17/derive-ability-budget-rules.spec.ts` (test, CREATE — Wave 2 RED gate)

**Analog:** `tests/phase-12.6/ability-budget-per-race.spec.ts` (rules-engine pure-helper assertions L30-78).

**Vitest env:** node env (default; no directive needed).

**Skeleton:**
```typescript
import { describe, expect, it } from 'vitest';
import {
  deriveAbilityBudgetRules,
  NWN1_POINT_BUY_COST_TABLE,
} from '@rules-engine/foundation/ability-budget';

/**
 * Phase 17 — V-02 helper composition gate.
 *
 * Pure unit tests for the new rules-engine helper. Framework-agnostic per
 * Phase 16 S7: the helper accepts plain object inputs (not CompiledRace),
 * so these tests construct synthetic literals — legitimate test scaffolding,
 * NOT production data fabrication (RESEARCH Pitfall 4).
 */
describe('Phase 17 — deriveAbilityBudgetRules (helper composition)', () => {
  it('returns null when abilitiesPointBuyNumber is null', () => {
    expect(deriveAbilityBudgetRules({ abilitiesPointBuyNumber: null })).toBeNull();
  });

  it('returns null when abilitiesPointBuyNumber is undefined', () => {
    expect(deriveAbilityBudgetRules({ abilitiesPointBuyNumber: undefined })).toBeNull();
  });

  it('composes correctly when abilitiesPointBuyNumber is populated (default cost table)', () => {
    const result = deriveAbilityBudgetRules({ abilitiesPointBuyNumber: 30 });
    expect(result).toEqual({
      budget: 30,
      minimum: 8,
      maximum: 18,
      costByScore: NWN1_POINT_BUY_COST_TABLE.costByScore,
    });
  });

  it('composes with caller-supplied cost table (synthetic curve)', () => {
    const synthetic = {
      minimum: 6,
      maximum: 20,
      costByScore: { '6': 0, '20': 100 },
    } as const;
    const result = deriveAbilityBudgetRules({ abilitiesPointBuyNumber: 50 }, synthetic);
    expect(result).toEqual({ budget: 50, minimum: 6, maximum: 20, costByScore: synthetic.costByScore });
  });

  it('preserves Phase 12.6 D-05 fail-closed contract: budget=0 → returns rules with budget=0 (NOT null)', () => {
    // 0 is a valid budget per Phase 17 D-02; only null/undefined trigger fail-closed.
    const result = deriveAbilityBudgetRules({ abilitiesPointBuyNumber: 0 });
    expect(result).not.toBeNull();
    expect(result!.budget).toBe(0);
  });
});

describe('Phase 17 — NWN1_POINT_BUY_COST_TABLE shape lock', () => {
  it('exports the canonical NWN1 cost step (8:0..18:16)', () => {
    expect(NWN1_POINT_BUY_COST_TABLE).toEqual({
      minimum: 8,
      maximum: 18,
      costByScore: {
        '8': 0, '9': 1, '10': 2, '11': 3, '12': 4, '13': 5,
        '14': 6, '15': 8, '16': 10, '17': 13, '18': 16,
      },
    });
  });
});
```

**Cross-ref:** RESEARCH § Code Examples 3 + Phase 16-PATTERNS.md S7.

---

### `tests/phase-17/per-race-point-buy-selector.spec.ts` (test, CREATE — Wave 3 RED gate; SC#4 reframe)

**Analog:** RESEARCH § Code Examples 5 (L630-701) — verbatim skeleton ready to land. Plus Phase 16-PATTERNS.md S2 (no React/jsdom needed; pure selector test).

**Vitest env:** node env (default).

**Skeleton (lifted from RESEARCH Example 5):**
```typescript
import { describe, expect, it } from 'vitest';
import { selectAbilityBudgetRulesForRace } from '@planner/features/character-foundation/selectors';
import {
  deriveAbilityBudgetRules,
  NWN1_POINT_BUY_COST_TABLE,
} from '@rules-engine/foundation/ability-budget';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

/**
 * Phase 17 — V-03, V-07 SC#4 reframe gate (D-03).
 *
 * Original SC#4: "specs cover ≥3 races with distinct curves."
 * Reframed (D-03): schema-shape coverage — ≥3 dedupe-canonical races resolve
 * to non-null AbilityBudgetRules via the selector, AND ≥1 race demonstrates
 * the null fail-closed branch (synthetic or naturally-null).
 *
 * "Distinct curves" literal dropped: per Phase 12.6 evidence, the truthful
 * dataset is sourced-uniform. Coverage spec asserts pipeline correctness,
 * not value variance. Future server-script overrides re-open this via
 * tests/phase-12.6 spec's it.todo (preserved by D-04).
 */
describe('Phase 17 — SC#4 reframe: per-race point-buy pipeline coverage', () => {
  it('≥3 races resolve to non-null AbilityBudgetRules via selectAbilityBudgetRulesForRace', () => {
    const sampleRaceIds: CanonicalId[] = [
      'race:human',
      'race:elf',
      'race:dwarf',
    ] as CanonicalId[];
    for (const raceId of sampleRaceIds) {
      const rules = selectAbilityBudgetRulesForRace(raceId);
      expect(rules).not.toBeNull();
      expect(rules!.budget).toBeGreaterThan(0);
      expect(rules!.minimum).toBe(NWN1_POINT_BUY_COST_TABLE.minimum);
      expect(rules!.maximum).toBe(NWN1_POINT_BUY_COST_TABLE.maximum);
      expect(rules!.costByScore).toEqual(NWN1_POINT_BUY_COST_TABLE.costByScore);
    }
  });

  it('selector returns null for unknown raceId (fail-closed: race not in catalog)', () => {
    expect(selectAbilityBudgetRulesForRace('race:does-not-exist' as CanonicalId)).toBeNull();
  });

  it('selector returns null for null raceId (fail-closed: no race selected)', () => {
    expect(selectAbilityBudgetRulesForRace(null)).toBeNull();
  });

  it('every race in compiledRaceCatalog produces a non-null selector result (coverage migrated from deleted snapshot-coverage spec)', () => {
    // Replaces the deleted tests/phase-12.6/point-buy-snapshot-coverage.spec.ts
    // coverage assertion. Same invariant; new source.
    const uniqueIds = [...new Set(compiledRaceCatalog.races.map((r) => r.id))] as CanonicalId[];
    for (const id of uniqueIds) {
      expect(selectAbilityBudgetRulesForRace(id)).not.toBeNull();
    }
  });
});
```

**Why split helper-spec from selector-spec:** the helper is rules-engine-pure (no `@planner` imports); the selector spec necessarily imports `@planner`. Keeping them in separate files preserves the Phase 16 S7 module-graph hygiene (rules-engine specs do not depend on planner artifacts).

**Cross-ref:** RESEARCH § Code Examples 5 + Pitfall 4 (synthetic null branch).

---

### Deletion targets (no analog needed)

| File | Reason | Verification |
|------|--------|--------------|
| `packages/rules-engine/src/foundation/data/puerta-point-buy.json` | Data migrated to extractor (D-01) | Post-delete: `git ls-files` returns nothing. |
| `packages/rules-engine/src/foundation/data/puerta-point-buy.md` | Provenance preserved via git history (D-05); UAT closeout commit references commit `bf55129` and earlier. | Post-delete + commit: dossier accessible via `git show bf55129:packages/rules-engine/src/foundation/data/puerta-point-buy.md`. |
| `packages/rules-engine/src/foundation/point-buy-snapshot.ts` | Module-load Zod gate replaced by `compiledRaceSchema.parse` at `compiled-races.ts:6` (RESEARCH Pitfall 5). | Post-delete: `grep -r "point-buy-snapshot" packages/ apps/ tests/` zero matches; barrel cleaned. |
| `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` | Contract retired — coverage proven by extractor schema parse + new phase-17 selector spec (RESEARCH key finding §3). | Post-delete: vitest discovery zero matches; phase-12.6 suite still green via remaining specs. |

**Deletion timing:** Wave 2 ships `point-buy-snapshot.ts` + JSON + MD deletions atomically with the new pipeline landing. Wave 3 deletes the orphaned coverage spec alongside the spec migration sweep (RESEARCH Open Question 4 recommendation).

---

### `.planning/UAT-FINDINGS-2026-04-20.md` (doc footer, MODIFY — D-05)

**Analog:** Phase 16 closeout footers (similar CLOSED-BY pattern). The footer is appended to UAT-FINDINGS-2026-04-20.md § A1.

**Footer to add (per CONTEXT D-05 verbatim disposition note):**
```markdown
**CLOSED-BY:** Phase 17 (per-race-point-buy)

**Disposition:** User claim of per-race variance was contradicted by user's
own 2026-04-20 in-game verification + racialtypes.2da extraction; Phase 17
ships the engineering deliverable (extractor pipeline) on the truthful
uniform curve.

**Evidence pointer:** `packages/rules-engine/src/foundation/data/puerta-point-buy.md
§ "Plan 06 Source Resolution"` (deleted in Phase 17 closeout commit; preserved
via git history at commit `bf55129` and earlier 12.6 commits).
```

**Timing:** Wave 3 closeout commit, alongside the snapshot+spec deletions.

---

## Shared Patterns

### Pattern S-17-A — Additive optional nullable extractor field (transferred from Phase 16-01)

**Source:** Phase 16-PATTERNS.md S1 + L43-67 ("Field to add" pattern).
**Apply to:** `packages/data-extractor/src/contracts/race-catalog.ts` (`abilitiesPointBuyNumber`).
**Why:** Identical posture to `compiledClassSchema.bonusFeatSchedule`. `null` = "extractor read row but column was `****`/missing"; `undefined` = "older catalog snapshot pre-Phase-N"; populated = legitimate. No `schemaVersion` bump per CONTEXT D-06.

```typescript
abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional(),
```

### Pattern S-17-B — In-loop column read with parseInt + Number.isFinite guard (in-file precedent)

**Source:** `race-assembler.ts:147-152` (favoredClass guard).
**Apply to:** `race-assembler.ts` `AbilitiesPointBuyNumber` column read.
**Why:** Phase 17 does NOT need `load2da` (Phase 16-01 S1) because `racesTable` is already loaded @ L66-76. The simpler in-file precedent is the favoredClass guard. Use `>= 0` not `> 0` (0 is valid).

### Pattern S-17-C — Framework-agnostic rules-engine helper composing extractor data (Phase 16 S7)

**Source:** Phase 16-PATTERNS.md S7 + Phase 16-02 SUMMARY § B-01 architectural decision.
**Apply to:** `deriveAbilityBudgetRules` in `ability-budget.ts`.
**Why:** rules-engine MUST NOT import from `@data-extractor`. Helper input is structural (`{ abilitiesPointBuyNumber: number | null | undefined }`) — selectors at the planner edge enforce type compatibility. Default cost-table arg keeps caller ergonomics tidy.

### Pattern S-17-D — Atomic-extract scoping with sibling-catalog revert

**Source:** Phase 16-01 SUMMARY § "Sibling regenerated catalogs reverted to 2026-04-17 baseline".
**Apply to:** Wave 1 `pnpm extract` step. Only `compiled-races.ts` ships changed; `compiled-{classes,feats,skills,deities}.ts` revert to post-Phase-16 baseline.
**Why:** `pnpm extract` is single-pass, regenerates all 5 catalogs in lockstep. Phase 17's value is `compiled-races.ts` only; sibling drift is collateral.

### Pattern S-17-E — Atomic fixture migration (D-04)

**Source:** Phase 16-02 SUMMARY § "Migrate phase-06 + phase-12 fixtures to new BuildStateAtLevel shape" + Phase 16-PATTERNS.md "FIXTURE MIGRATION" (L566-616).
**Apply to:** Wave 3 atomic migration of 5 spec files (phase-12.6 ability-budget-per-race + phase-12.6 attributes-board-fail-closed + 3 pre-12.6 specs in phase-03/phase-10) + 1 deletion (phase-12.6 snapshot-coverage).
**Why:** snapshot module deletion is hard-cut. Every consumer must migrate in the same commit, or CI dies the moment `point-buy-snapshot.ts` is deleted.

### Pattern S-17-F — RTL spec convention (Phase 16 S5, inherited)

**Source:** Phase 16-PATTERNS.md S5 + `tests/phase-12.4/feat-selectability-states.spec.tsx:1, 30-31, 168-178`.
**Apply to:** the 4 `.spec.tsx` files Phase 17 migrates (`phase-12.6/attributes-board-fail-closed`, `phase-03/summary-status`, `phase-03/attribute-budget`, `phase-10/attributes-advance`).
**Hard locks:**
1. `// @vitest-environment jsdom` directive on line 1 (already present in all 4).
2. `import { createElement } from 'react';` then `render(createElement(Component))` — no JSX (already present).
3. Multi-`it` suite has `afterEach(() => cleanup())` + `beforeEach` resets all relevant stores (already present).

Phase 17 does not author new `.spec.tsx` files — the 3 new specs are all `.spec.ts` (extractor + helper + selector, no React).

### Pattern S-17-G — Type-rename sweep on selector return type

**Source:** RESEARCH Pitfall 6.
**Apply to:** post-rewire grep `PointBuyCurve` across `apps/`, `packages/`, `tests/`.
**Expected:** zero matches after `point-buy-snapshot.ts` deletion + selector rewire. `AbilityBudgetRules` and `PointBuyCurve` are structurally identical (RESEARCH Assumption A3) — drop-in replacement.

---

## No Analog Found

(none — every Phase 17 file has a strong in-repo analog, mostly self-extension or direct Phase 16 transfer)

---

## Metadata

**Analog search scope:**
- `packages/data-extractor/src/{contracts,assemblers,parsers}/`
- `packages/rules-engine/src/foundation/`
- `apps/planner/src/{features/character-foundation,data}/`
- `tests/phase-{03,10,12.4,12.6,16}/`
- `.planning/phases/16-feat-engine-completion/16-PATTERNS.md` (cross-reference)

**Files scanned:** 12 read in full or with targeted offset+limit (race-catalog.ts, race-assembler.ts, ability-budget.ts, point-buy-snapshot.ts, foundation/index.ts, selectors.ts, ability-budget-per-race.spec.ts, attributes-board-fail-closed.spec.tsx, point-buy-snapshot-coverage.spec.ts, summary-status.spec.tsx (head), two-da-parser.ts (relevant section), 16-PATTERNS.md, 17-CONTEXT.md, 17-RESEARCH.md).

**Pattern extraction date:** 2026-04-26.
**Producer:** GSD pattern-mapper (single-pass; no re-reads of overlapping ranges; no source edits).
