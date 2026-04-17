---
phase: 07-magic-full-legality-engine
reviewed: 2026-04-17T11:21:49Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - apps/planner/src/components/shell/center-content.tsx
  - apps/planner/src/components/shell/character-sheet.tsx
  - apps/planner/src/components/shell/level-sub-steps.tsx
  - apps/planner/src/components/ui/confirm-dialog.tsx
  - apps/planner/src/data/compiled-domains.ts
  - apps/planner/src/data/compiled-spells.ts
  - apps/planner/src/features/feats/selectors.ts
  - apps/planner/src/features/magic/compiled-magic-catalog.ts
  - apps/planner/src/features/magic/domain-tile-grid.tsx
  - apps/planner/src/features/magic/magic-board.tsx
  - apps/planner/src/features/magic/magic-detail-panel.tsx
  - apps/planner/src/features/magic/magic-sheet-tab.tsx
  - apps/planner/src/features/magic/magic-sheet.tsx
  - apps/planner/src/features/magic/selectors.ts
  - apps/planner/src/features/magic/spell-level-tabs.tsx
  - apps/planner/src/features/magic/spell-row.tsx
  - apps/planner/src/features/magic/store.ts
  - apps/planner/src/features/magic/swap-spell-dialog.tsx
  - apps/planner/src/lib/copy/es.ts
  - apps/planner/src/state/planner-shell.ts
  - packages/data-extractor/src/assemblers/feat-assembler.ts
  - packages/data-extractor/src/assemblers/spell-assembler.ts
  - packages/data-extractor/src/cli.ts
  - packages/rules-engine/src/feats/feat-prerequisite.ts
  - packages/rules-engine/src/magic/caster-level.ts
  - packages/rules-engine/src/magic/catalog-fail-closed.ts
  - packages/rules-engine/src/magic/domain-rules.ts
  - packages/rules-engine/src/magic/index.ts
  - packages/rules-engine/src/magic/magic-legality-aggregator.ts
  - packages/rules-engine/src/magic/magic-revalidation.ts
  - packages/rules-engine/src/magic/spell-eligibility.ts
  - packages/rules-engine/src/magic/spell-prerequisite.ts
  - scripts/verify-phase-07-copy.cjs
  - tests/phase-05.2/character-sheet.spec.tsx
  - tests/phase-06/feat-eligibility.spec.ts
  - tests/phase-06/feat-prerequisite.spec.ts
  - tests/phase-06/feat-proficiency.spec.ts
  - tests/phase-06/feat-revalidation.spec.ts
  - tests/phase-07/caster-level.spec.ts
  - tests/phase-07/catalog-fail-closed.spec.ts
  - tests/phase-07/center-content.spec.tsx
  - tests/phase-07/domain-rules.spec.ts
  - tests/phase-07/magic-board.spec.tsx
  - tests/phase-07/magic-legality-aggregator.spec.ts
  - tests/phase-07/magic-revalidation.spec.ts
  - tests/phase-07/magic-sheet-tab.spec.tsx
  - tests/phase-07/magic-store.spec.ts
  - tests/phase-07/spell-eligibility.spec.ts
  - tests/phase-07/spell-prerequisite.spec.ts
findings:
  critical: 3
  warning: 7
  info: 5
  total: 15
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-04-17T11:21:49Z
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

Phase 07 delivers the magic full-legality engine: pure-TS rules in `packages/rules-engine/src/magic`, a Zustand magic store, selector-backed board/sheet views, and the extractor-side spell + domain assemblers. Core structure mirrors the phase-06 feat subsystem well (revalidation cascade, dedupe helpers, fail-closed gates), but three correctness issues rise to Critical:

1. A swap never actually mutates `knownSpells`, so the sorcerer/bard swap flow (D-15) records state nobody reads.
2. The aggregator's `STATUS_ORDER` has `legal` and `pending` swapped against every other STATUS_ORDER in the codebase, so the build-wide rollup reports the wrong severity when `pending` and `legal` levels coexist.
3. `computeSpellSlots` in `caster-level.ts` indexes `table[casterLevel - 1]`, but `spell-assembler.ts` skips rows whose columns are all null and still stamps them with `casterLevel = rowIndex + 1`, so index and stored casterLevel diverge whenever the raw 2DA contains a fully blank row.

