---
phase: 07-magic-full-legality-engine
reviewed: 2026-04-17T15:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - apps/planner/src/components/ui/confirm-dialog.tsx
  - apps/planner/src/features/magic/selectors.ts
  - apps/planner/src/features/magic/store.ts
  - apps/planner/src/features/magic/swap-spell-dialog.tsx
  - apps/planner/src/lib/copy/es.ts
  - package.json
  - packages/data-extractor/src/assemblers/spell-assembler.ts
  - packages/rules-engine/src/magic/magic-legality-aggregator.ts
  - packages/rules-engine/src/magic/magic-revalidation.ts
  - tests/phase-07/magic-legality-aggregator.spec.ts
  - tests/phase-07/magic-revalidation.spec.ts
  - tests/phase-07/magic-sheet-tab-validation.spec.ts
  - tests/phase-07/magic-store.spec.ts
  - tests/phase-07/paradigm-dispatch.spec.ts
  - tests/phase-07/sorcerer-catalog-coverage.spec.ts
  - tests/phase-07/spell-eligibility.spec.ts
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 7: Code Review Report (Post Gap-Closure)

**Reviewed:** 2026-04-17T15:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

This review covers the Phase 7 gap-closure deltas from plans 07-04 (CR-01, CR-02, WR-01, WR-02, WR-06) and 07-05 (WR-04 extractor promotion to plural class mapping). The previously flagged Critical/Warning bugs from the earlier 07-REVIEW.md are verified closed:

- CR-01 (swap cadence unchecked) is enforced in `magic-revalidation.ts` with `lvl.classId`-scoped allow-lists and a dedicated illegal issue.
- CR-02 (aggregator STATUS_ORDER drift) brings the aggregator in line with the selector's ordering map.
- WR-01 (cleric paradigm misfire on multiclass) now reads `classLevels['class:cleric']` instead of character level.
- WR-02 (sheet tab hardcoded status) now runs per-row catalog + prereq validation and updates `invalidCount`.
- WR-04 (extractor singular column map) promoted to plural `Map<string, string[]>` so Wizard and Sorcerer both receive spells from the shared `Wiz_Sorc` column.
- WR-06 (ConfirmDialog had no disabled state) now exposes `confirmDisabled`.

Residual findings are all net-new issues introduced by or exposed during the gap-closure work. One Warning uncovers a subtle regression in the aggregator initial value that defeats the CR-02 fix for fully-legal builds; another Warning flags a real silent-inconsistency risk in `store.applySwap`. The rest are informational polish items.

No critical security, injection, or data-loss issues were found. No hardcoded secrets, eval calls, `innerHTML`, or unsafe deserialization present in the reviewed surface.

## Warnings

### WR-01 (new): `aggregateMagicLegality` returns `'pending'` for an all-legal build

**File:** `packages/rules-engine/src/magic/magic-legality-aggregator.ts:74`
**Issue:** The reduction seed is `let worst: MagicEvaluationStatus = 'pending';` but the comparator keeps the lower-order status. Given `STATUS_ORDER.pending = 2` and `STATUS_ORDER.legal = 3`, when every revalidated level is `'legal'` the condition `STATUS_ORDER[r.status] < STATUS_ORDER[worst]` is `3 < 2`, which is false on every iteration. `worst` never leaves its `'pending'` seed, so the aggregator reports `'pending'` instead of `'legal'` for a fully legal build.

This diverges from the equivalent reduction in `selectors.ts::selectMagicSummary` (line 818-822), which correctly seeds with `'legal'`. The aggregator's own docstring claims "Mirrors the selector STATUS_ORDER exactly so the aggregator and runtime summary stay consistent" — this bug breaks that invariant.

The aggregator test at `tests/phase-07/magic-legality-aggregator.spec.ts:70` masks this bug with `expect(['legal', 'pending']).toContain(result.status);` — see IN-01.

**Fix:** Seed with `'legal'` (the least severe status) so any lower-order level status wins:
```ts
let worst: MagicEvaluationStatus = 'legal';
```

### WR-02 (new): `store.applySwap` silently drops the learned spell when `forgotten` is not in any `knownSpells` bucket

**File:** `apps/planner/src/features/magic/store.ts:144-172`
**Issue:** `applySwap` scans every `knownSpells` bucket for `forgotten`; if none contains it, `spellLevelOfForgotten` stays `null` and the conditional block that inserts `learned` never runs. However, the `swapsApplied` record is still appended. Result: persisted state records a swap that replaced nothing — the learned spell never appears in `knownSpells`, but revalidation still sees the SwapRecord.

The SwapSpellDialog only sources `forgetId` from the current `knownSpells` list, so in normal flow this shouldn't happen. The risk surface is:
1. Stale `forgetId` references (rare but possible if the store is edited between dialog render and Aceptar click).
2. JSON imports or URL-share payloads that include a SwapRecord with a `forgotten` id no longer in `knownSpells`.
3. Class-reassignment flows that wipe `knownSpells` without pruning `swapsApplied`.

