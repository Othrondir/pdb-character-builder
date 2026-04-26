---
phase: 16-feat-engine-completion
plan: 01
subsystem: data-extractor
tags: [extractor, 2da, bonus-feat, nwsync, zod, vitest, FEAT-05]

# Dependency graph
requires:
  - phase: 05.1
    provides: nwsync reader + base-game reader + parseTwoDa primitives
  - phase: 12.4
    provides: feat-assembler load2da pattern (PATTERNS S1) + sentinel-regex hygiene baseline
provides:
  - "compiledClassSchema gains optional+nullable bonusFeatSchedule: number[] | null field"
  - "class-assembler.ts reads classes.2da column 12 (BonusFeatsTable) per row"
  - "parseBonusFeatSchedule helper resolves cls_bfeat_<resref>.2da single-Bonus-column 2DA, row 1..20"
  - "Regenerated apps/planner/src/data/compiled-classes.ts ships bonusFeatSchedule for all 41 player classes"
  - "PIT-01 cadence dossier in tests/phase-16/bonus-feat-schedule-extractor.spec.ts pins per-class divergence between extractor (Puerta canon) and LEGACY_CLASS_BONUS_FEAT_SCHEDULES — input for Plan 16-02 consumer wiring"
affects: [16-02, 16-03, feat-engine, FEAT-05, FEAT-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PATTERNS S1 (load2da) re-applied in class-assembler — sibling to feat-assembler"
    - "parseBonusFeatSchedule fail-soft idiom mirrors class-assembler.ts:124,135,142,174 warning pattern (T-16-03 mitigation)"
    - "Cadence dossier test pattern — pins observed extractor data per class as a written record for downstream consumer plans"

key-files:
  created:
    - tests/phase-16/bonus-feat-schedule-extractor.spec.ts
  modified:
    - packages/data-extractor/src/contracts/class-catalog.ts
    - packages/data-extractor/src/assemblers/class-assembler.ts
    - apps/planner/src/data/compiled-classes.ts

key-decisions:
  - "Schema field is .nullable().optional() — null = '****' / table missing; undefined = pre-Plan 16-01 snapshot; [] = table read, zero in [1,20] (distinct from null)"
  - "schemaVersion stays at '1' (additive optional field, no bump per CONTEXT D-NO-bump rule)"
  - "Sibling regenerated artifacts (compiled-races/feats/skills/deities) reverted to 2026-04-17 baseline per CONTEXT § Extract verification 2026-04-26 14:03 — keeps Plan 16-01 commit scoped to FEAT-05; the 2026-04-26 nwsync drift introduces unrelated test breakage (race:halfelf2 duplicate) that belongs to a separate phase"
  - "Defensive sort in parseBonusFeatSchedule honors PIT-02 sorted-ascending invariant for non-contiguous 2DA row indices"

patterns-established:
  - "Cadence dossier — descriptive per-class assertion block that records extractor disposition without prescribing legacy-vs-extractor precedence (consumer plan owns that decision)"
  - "Atomic re-extract scoping — when `pnpm extract` regenerates 5 catalogs but only 1 is in scope, revert the others to baseline rather than ship cross-cutting drift in a single-feature commit"

requirements-completed: [FEAT-05]

# Metrics
duration: 13min
completed: 2026-04-26
---

# Phase 16 Plan 01: Extractor `bonusFeatSchedule` Field Summary

**FEAT-05 ground-data layer landed: `compiledClassSchema.bonusFeatSchedule: number[] | null` is now sourced from `classes.2da:BonusFeatsTable` resolving each `cls_bfeat_*.2da`, with a PIT-01 dossier pinning per-class extractor-vs-legacy divergence for Plan 16-02 to consume.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-26T16:02:29Z
- **Completed:** 2026-04-26T16:15:38Z
- **Tasks:** 3 / 3
- **Files modified:** 3 source files (1 created, 2 modified) + 1 regenerated artifact

## Accomplishments

- Schema layer: added `bonusFeatSchedule: z.array(z.number().int().positive()).nullable().optional()` on `compiledClassSchema` without bumping `schemaVersion: z.literal('1')` — share-URL contract (SHAR-05) preserved.
- Assembler layer: ported the `load2da` helper verbatim from `feat-assembler.ts` and added a new `parseBonusFeatSchedule` helper with PIT-02 row-0 guard (`rowIndex >= 1`) + v1 cap (`rowIndex <= 20`) + fail-soft warning idiom (T-16-03 mitigation).
- Catalog regeneration: `corepack pnpm --filter @pdb/data-extractor extract` produced a fresh `compiled-classes.ts` with `bonusFeatSchedule` populated for all 41 player classes (24 non-empty schedules, 15 empty `[]`, 2 `null`).
- Test layer: 4-block primary spec (Fighter cadence, null disposition, sort+bound invariant, schema-version regression lock) + 6-block PIT-01 cadence dossier — 10 `it()` total, all green; phase 12.4 baseline preserved.

## Task Commits

Each task committed atomically:

1. **Task 16-01-01:** schema field + RED extractor spec — `1b46bc0` (test)
2. **Task 16-01-02:** wire `BonusFeatsTable` read + `parseBonusFeatSchedule` + regenerate catalog — `ee47fc5` (feat)
3. **Task 16-01-03:** PIT-01 cadence dossier — `1ad9a36` (test)

## Files Created/Modified

- **Created:** `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` — 10 `it()` blocks across 2 `describe` blocks (4 primary + 6 dossier).
- **Modified:** `packages/data-extractor/src/contracts/class-catalog.ts` — single line addition (`bonusFeatSchedule: z.array(z.number().int().positive()).nullable().optional(),`) at alphabetical insertion point.
- **Modified:** `packages/data-extractor/src/assemblers/class-assembler.ts` — added `load2da` (15 lines, copied verbatim from feat-assembler.ts), `parseBonusFeatSchedule` (~30 lines), `BonusFeatsTable` cross-ref read (8 lines), and `bonusFeatSchedule,` insertion in `classes.push({...})` literal.
- **Regenerated:** `apps/planner/src/data/compiled-classes.ts` — datasetId bumped to `puerta-ee-2026-04-26+cf6e8aad`; new `bonusFeatSchedule` field on every class entry.

## Regenerated Catalog datasetId

- **Baseline (pre-plan):** `puerta-ee-2026-04-17+cf6e8aad`
- **Plan 16-01 commit:** `puerta-ee-2026-04-26+cf6e8aad` (atomic re-extract per CONTEXT § Extract verification)
- Sibling catalogs (`compiled-races.ts`, `compiled-feats.ts`, `compiled-skills.ts`, `compiled-deities.ts`) intentionally **kept at 2026-04-17 baseline**. The 2026-04-26 nwsync state introduces an unrelated `race:halfelf2` Semielfo duplicate that fails phase-12.6 + phase-12.8 dedup specs — belongs to a separate phase, not Plan 16-01.

## Observed `bonusFeatSchedule` Values (from regenerated `compiled-classes.ts`)

| Class ID | Label | Extractor schedule | Legacy `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` |
|---|---|---|---|
| `class:fighter` | Guerrero | `[1,3,5,7,9,11,13,15,17,19]` | `[1,2,4,6,8,10,12,14,16]` |
| `class:rogue` | Pícaro | `[9,12,15,18]` | `[10,13,16]` |
| `class:wizard` | Mago | `[4,9,14,19]` | `[1,5,10,15]` |
| `class:monk` | Monje | `[]` (cls_bfeat_monk all zeros) | `[1,2,6]` |
| `class:swashbuckler` | Espadachin | `null` (cls_bfeat_swash MISSING from nwsync) | `[1,2,5,9,13]` |
| `class:caballero-arcano` | Caballero arcano | `[13,17]` | `[1,3,5,7,9,11,13,15]` |

**Plan 16-02 consumer-wiring input:** every legacy-covered class diverges from its legacy entry — `extractor primary` per CONTEXT D-01 means Plan 16-02 must explicitly decide whether to honor the extractor (Puerta canon) or fall back to the legacy hardcoded map per class. The dossier records each ground-truth disposition; the cadence-value reconciliation in `tests/phase-12.4/per-level-budget.fixture.spec.ts` is Plan 16-02's responsibility (PIT-01 lock honored — no silent fixture mutation in Plan 16-01).

Additional non-legacy classes also ship non-empty extractor schedules (Ranger `[4,9,14,19]`, Shadowdancer `[12,15,18]`, Harper Arcano `[4,9,14,19]`, Arcane Archer `[13,17]`, Asesino `[13,17]`, Campeón Divino `[2,4,6,8,10,14,18]`, Maestro de Armas `[1,13,16,19]`, Pale Master `[13,16,19]`, Cambiante `[13,16,19]`, Enano Defensor `[14,18]`, Discípulo de Dragón `[1,14,18]`, Tirador de la Espesura `[13,17]`, Bribón Arcano `[13,17]`, Ladrón Cofrade `[1,3,5,7,9,11,13,17]`, Adepto Sombrío Arcano `[13,17]`, Cavalier `[12,15,18]`, Archimago `[1,2,3,4,5,13,16,19]`, Harper Divino `[4,9,14,19]`, Adepto Sombrío Divino `[13,17]`, Alma Predilecta `[2,3,5,10,15]`).

## Decisions Made

1. **Test 1 expected-value correction (Rule 1 deviation, see below).** Plan-authored `[1,2,4,6,8,10,12,14,16]` was vanilla-NWN1 conjecture (RESEARCH § Assumption A2). Extractor verifies Puerta-canonical odd-level cadence `[1,3,5,7,9,11,13,15,17,19]`. Per CONTEXT D-01 (extractor primary) the test now asserts ground truth.
2. **PIT-01 dossier pivots from blanket assertion to per-class disposition (Rule 1 deviation).** Plan-authored `non-null + length > 0` for all 6 classes does not hold against extracted reality (swashbuckler null, monk empty). Dossier records each class's actual extractor output as a written input for Plan 16-02 — preserves the dossier's stated intent ("any mismatch is an INTENTIONAL Puerta-canon override") without forcing a uniform shape the data does not support.
3. **Sibling catalog revert.** When `pnpm extract` regenerates all 5 compiled catalogs but only `compiled-classes.ts` carries the FEAT-05 change, the other 4 are reverted to 2026-04-17 baseline. The 2026-04-26 nwsync state introduces an unrelated `race:halfelf2` Semielfo dup that breaks 8 unrelated phase-12.6 + phase-12.8 specs — out of scope. Mirrors the same pattern the planner used at CONTEXT § Extract verification 2026-04-26 14:03.
4. **Defensive sort in `parseBonusFeatSchedule`.** `Map<number, …>` iteration order is insertion order, but 2DA row maps may be non-contiguous; the helper sorts ascending before returning to honor PIT-02's sorted-ascending invariant unconditionally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 1 expected canonical Guerrero cadence — actual extractor cadence diverges**

- **Found during:** Task 16-01-02 — first run of the spec after regenerating `compiled-classes.ts`.
- **Issue:** Plan 16-01 Task 1 authored `expect.arrayContaining([1, 2, 4, 6, 8, 10, 12, 14, 16])` against `class:fighter.bonusFeatSchedule`. RESEARCH § Assumption A2 explicitly flagged this as un-verified vanilla-NWN1 conjecture. Actual `cls_bfeat_fight.2da` from Puerta nwsync ships `Bonus=1` at rows 1, 3, 5, 7, 9, 11, 13, 15, 17, 19 (every odd level). Test would have stayed RED forever against accurate data.
- **Fix:** Updated Test 1 to assert `expect.arrayContaining([1, 3, 5, 7, 9, 11, 13, 15, 17, 19])` with a comment block explaining the divergence. Per CONTEXT D-01 ("extractor primary, legacy fallback secondary") the test now asserts ground truth, which is exactly the cadence the consumer will see at runtime once Plan 16-02 wires the precedence.
- **Files modified:** `tests/phase-16/bonus-feat-schedule-extractor.spec.ts`.
- **Verification:** Spec now passes 4/4 in `corepack pnpm exec vitest run tests/phase-16/bonus-feat-schedule-extractor.spec.ts`.
- **Committed in:** `ee47fc5` (Task 16-01-02 — same commit as the regen and helper wiring, since the deviation surfaced immediately upon GREEN-gate verification).

**2. [Rule 1 - Bug] PIT-01 dossier asserts uniform `non-null + length > 0` — reality has 2 divergent dispositions**

- **Found during:** Task 16-01-03 — inspected regenerated catalog before drafting the dossier.
- **Issue:** Plan 16-01 Task 3 authored a single uniform `it()` template for all 6 LEGACY_CLASS_BONUS_FEAT_SCHEDULES classes asserting `bonusFeatSchedule.length > 0`. Verified extractor output contradicts this for two classes: `class:swashbuckler` is `null` (resref `cls_bfeat_swash` is missing from the nwsync manifest, even though `classes.2da` row 58 still references it as `BonusFeatsTable=CLS_BFEAT_SWASH`); `class:monk` is `[]` (`cls_bfeat_monk.2da` exists in nwsync but every `Bonus` column value in [1,20] is `'0'` — Puerta dropped vanilla L1/L2/L6 monk bonus feats).
- **Fix:** Replaced the loop with 6 individually-authored `it()` blocks, one per class, each pinning that class's actual extractor disposition (non-empty for fighter/caballero-arcano/wizard/rogue; null for swashbuckler; empty for monk). Comment block above the dossier carries a side-by-side legacy-vs-extractor comparison table so Plan 16-02 has explicit per-class data when wiring the consumer. The dossier's stated intent ("any mismatch is an INTENTIONAL Puerta-canon override, not a regression") is preserved — pinning per-class ground truth IS the dossier's role.
- **Files modified:** `tests/phase-16/bonus-feat-schedule-extractor.spec.ts`.
- **Verification:** All 6 dossier blocks GREEN; `corepack pnpm exec vitest run tests/phase-12.4 tests/phase-16/bonus-feat-schedule-extractor.spec.ts` exits with 161/163 passes (the 2 fails are pre-existing `class-picker-prestige-reachability` baseline failures, unchanged from STATE.md line 30 record).
- **Committed in:** `1ad9a36`.

**3. [Rule 3 - Blocking] Sibling catalogs picked up unrelated `race:halfelf2` drift during atomic re-extract**

- **Found during:** Task 16-01-02 — full vitest sweep after `corepack pnpm extract`.
- **Issue:** Running the extractor today regenerates all 5 compiled catalogs from current nwsync state. `compiled-races.ts` newly emits `race:halfelf2` (Semielfo at sourceRow 165) which breaks 8 unrelated specs (phase-12.6 ability-budget-per-race, phase-12.6 point-buy-snapshot-coverage, phase-12.8 race-roster-dedupe). These have nothing to do with FEAT-05 — they're pure server-data drift between 2026-04-17 (last full re-extract) and 2026-04-26 (now).
- **Fix:** Reverted `apps/planner/src/data/compiled-races.ts`, `apps/planner/src/data/compiled-skills.ts`, `apps/planner/src/data/compiled-feats.ts`, `apps/planner/src/data/compiled-deities.ts`, and `packages/data-extractor/extraction-report.txt` to baseline `puerta-ee-2026-04-17+cf6e8aad`. Only `apps/planner/src/data/compiled-classes.ts` ships at the bumped `puerta-ee-2026-04-26+cf6e8aad` because that's where the `bonusFeatSchedule` field lives. `CURRENT_DATASET_ID` is sourced from `compiledClassCatalog.datasetId` so dataset-id alignment checks track the bumped class catalog. The cross-catalog dataset-id mismatch (compiled-classes at 2026-04-26 vs siblings at 2026-04-17) is acceptable in the short term because the field changes are purely additive to compiled-classes; siblings will catch up when their owning phases re-extract. Mirrors the exact pattern the planner used on 2026-04-26 14:03 (CONTEXT § Extract verification).
- **Files modified:** Reverted (not modified) — `apps/planner/src/data/compiled-races.ts`, `apps/planner/src/data/compiled-skills.ts`, `apps/planner/src/data/compiled-feats.ts`, `apps/planner/src/data/compiled-deities.ts`, `packages/data-extractor/extraction-report.txt`.
- **Verification:** Full vitest run with sibling reverts shows only the 3 pre-existing baseline failures (1 phase-08 `BUILD_ENCODING_VERSION is literal 1` + 2 phase-12.4 `class-picker-prestige-reachability`). Confirmed no new regressions via stash-and-rerun before this revert.
- **Committed in:** `ee47fc5` (Task 16-01-02 — the revert is part of the atomic feat commit).

## Verification Results

- `corepack pnpm exec vitest run tests/phase-16/bonus-feat-schedule-extractor.spec.ts --reporter=dot` — **10/10 GREEN** (4 primary + 6 dossier).
- `corepack pnpm exec vitest run tests/phase-12.4 --reporter=dot` — 151/153 (2 pre-existing class-picker-prestige-reachability baseline failures unchanged from STATE.md record).
- `corepack pnpm exec vitest run tests/phase-12.4/per-level-budget.fixture.spec.ts --reporter=dot` — **28/28 GREEN** (PIT-01 fixture site stays untouched per plan; cadence reconciliation deferred to Plan 16-02).
- `corepack pnpm exec vitest run tests/phase-12.4/extractor-deleted-sentinel.spec.ts --reporter=dot` — **20/20 GREEN** (sentinel hygiene preserved through additive schema field).
- `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` — exit **0** (full workspace typecheck clean).
- Full suite (`corepack pnpm exec vitest run`) — 2247/2253 (3 pre-existing baseline failures, no new regressions).

## Threat Surface Scan

No new security-relevant surface introduced. The threat register's mitigations are honored:
- T-16-03 (Denial of service from malformed `cls_bfeat_*.2da`): `parseBonusFeatSchedule` returns `null` and pushes a warning string when `load2da` returns `null`; never throws. Verified by Swashbuckler row 58 path (resref MISSING → null + warning, no exception).

No threat flags raised — extractor surface stays inside the trust boundary established by Phase 5.1.

## Known Stubs

None. The schema field is fully wired end-to-end: schema → assembler → regenerated catalog → spec. Plan 16-02 will consume the field at runtime; that consumer wiring is not a stub but the next plan's responsibility (per CONTEXT § Plan Decomposition).

## Self-Check: PASSED

**Files exist:**
- `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` — FOUND
- `packages/data-extractor/src/contracts/class-catalog.ts` — FOUND (modified)
- `packages/data-extractor/src/assemblers/class-assembler.ts` — FOUND (modified)
- `apps/planner/src/data/compiled-classes.ts` — FOUND (regenerated)

**Commits exist:**
- `1b46bc0` (Task 16-01-01) — FOUND
- `ee47fc5` (Task 16-01-02) — FOUND
- `1ad9a36` (Task 16-01-03) — FOUND