Secondary issues: `dispatchParadigm` gates cleric domain selection by `characterLevel === 1` instead of "first cleric level" (multiclass Fighter 1 / Cleric 2 never gets domains); `selectMagicSheetTabView` hardcodes `status: 'legal'` so the character-sheet tab never surfaces illegal selections; catalog fail-closed on wizard/sorcerer shared column leaves one class with 0 tagged spells (documented in `deferred-items.md` but not yet fixed).

## Critical Issues

### CR-01: `applySwap` records swaps but never updates `knownSpells`, breaking the entire spell-swap feature

**File:** `apps/planner/src/features/magic/store.ts:144-154`, `apps/planner/src/features/magic/swap-spell-dialog.tsx:111-113`, `packages/rules-engine/src/magic/magic-revalidation.ts:102-227`
**Issue:** `applySwap` appends a `SwapRecord` to `swapsApplied` but does not remove `forgotten` from `knownSpells` or insert `learned`. Downstream, `revalidateMagicSnapshotAfterChange` never reads `swapsApplied` (only `domainsSelected`, `spellbookAdditions`, `knownSpells`). Net effect: after the user completes the two-step `SwapSpellDialog` the forgotten spell is still known, the learned spell is not known, and validation never notices. The D-15 swap cadence (sorcerer 4/8/12/16, bard 5/8/11/14) is documented and surfaced by `isSwapLevel`, so this isn't deferred — it's a load-bearing feature that silently no-ops.
**Fix:**
```ts
// store.ts
applySwap: (level, forgotten, learned) =>
  set((state) => ({
    lastEditedLevel: level,
    levels: updateLevel(state.levels, level, (record) => {
      // Drop forgotten id from whichever spell-level bucket holds it, then
      // append learned at the same bucket.
      const nextKnown: Record<number, CanonicalId[]> = {};
      let spellLevelOfForgotten: number | null = null;
      for (const [slKey, list] of Object.entries(record.knownSpells)) {
        const sl = Number(slKey);
        if (list.includes(forgotten)) spellLevelOfForgotten = sl;
        nextKnown[sl] = list.filter((id) => id !== forgotten);
      }
      if (spellLevelOfForgotten != null) {
        nextKnown[spellLevelOfForgotten] = [
          ...(nextKnown[spellLevelOfForgotten] ?? []),
          learned,
        ];
      }
      return {
        ...record,
        knownSpells: nextKnown,
        swapsApplied: [
          ...record.swapsApplied,
          { appliedAtLevel: level, forgotten, learned },
        ],
      };
    }),
  })),
```
Also add a revalidation guard that rejects swaps whose `appliedAtLevel` is not in `SORCERER_SWAP_LEVELS` / `BARD_SWAP_LEVELS`, emitting an `illegal` `ValidationOutcome` so out-of-cadence swaps are caught at cascade time.

### CR-02: `aggregateMagicLegality.STATUS_ORDER` has `legal` and `pending` swapped vs selectors; rollup picks wrong worst status

**File:** `packages/rules-engine/src/magic/magic-legality-aggregator.ts:17-22`, `apps/planner/src/features/magic/selectors.ts:80-85`
**Issue:** The aggregator declares:
```ts
const STATUS_ORDER = { illegal: 0, blocked: 1, legal: 2, pending: 3 };
```
and its comment claims this "Mirrors the selector STATUS_ORDER exactly." But `selectors.ts` uses:
```ts
const STATUS_ORDER = { illegal: 0, blocked: 1, pending: 2, legal: 3 };
```
Lower value = more severe in both. In the aggregator, `legal (2) < pending (3)` means legal is treated as *more severe* than pending, so a build with one legal level and one pending level rolls up to `legal`. Every other consumer (selectors.ts `selectMagicSummary`, feats/selectors.ts) treats pending as more severe than legal. Result: `aggregateMagicLegality` and `selectMagicSummary` disagree on the aggregate status when the build mixes the two, producing inconsistent summary chips between the board status indicator and the global summary rollup. No existing test exercises the mixed case (`magic-legality-aggregator.spec.ts` line 52-65 accepts *either* `legal` or `pending`, which hides the bug).
**Fix:**
```ts
// magic-legality-aggregator.ts
const STATUS_ORDER: Record<MagicEvaluationStatus, number> = {
  illegal: 0,
  blocked: 1,
  pending: 2,
  legal: 3,
};
```
Then add an aggregator test that seeds a two-level build with one `pending` and one `legal` level and asserts `result.status === 'pending'` to lock the contract.