Either of those produces state where the swap is "accounted for" in the audit log but the learned spell never surfaces in the active sheet.

**Fix:** Either reject the swap (no-op, optionally assert) when `forgotten` is absent, OR append `learned` to a default bucket derived from `spell.classLevels[classId]`. Safest minimal fix — no-op the swap entirely:
```ts
if (spellLevelOfForgotten == null) {
  return record; // forgotten not present; do not persist an orphan SwapRecord
}
nextKnown[spellLevelOfForgotten] = [
  ...(nextKnown[spellLevelOfForgotten] ?? []),
  learned,
];
return {
  ...record,
  knownSpells: nextKnown,
  swapsApplied: [
    ...record.swapsApplied,
    { appliedAtLevel: level, forgotten, learned },
  ],
};
```

### WR-03 (new): `store.applySwap` can duplicate `learned` across buckets

**File:** `apps/planner/src/features/magic/store.ts:157-162`
**Issue:** After removing `forgotten` from its bucket, `applySwap` appends `learned` unconditionally. If `learned` was already present at a different spell-level bucket, the result is duplication — the same spell id appears twice in `knownSpells`. `addKnownSpell` explicitly dedupes on `existing.includes(spellId)`; `applySwap` does not.

SwapSpellDialog step 2 filters by `sp.spellId !== forgetId` but does not filter by "already known at another level" (which is rare but legal — a sorcerer can know the same spell at both level 1 and level 2 buckets only in pathological cases, but same-bucket duplication across levels is theoretically reachable when the dialog populates `eligibleSpells` from `getEligibleSpellsAtLevel` at a single `activeSpellLevel`).

Lower severity than WR-02 because the overlap scenario is narrow, but it is real and worth locking down.

**Fix:** Filter the target bucket for `learned` before appending:
```ts
const targetBucket = nextKnown[spellLevelOfForgotten] ?? [];
nextKnown[spellLevelOfForgotten] = targetBucket.includes(learned)
  ? targetBucket
  : [...targetBucket, learned];
```

## Info

### IN-01: Test accepts both correct and buggy aggregator status for an empty-selection caster

**File:** `tests/phase-07/magic-legality-aggregator.spec.ts:70`
**Issue:** `expect(['legal', 'pending']).toContain(result.status);` accepts either status for a single-level caster with no selections. That's what allows WR-01 above to remain latent — the test passes today because `'pending'` is an accepted answer. Once WR-01 is fixed, the correct answer is deterministic and the `.toContain` should be tightened so future regressions are caught.

**Fix:** After fixing WR-01 in the aggregator, pin the expectation. The single-level cleric-1-at-class-level-1 with no selections has one `'legal'` revalidated level (because `hasCaster` is true and no illegal/blocked issues fire) → aggregator must return `'legal'`:
```ts
expect(result.status).toBe('legal');
```

### IN-02: `dispatchParadigm` carries a `characterLevel` parameter it no longer uses

**File:** `apps/planner/src/features/magic/selectors.ts:257-287`
**Issue:** `characterLevel` is parameter 2 but the body only consults `classLevels`. The comment (line 264-265) documents this as "retained for signature stability" and voids it via `void characterLevel;`. The retention cost is one dead parameter on every call; the visible benefit is unchanged. Consider dropping it on the next signature churn so the call sites stop passing unused arguments (two call sites in the same file, lines 422).

**Fix:** Remove the parameter and update both call sites in `selectors.ts`:
```ts
function dispatchParadigm(
  classId: CanonicalId | null,
  classLevels: Record<string, number>,
): MagicParadigm {
  // ...
}
// call site:
const paradigm = dispatchParadigm(classId, buildState.classLevels);
```

### IN-03: SwapSpellDialog step 1/2 renders a disabled-on-purpose Aceptar button whose `onConfirm` is a no-op

**File:** `apps/planner/src/features/magic/swap-spell-dialog.tsx:50-68, 82-99`
**Issue:** Step 1 and Step 2 pass `confirmDisabled={!forgetId}` / `confirmDisabled={!learnId}` and rely on `OptionList.onSelect` to advance via state mutation. The Aceptar button is therefore never enabled in these steps (selection causes re-render that short-circuits into the next step before the button can be clicked). The existing comment correctly documents this, but the effect is a confirmation dialog whose primary action is a phantom — novice users may click Aceptar expecting it to "confirm the selection" and see nothing happen until they click a row.

Not a bug (the interaction works as designed), but worth considering a clearer interaction pattern — e.g., select-then-enable-Aceptar rather than immediate advance — on the next UX pass.

**Fix:** (UX polish, not a defect.) If the dialog is revisited, consider:
- Keep selection local to the step; only advance when Aceptar is clicked.
- Or: hide the Aceptar button in multi-step mode and show a "Siguiente" affordance elsewhere.

