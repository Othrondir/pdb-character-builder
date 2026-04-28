---
phase: 17-per-race-point-buy
reviewed: 2026-04-28T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - apps/planner/src/data/compiled-races.ts
  - apps/planner/src/features/character-foundation/selectors.ts
  - packages/data-extractor/src/assemblers/race-assembler.ts
  - packages/data-extractor/src/contracts/race-catalog.ts
  - packages/rules-engine/src/foundation/ability-budget.ts
  - packages/rules-engine/src/foundation/index.ts
  - tests/phase-03/attribute-budget.spec.tsx
  - tests/phase-03/summary-status.spec.tsx
  - tests/phase-10/attributes-advance.spec.tsx
  - tests/phase-12.6/ability-budget-per-race.spec.ts
  - tests/phase-12.6/attributes-board-fail-closed.spec.tsx
  - tests/phase-17/derive-ability-budget-rules.spec.ts
  - tests/phase-17/per-race-point-buy-extractor.spec.ts
  - tests/phase-17/per-race-point-buy-selector.spec.ts
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-04-28
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 17 cleanly migrates the per-race point-buy pipeline from a hand-authored
`PUERTA_POINT_BUY_SNAPSHOT` to a sourced `compiledRaceCatalog.races[].abilitiesPointBuyNumber`
column composed with a hardcoded `NWN1_POINT_BUY_COST_TABLE` via a pure
`deriveAbilityBudgetRules` helper. The schema additive (optional + nullable
nonneg int) is well-scoped, the rules-engine helper is framework-agnostic and
preserves the Phase 12.6 D-05 fail-closed contract, and the selector rewire
correctly routes through `calculateAbilityBudgetSnapshot`'s null branch for
both null raceId and unknown raceId. Specs are well-targeted: schema bounds
are exercised in both the rejected-direction and accepted-direction, the
helper has shape-only unit tests, the per-race spec table-iterates the live
catalog, and the fail-closed UI seed mechanism was migrated from
"snapshot key deletion" to "unknown raceId" correctly.

Two warnings worth addressing before downstream consumers grow:

1. The compiled catalog ships duplicate `race:drow` IDs (sourceRow 164 +
   sourceRow 222) with divergent `abilityAdjustments`. The selector's
   `.find()` silently shadows. Phase 17 itself doesn't introduce this — the
   assembler has always been non-deduplicating — but the new selector path
   reads the catalog directly, so the latent collision is now in the
   point-buy hot path. `abilitiesPointBuyNumber` is uniform today (30
   everywhere) so user-visible behavior is unchanged; this becomes a real
   bug the moment server data introduces variance.

2. The assembler's fail-soft branch on invalid `AbilitiesPointBuyNumber`
   has no test coverage. Phase 17's RED-gate spec asserts the catalog
   shape but never the warning path, so a future regression that
   silently swallows malformed values would land green.

Info items cover doc/comment drift and minor parser behavior.

## Warnings

### WR-01: Duplicate `race:drow` ID in compiled catalog; selector silently shadows

**File:** `apps/planner/src/data/compiled-races.ts:208` and `apps/planner/src/data/compiled-races.ts:701`
**Issue:** The compiled catalog contains two distinct race entries that resolve to the same canonical ID `race:drow`:
- Row 1 (sourceRow 164, label "Elfo Drow"): `abilityAdjustments` = str:0, dex:+2, con:-2, int:0, wis:0, cha:0; `favoredClass` = `class:ranger`
- Row 2 (sourceRow 222, label "Drow"): `abilityAdjustments` = str:0, dex:+2, con:-2, **int:+2, cha:+2**; `favoredClass` = `class:ranger`

The Phase 17 selector at `apps/planner/src/features/character-foundation/selectors.ts:67` does:
```ts
const race = compiledRaceCatalog.races.find((r) => r.id === raceId);
```
…which returns the FIRST match. So for `raceId === 'race:drow'`, `selectAbilityBudgetRulesForRace` always picks "Elfo Drow" and the second entry's `abilityAdjustments` are silently unreachable through this code path. `compiledRaceSchema` (`packages/data-extractor/src/contracts/race-catalog.ts:14`) does not enforce id uniqueness across the `races` array.