### CR-03: `computeSpellSlots` indexing mismatches the stored `casterLevel` when the extractor skips all-null rows

**File:** `packages/rules-engine/src/magic/caster-level.ts:49-67`, `packages/data-extractor/src/assemblers/spell-assembler.ts:234-262`
**Issue:** Extractor pushes `{ casterLevel: rowIndex + 1, slots }` only when `hasAnySlot` is true. Rows whose 10 `SpellLevel*` columns are all `****` or null are skipped. The result is that `rows[i]` does not have `casterLevel === i + 1` after any skip. Downstream, `computeSpellSlots` does `table[casterLevel - 1]`, and `spellAccessMinCasterLevel` loops `for (const row of table) { if (computeSpellSlots(..., row.casterLevel, ...) > 0) ... }`. Once a skip happens, `row.casterLevel - 1` points at the wrong array slot (either the next row or out-of-bounds), producing silently-wrong slot counts and silently-wrong "min caster level" results.

In practice the NWN1 base tables populate `0` rather than `****` for inaccessible spell levels, which keeps `hasAnySlot` true and hides the bug, but the structure is brittle: any Puerta custom class or future 2DA override that ships a fully-null row will produce wrong data. The safe contract is "array index must match stored casterLevel - 1, or lookup must not assume it does."
**Fix:** Either (a) push a zero-filled row whenever a gap occurs so the array stays dense and `table[casterLevel - 1]` is always valid, or (b) change `computeSpellSlots` to scan by field, not by index:
```ts
// caster-level.ts (option b — safer against any future extractor change)
export function computeSpellSlots(
  classId: string,
  casterLevel: number,
  spellLevel: number,
  spellCatalog: SpellCatalog,
): number {
  if (casterLevel < 1 || spellLevel < 0 || spellLevel > 9) return 0;
  const table = spellCatalog.spellGainTables[classId];
  if (!table || table.length === 0) return 0;
  const row = table.find((r) => r.casterLevel === casterLevel);
  if (!row) return 0;
  const key = String(spellLevel) as '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9';
  return row.slots[key] ?? 0;
}
```
Prefer (b) — O(16) at worst, and it eliminates the invariant the extractor has to uphold. Add a test that exercises a synthetic `spellGainTables` entry with a gap (e.g., casterLevel 1 missing, 2 present) to lock the contract.

## Warnings

### WR-01: `dispatchParadigm` uses `characterLevel === 1` as proxy for "first cleric level", breaking multiclass domain selection

**File:** `apps/planner/src/features/magic/selectors.ts:262-265`
**Issue:**
```ts
case 'class:cleric':
  return characterLevel === 1 ? 'domains' : 'prepared-summary';
```
A Fighter 1 / Cleric 2 build never sees the domain picker because level 2 routes to `prepared-summary`, yet NWN1 clerics must pick domains at their first cleric level regardless of character level. The class-levels data already in `buildState.classLevels['class:cleric']` can distinguish "first time adding cleric" from "already leveled cleric."
**Fix:**
```ts
case 'class:cleric': {
  // Domain picker fires only on the level where the build first enters cleric.
  const clericLevelHere = buildState.classLevels['class:cleric'] ?? 0;
  return clericLevelHere === 1 ? 'domains' : 'prepared-summary';
}
```
This requires plumbing `buildState` into `dispatchParadigm`, or inlining the check at the call site in `selectMagicBoardView`. Update `classHasCastingAtLevel` / domain tests to cover the Fighter 1 / Cleric 2 scenario.