### IN-04: Hardcoded empty-state sentinel instead of shellCopyEs reference

**File:** `apps/planner/src/features/magic/selectors.ts:410`
**Issue:** The empty-progression branch returns `emptyStateBody: 'La magia sigue bloqueada'` (literal Spanish). The comment explicitly notes "Plan 07-03 replaces this sentinel with shellCopyEs.magic.emptyStateBody." Plan 07-03 has completed (SUMMARY dated 2026-04-17T13:15) and `shellCopyEs.magic.emptyStateHeadingNotReady` / `emptyStateBodyNotReady` are present in `lib/copy/es.ts:183-184`. The selector was not migrated.

Consequence: a Spanish string lives in two places, and future translation or rewording must hit both sites. Low risk, but it blocks the stated Spanish-first i18n discipline from CLAUDE.md.

**Fix:** Import `shellCopyEs` (already done on line 34) and reference the existing key:
```ts
emptyStateBody: shellCopyEs.magic.emptyStateBodyNotReady,
```

### IN-05: Narrow regex for Puerta custom-content detection is catalog-slug-brittle

**File:** `tests/phase-07/spell-eligibility.spec.ts:95-121`
**Issue:** The "catalog contains Puerta custom content" assertion uses `/^spell:[a-z]+$/` with `length > 14` as a heuristic for Spanish-only slugs. This relies on three assumptions (no hyphens, no digits, slug length > 14) that the extractor doesn't guarantee. If a future extraction pass emits custom spells with hyphens (e.g., `spell:agarre-electrizante`) or digits (`spell:bola-fuego-2`), this test silently loses signal by falling through with an empty `puertaLikeIds` array — and then the `toBeGreaterThan(0)` assertion becomes the only thing standing between the test and a false negative.

If a future refactor accidentally removes all Puerta custom content from the catalog, the test should fail loudly pointing at that regression. Today, it would fail with "puertaLikeIds.length > 0" without indicating that the slug-format assumption also shifted.

**Fix:** Tie the assertion to a known Puerta-specific catalog fact (e.g., a datasetId marker, a provenance field, or a curated-list check) rather than a slug-shape heuristic:
```ts
// Example — assumes a provenance field on CompiledSpell. If not present,
// curate a small list of known Puerta spell ids as a regression anchor.
const puertaSpells = compiledSpellCatalog.spells.filter(
  (s) => s.provenance === 'puerta' || KNOWN_PUERTA_SPELL_IDS.has(s.id),
);
expect(puertaSpells.length).toBeGreaterThan(0);
```

---

## Cross-file Consistency Check

- `SORCERER_SWAP_LEVELS` and `BARD_SWAP_LEVELS` duplicated verbatim in `selectors.ts` (lines 77-79) and `magic-revalidation.ts` (lines 22-25). Both files comment the duplication and link to D-15. This is acceptable under the "rules engine must be UI-framework-free" constraint in CLAUDE.md, but a future extraction into `packages/rules-engine/src/magic/swap-cadence.ts` (shared constant) would eliminate the drift surface. Not flagged as a finding — the current duplication is intentional and well-commented.
- `STATUS_ORDER` duplicated between `selectors.ts:81-86` and `magic-legality-aggregator.ts:17-22`. Both commented. Same observation as above — WR-01 exists precisely because the *seed value* is the drift point, not the order map itself.

## Files With No Findings

- `apps/planner/src/components/ui/confirm-dialog.tsx` — `confirmDisabled` prop correctly wired, `showModal`/`close` guarded by `dialog.open`. Clean.
- `apps/planner/src/lib/copy/es.ts` — string table only, no logic.
- `package.json` — no version-range, secret, or scripts-injection issues.
- `packages/data-extractor/src/assemblers/spell-assembler.ts` — WR-04 promotion is correct and covered by `sorcerer-catalog-coverage.spec.ts`.
- `packages/rules-engine/src/magic/magic-revalidation.ts` — swap-cadence validation, dedupe, and inheritance all aligned with feat-revalidation pattern.
- `tests/phase-07/magic-revalidation.spec.ts` — fallback logic for pre-07-05 sorcerer catalogs is defensible.
- `tests/phase-07/magic-sheet-tab-validation.spec.ts` — unconditional `expect(row).toBeDefined()` prevents vacuous pass.
- `tests/phase-07/magic-store.spec.ts` — dynamic spell-id resolution with LOUD-fail pattern.
- `tests/phase-07/paradigm-dispatch.spec.ts` — covers both Fighter-1/Cleric-2 and Cleric-1/Cleric-2 branches.
- `tests/phase-07/sorcerer-catalog-coverage.spec.ts` — regression guard against WR-04 reverting.

---

_Reviewed: 2026-04-17T15:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