**Why this matters now:** Phase 17 reframed SC#4 ("≥3 distinct curves") into a structural-only assertion specifically because `abilitiesPointBuyNumber` is uniform 30 across the dataset, so the duplicate-ID collision is benign for the point-buy field today. But the moment server-script overrides surface non-uniform `AbilitiesPointBuyNumber` (or any other field consumed by the selector), the second `race:drow` entry's value will be silently dropped — and the Phase 12.6 fail-closed contract (return null for unknown race) won't fire because the ID resolves successfully.

The collision is upstream of Phase 17's deltas, but Phase 17 is the change that put `compiledRaceCatalog` on the runtime point-buy hot path. Two adjacent test files already reach for `[...new Set(compiledRaceCatalog.races.map((r) => r.id))]` (`tests/phase-12.6/ability-budget-per-race.spec.ts:91`, `tests/phase-17/per-race-point-buy-selector.spec.ts:54`) — that pattern is a workaround for this exact collision, but it lives in tests, not in the data contract.

**Fix (preferred):** Tighten the schema or assembler so id uniqueness is structurally guaranteed:
```ts
// packages/data-extractor/src/contracts/race-catalog.ts
export const raceCatalogSchema = z.object({
  datasetId: datasetIdSchema,
  races: z.array(compiledRaceSchema)
    .min(1)
    .refine(
      (arr) => new Set(arr.map((r) => r.id)).size === arr.length,
      { message: 'Race ids must be unique' },
    ),
  schemaVersion: z.literal('1'),
  subraces: z.array(compiledSubraceSchema),
});
```
Then in `race-assembler.ts`, deduplicate at append time (last-wins, first-wins, or warn-and-skip) and emit a warning so the regen pipeline surfaces the duplicate label collision rather than letting the schema throw at parse time:
```ts
const seenIds = new Set<string>();
// ...inside the loop, after `const id = canonicalId('race', label);`
if (seenIds.has(id)) {
  warnings.push(
    `Race row ${rowIndex} (${label}): duplicate canonical id '${id}' (already emitted from earlier row); skipped`,
  );
  continue;
}
seenIds.add(id);
```

**Fix (minimum):** If the duplicate is rules-correct (two real distinct races that the canonical-id slug happens to collapse), change `canonicalId('race', label)` to consume both `label` and a disambiguator (e.g., `sourceRow`) so two rows produce two distinct IDs.

---

### WR-02: Assembler fail-soft branch for invalid `AbilitiesPointBuyNumber` has zero test coverage