### WR-02: `selectMagicSheetTabView` never validates selections; `invalidCount` is always 0

**File:** `apps/planner/src/features/magic/selectors.ts:647-716`
**Issue:** Every pushed row hardcodes `status: 'legal'` and `statusReason: null`, and `invalidCount` is initialized but never incremented. `MagicSheetTab.tsx:47-52` only renders the "N invalidas" suffix when `invalidCount > 0`, so illegal spells in the character-sheet tab are visually indistinguishable from legal ones. Feat-sheet-tab (`feats/selectors.ts:440-574`) does the full validation; magic-sheet-tab should mirror that path.
**Fix:** Call `evaluateSpellPrerequisites` per spell and optionally `detectMissingSpellData`, then map failing results to `status: 'illegal'` / `status: 'blocked'` with a Spanish `statusReason` (concatenate `check.label: check.current` like feat-sheet-tab does), incrementing `invalidCount` on every non-legal row.

### WR-03: `evaluateSpellPrerequisites` fallback formula silently applies to classes with an extracted gain table

**File:** `packages/rules-engine/src/magic/spell-prerequisite.ts:77-82`
**Issue:**
```ts
const minCasterLevel =
  spellAccessMinCasterLevel(classId, requiredSpellLevel, spellCatalog) ??
  (requiredSpellLevel === 0 ? 1 : 2 * requiredSpellLevel - 1);
```
If `spellAccessMinCasterLevel` returns `null`, we use the full-caster approximation. But `spellAccessMinCasterLevel` returns `null` only when the table is missing OR no row grants the slot at all. That second condition is a real signal — "this class cannot cast this spell level, ever" — and the current code overrides it with "try 2*S-1 anyway." For half-casters (paladin, ranger) looking up 6th+ spell levels, this fallback says "needs level 11" instead of blocking outright, which marks level-16 paladins eligible to learn wizard level-6 spells (no-table path) or similar gotchas once the wizard/sorcerer dual-tagging is fixed.
**Fix:** Distinguish "no table" from "slot never granted":
```ts
const table = spellCatalog.spellGainTables[classId];
const hasTable = table && table.length > 0;
const minCasterLevel = hasTable
  ? spellAccessMinCasterLevel(classId, requiredSpellLevel, spellCatalog)
  : (requiredSpellLevel === 0 ? 1 : 2 * requiredSpellLevel - 1);
if (minCasterLevel == null) {
  checks.push({
    type: 'class-level',
    label,
    met: false,
    required: 'No disponible',
    current: casterLevel > 0 ? `Nivel ${casterLevel}` : 'Sin niveles',
  });
  continue;
}
```

### WR-04: Wizard+Sorcerer share `Wiz_Sorc` column; only last-iterated class gets tagged spells

**File:** `packages/data-extractor/src/assemblers/spell-assembler.ts:125-128`, `packages/data-extractor/src/cli.ts:107-114`
**Issue:** `columnToClassId` is a `Map<column, classId>`; both Wizard and Sorcerer point at `Wiz_Sorc`, so the second `.set()` overwrites the first. `deferred-items.md` documents this and the Wave 0 test workaround (uses `class:bard` instead of `class:sorcerer`), but the underlying data gap persists in this phase's shipped catalog: `compiled-spells.ts` has 0 sorcerer-tagged entries. Any phase-07 code that needs sorcerer coverage (e.g., the known-spell paradigm, D-15 swap cadence) is exercising an empty universe.
**Fix:** Promote the map to `Map<string, string[]>` and have the spell assembler tag every class whose column matches:
```ts
const columnToClassIds = new Map<string, string[]>();
for (const [classId, info] of classRows) {
  const list = columnToClassIds.get(info.spellColumnName) ?? [];
  list.push(classId);
  columnToClassIds.set(info.spellColumnName, list);
}
// ... later ...
for (const colName of classColumnNames) {
  const val = parseIntOrNull(row[colName]);
  if (val != null && val >= 0 && val <= 9) {
    const classIds = columnToClassIds.get(colName)!;
    for (const classId of classIds) classLevels[classId] = val;
  }
}
```
Matches the fix already sketched in `deferred-items.md`.

### WR-05: `MagicBoardView.emptyStateBody` hardcodes the `'La magia sigue bloqueada'` string despite the copy sentinel comment

**File:** `apps/planner/src/features/magic/selectors.ts:397-402`
**Issue:**
```ts
return {
  activeSheet: emptySheet,
  // Plan 07-03 replaces this sentinel with shellCopyEs.magic.emptyStateBody.
  emptyStateBody: 'La magia sigue bloqueada',
};
```
The comment claims 07-03 will replace this, but the copy verifier (`scripts/verify-phase-07-copy.cjs`) already requires `missingDescription`, `missingGrants`, `validationLegal`, etc. under `shellCopyEs.magic.*`, and `magic-board.tsx` now imports `shellCopyEs.magic` directly. The selector should read `shellCopyEs.magic.emptyStateHeadingNotReady` / `emptyStateBodyNotReady` instead of the hardcoded literal, keeping the Spanish-first copy contract single-sourced. Leaving the literal also means any future copy change will silently diverge between board and selector.
**Fix:**
```ts
import { shellCopyEs } from '@planner/lib/copy/es';
// ...
return {
  activeSheet: emptySheet,
  emptyStateBody: shellCopyEs.magic.emptyStateBodyNotReady,
};
```
Note: selectors are currently pure TS with no copy import. Either add the import (making the selector rely on app-land copy, which is fine since the selector already lives under `apps/planner`) or thread the string in from `magic-board.tsx` via a selector argument.

### WR-06: `SwapSpellDialog` step-1/step-2 `ConfirmDialog` uses `onConfirm={onClose}` — user can "Aceptar" an empty selection and skip the swap

**File:** `apps/planner/src/features/magic/swap-spell-dialog.tsx:54-57, 82-85`
**Issue:** Both step 1 (pick forget) and step 2 (pick learn) wire `onConfirm={onClose}`. When the user clicks "Aceptar" without selecting anything, the dialog closes and no swap fires — but the user may believe a swap happened because the confirm button reads "Aceptar." The confirm button should either be disabled until a selection is made (preferred) or ignored / forced to act as "next step."
**Fix:** Add an enable-gate via the ConfirmDialog — since ConfirmDialog does not currently expose a `confirmDisabled` prop, plumb one through. Minimal fix here:
```tsx
// step 1
<ConfirmDialog
  body={magicCopy.swapStep1Body}
  onCancel={onClose}
  // 'Aceptar' is inert until the user picks an item via OptionList (which sets forgetId).
  onConfirm={() => { /* noop — user must click a row, which advances via setForgetId */ }}
  open
  title={magicCopy.swapStep1Title}
>
```
Or better: extend `ConfirmDialog` with `confirmDisabled?: boolean` and disable the Aceptar button until `forgetId` / `learnId` is truthy. Independent of the CR-01 state-mutation fix — both need to ship together for the feature to work.

### WR-07: `domain-rules.evaluateDomainSelection` accepts the cleric check as `>= 1` but the catalog never surfaces domains for non-cleric builds anyway; two sources of truth can drift

**File:** `packages/rules-engine/src/magic/domain-rules.ts:32-38, 72-83`, `apps/planner/src/features/magic/selectors.ts:548-598`
**Issue:** `evaluateDomainSelection` enforces cleric >= 1 through a `PrerequisiteCheck` row. `getEligibleDomains` enforces the same via `if (clericLevel < 1) return [];`, which silently hides the rule from the UI for non-clerics. The selector uses `evaluateDomainSelection` per domain, but also relies on `paradigm === 'domains'` (which is gated by `dispatchParadigm`), so non-cleric domain selection is never rendered. Net result: three independent gates prevent non-cleric domain selection, each with slightly different semantics (empty list vs blocked check vs paradigm redirect). Any future change to class support (e.g., a Puerta prestige cleric) must update all three.
**Fix:** Consolidate on `evaluateDomainSelection` as the source of truth; have `getEligibleDomains` return an always-populated list plus a top-level "not a cleric" `ValidationOutcome` instead of returning `[]`, so the UI can render a helpful explanation instead of an empty grid. Alternatively, leave as-is and add a `07-PATTERNS.md` note that three gates are intentional.