**File:** `packages/data-extractor/src/assemblers/race-assembler.ts:169-180`
**Issue:** The fail-soft block:
```ts
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
…is the contract for every malformed-input scenario the schema accepts the result of (negative, non-numeric, etc.). No test in `tests/` exercises it: `tests/phase-17/per-race-point-buy-extractor.spec.ts` asserts the live catalog's surface and the schema's bounds, but never feeds the assembler a malformed `racialtypes.2da` row to confirm that (a) the result coerces to `null`, (b) the warning is emitted with the row index + raw value, (c) the schema accepts the resulting null. A future change that silently regresses to e.g. `abilitiesPointBuyNumber = parsed` without the `>= 0` guard would still pass the live-catalog spec because the live data is well-formed.

**Fix:** Add a unit test for `assembleRaceCatalog` that injects a mock `racialtypes.2da` row with a malformed `AbilitiesPointBuyNumber` (e.g., `"-5"`, `"abc"`, `"3.7"`) and asserts both the resulting `abilitiesPointBuyNumber === null` and that `result.warnings` contains the expected `Race row <n> (<label>): invalid AbilitiesPointBuyNumber '<raw>'` message. The assembler already takes injectable `NwsyncReader`, `BaseGameReader`, and `TlkResolver` interfaces, so a minimal in-memory fake of those readers is sufficient — no SQLite/BIF fixtures required. Existing assembler tests in `packages/data-extractor/tests/` (if present) provide the pattern; otherwise a new `tests/phase-17/race-assembler-fail-soft.spec.ts` keeps the gate co-located.

## Info

### IN-01: Doc-comment drift — references to `dedupeByCanonicalId` helper that doesn't exist

**File:** `tests/phase-12.6/ability-budget-per-race.spec.ts:15-16`
**Issue:** The doc comment claims:
```
asserts every race in `dedupeByCanonicalId(compiledRaceCatalog.races)`
resolves to a non-null `AbilityBudgetRules`...
```
…but the actual code uses an inline `[...new Set(compiledRaceCatalog.races.map((r) => r.id))]` (line 91-93). No `dedupeByCanonicalId` symbol is exported anywhere in the workspace. This is a comment-only drift: the behavior is correct, but a future reader searching for `dedupeByCanonicalId` will hit nothing.
**Fix:** Either rename the inline pattern to a small local helper named `dedupeByCanonicalId` for readability, or update the comment to describe the inline `Set` pattern. The latter is one-line minimal:
```ts
// asserts every unique race id in compiledRaceCatalog (deduped via Set)
// resolves to a non-null AbilityBudgetRules...
```

---

### IN-02: `parseInt` permissive coercion silently accepts trailing garbage and decimal truncation

**File:** `packages/data-extractor/src/assemblers/race-assembler.ts:172`
**Issue:** `parseInt('30bogus', 10) === 30` and `parseInt('30.7', 10) === 30`. Both inputs pass the `Number.isFinite(parsed) && parsed >= 0` guard and produce a successful `abilitiesPointBuyNumber: 30`, suppressing the warning that the malformed-input branch is supposed to surface. The same permissive parse is already used elsewhere in this file (favored class index, ability adjustments, appearance index) so the behavior is consistent — it's a pre-existing convention. Worth flagging because Phase 17 is the first time `AbilitiesPointBuyNumber` is read, and a stricter parser here would be defense-in-depth against malformed Puerta server data without any cost to correct rows.
**Fix:** Use `Number()` + `Number.isInteger()` instead of `parseInt()` for the new column read:
```ts
const parsed = Number(abilitiesPointBuyRaw);
if (Number.isInteger(parsed) && parsed >= 0) {
  abilitiesPointBuyNumber = parsed;
} else {
  warnings.push(/* ... */);
}
```
`Number('30bogus')` returns `NaN` and `Number('30.7')` returns `30.7` (rejected by `Number.isInteger`), so both pathological inputs route to the warning branch. Defer to project convention if `parseInt` is the established assembler pattern; in that case leave as-is and accept the trade-off.

---

### IN-03: `calculateAbilityBudgetSnapshot` `as` cast on `attributeRules` is unnecessary after the early return

**File:** `packages/rules-engine/src/foundation/ability-budget.ts:148-150`
**Issue:** The comment correctly observes that the `null` early-return at line 130 should narrow `input.attributeRules` to non-null inside the closure, but TypeScript's flow analysis can't carry that narrowing across the `Object.entries(input.baseAttributes).reduce(...)` callback boundary unless `input` is destructured first. The current local-rebind workaround (`const attributeRules = input.attributeRules;`) is fine and correct — flagging only because the inline comment "Local non-null binding so the closure below narrows correctly after the fail-closed early-return above" is technically accurate but reads like a workaround for a tsc bug. It is not a bug; it is the standard idiom.
**Fix:** None required. Optionally trim the comment to "Rebind for closure narrowing." Pure cosmetic.

---

### IN-04: Phase 17 selector docstring quotes 12.6 D-05 contract verbatim — duplicates rule-engine doc comment

**File:** `apps/planner/src/features/character-foundation/selectors.ts:53-62`
**Issue:** The selector doc comment restates the same Phase 12.6 D-05 / `rule:point-buy-missing` invariant that's already documented at `packages/rules-engine/src/foundation/ability-budget.ts:97-108` (the helper's own docstring) and again at `ability-budget.ts:128-130` (the early-return inline comment). Three copies of the same prose drift independently when the contract evolves. The selector and the helper docstring already cross-reference each other ("composes via deriveAbilityBudgetRules", "preserves Phase 12.6 D-05 fail-closed contract") so a single source-of-truth in the helper would be enough.
**Fix:** Keep the selector docstring focused on the planner-edge role (catalog read, raceId resolution) and replace the contract-restatement with a one-line link:
```
Returns null when raceId is null OR unknown OR the race's abilitiesPointBuyNumber
is null. Null-routing semantics are documented on deriveAbilityBudgetRules
(@rules-engine/foundation/ability-budget).
```
Pure documentation hygiene; no behavioral change.

---

_Reviewed: 2026-04-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