## Info

### IN-01: `selectMagicSheetTabView` iterates `Object.values(lvl.spellbookAdditions)` / `lvl.knownSpells` without sorting by spell level

**File:** `apps/planner/src/features/magic/selectors.ts:680-704`
**Issue:** Iteration order of `Object.values` on a numeric-key object is insertion order (modern engines). Since spells are added via user clicks at various spell levels, the character-sheet tab can display spells in add-order rather than level-ascending order, which is visually inconsistent with the player's mental model (level-0 cantrips, then level-1, then level-2, ...).
**Fix:** Sort entries before iterating:
```ts
const entries = Object.entries(lvl.spellbookAdditions)
  .map(([k, v]) => [Number(k), v] as const)
  .sort((a, b) => a[0] - b[0]);
for (const [sl, list] of entries) { ... }
```

### IN-02: `CLASS_LABELS_ES` in spell-prerequisite.ts duplicates class naming that belongs in the class catalog

**File:** `packages/rules-engine/src/magic/spell-prerequisite.ts:26-34`
**Issue:** Hardcoded Spanish class labels live inline in the rules-engine. The `ClassCatalog` already ships a `label` field per class (see `compiledClassCatalog.classes[i].label`). The inline map is a second source of truth and will drift when Puerta adds a custom class.
**Fix:** Either accept `classCatalog` as a parameter and look up labels from `classCatalog.classes.find((c) => c.id === classId)?.label`, or move the map to a shared `@rules-engine/contracts/class-labels-es` module if breaking the dependency on ClassCatalog is undesirable.

### IN-03: `MagicSheetTab.tsx:54-57` hardcodes "Este personaje no lanza conjuros." instead of using `shellCopyEs.magic.noCastingStepTitle` or a dedicated copy key

**File:** `apps/planner/src/features/magic/magic-sheet-tab.tsx:54-57`
**Issue:** Literal Spanish string breaks the copy-single-source contract enforced by `verify-phase-07-copy.cjs`. The verifier currently only checks the `magic.*` namespace exists, not that every Spanish string in feature files comes from that namespace.
**Fix:** Add `magicSheetTabEmpty` (or similar) to `shellCopyEs.magic` and read from there.

### IN-04: `domain-rules.ts:27` accepts `_domainCatalog` but never uses it

**File:** `packages/rules-engine/src/magic/domain-rules.ts:28`
**Issue:** `evaluateDomainSelection` accepts `_domainCatalog: DomainCatalog` but never reads it. The `_` prefix signals intent ("unused on purpose") but the function signature is misleading — callers think the catalog matters for evaluation when it does not. Removing it forces callers to confront that domain selection is catalog-agnostic at the rule level (only the fail-closed gate cares about catalog data, via `detectMissingDomainData`).
**Fix:** Drop the parameter from the signature, or add a short comment documenting "reserved for future PuertaDeBaldur per-domain rules."

### IN-05: `magic-revalidation.ts` duplicates dedupe/inherited-issue helpers from `feat-revalidation.ts`

**File:** `packages/rules-engine/src/magic/magic-revalidation.ts:43-90`
**Issue:** `dedupeIssues`, `getInheritedIssue`, and `createIllegalIssue` are copied byte-for-byte from `feat-revalidation.ts` (the code comment acknowledges this). Two copies will drift independently — a fix to one won't propagate. The duplication is intentional per the 07-RESEARCH cross-reference, but it's still a maintenance hazard.
**Fix:** Extract to `packages/rules-engine/src/revalidation/shared.ts`:
```ts
export function dedupeValidationOutcomes(issues: ValidationOutcome[]): ValidationOutcome[] { ... }
export function makeInheritedIssue(affectedIds: string[]): ValidationOutcome { ... }
export function makeIllegalIssue(affectedIds: string[]): ValidationOutcome { ... }
```
Import from both `feat-revalidation.ts` and `magic-revalidation.ts`. Lock the contract with a unit test that covers both module consumers.

---

_Reviewed: 2026-04-17T11:21:49Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
