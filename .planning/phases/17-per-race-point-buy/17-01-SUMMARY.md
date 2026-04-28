---
phase: 17-per-race-point-buy
plan: 01
subsystem: data-extractor

tags: [zod, racialtypes-2da, point-buy, extractor, additive-optional-nullable, atomic-extract]

# Dependency graph
requires:
  - phase: 16-feat-engine-completion
    provides: "Phase 16-01 additive optional nullable extractor field precedent (`bonusFeatSchedule`); atomic-extract sibling-revert pattern; race-assembler favoredClass guard idiom"
  - phase: 12.6-attribute-budget
    provides: "selectAbilityBudgetRulesForRace consumer chain + null-branch fail-closed contract preserved verbatim"
  - phase: 12.8-race-roster-dedupe
    provides: "race:halfelf2 dedup invariant — Phase 17 honours it via in-band excision (D-07)"

provides:
  - "compiledRaceSchema.abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional()"
  - "race-assembler.ts emits abilitiesPointBuyNumber per PlayerRace=1 row using parseInt + Number.isFinite + warnings.push fail-soft idiom"
  - "Regenerated apps/planner/src/data/compiled-races.ts: 45 race entries, each ships abilitiesPointBuyNumber: 30, race:halfelf2 dup excised in-band"
  - "tests/phase-17/per-race-point-buy-extractor.spec.ts: 7-test Wave 1 gate (V-01 + V-08 + V-12) GREEN"

affects: [17-per-race-point-buy-wave-2, 17-per-race-point-buy-wave-3, attribute-budget, character-foundation-selectors]

# Tech tracking
tech-stack:
  added: []   # No new deps — within-repo refactor
  patterns:
    - "Pattern S-17-A: additive optional nullable extractor field (transferred from Phase 16-01 PATTERNS S1)"
    - "Pattern S-17-B: in-loop column read with parseInt + Number.isFinite + >= 0 guard (race-assembler favoredClass mirror)"
    - "Pattern S-17-D: atomic-extract sibling-catalog revert (Phase 16-01 SUMMARY § precedent)"
    - "D-07 dedup hygiene: line-walking node script excision idiom (Phase 12.8-04 D-11 mirror, CRLF/long-line safe)"

key-files:
  created:
    - tests/phase-17/per-race-point-buy-extractor.spec.ts
  modified:
    - packages/data-extractor/src/contracts/race-catalog.ts
    - packages/data-extractor/src/assemblers/race-assembler.ts
    - apps/planner/src/data/compiled-races.ts

key-decisions:
  - "D-01 (locked): abilitiesPointBuyNumber sourced from racialtypes.2da:AbilitiesPointBuyNumber, NOT hand-authored. Hand-authored snapshot preserved untouched (Wave 3 retires)."
  - "D-06 (locked): raceCatalogSchema.schemaVersion stays at '1' — additive optional nullable is backward-compatible (mirrors Phase 16-01 bonusFeatSchedule posture)."
  - "D-07 (planner discretion, in scope per CONTEXT Q1): race:halfelf2 dup hygiene applied in-band — excised directly from regenerated compiled-races.ts via line-walking node script."
  - "Sibling regenerated catalogs (compiled-classes/feats/skills/deities) reverted to post-Phase-16 baseline — only compiled-races.ts ships in this commit (Phase 16-01 atomic-extract scoping precedent)."
  - "Snapshot module + JSON + provenance dossier preserved untouched (point-buy-snapshot.ts, data/puerta-point-buy.json, data/puerta-point-buy.md). Wave 3 retires them atomically with spec migration."
  - "extraction-report.txt reverted to baseline — describes the FULL extractor pass (which would falsely advertise sibling drift as Phase 17 work)."

patterns-established:
  - "Atomic-extract scoping (Phase 16-01 transfer): when pnpm extract regenerates 5 catalogs but only 1 is in scope, revert the others + the extraction-report.txt to baseline. Only the in-scope catalog ships."
  - "Line-walking dedup hygiene (Phase 12.8-04 transfer): when an extractor-recurring dup must be excised in-band, walk to the immediately preceding `    {` and following `    },` to scope the splice. Regex-based deletion across long generated lines is unsafe (an earlier attempt removed 13 entries when the lazy-quantifier expanded across siblings)."

requirements-completed: [ATTR-02]   # Wave 1 portion: extractor surface gates V-01, V-08, V-12. ATTR-02 fully closes in Wave 3 closeout.

# Metrics
duration: 12min
completed: 2026-04-28
---

# Phase 17 Plan 01: Per-Race Point-Buy — Wave 1 (Extractor Surface) Summary

**Extractor pipeline now surfaces `racialtypes.2da:AbilitiesPointBuyNumber` per race as `compiledRace.abilitiesPointBuyNumber: number | null`; selectors and snapshot module untouched until Wave 2.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-28T09:55Z (approx, sequential exec resume)
- **Completed:** 2026-04-28T10:14Z
- **Tasks:** 2 (RED gate + GREEN gate)
- **Files modified:** 3 source + 1 created spec
- **Commits:** 2 atomic + (this) 1 plan-metadata

## Accomplishments

- `compiledRaceSchema` extended with `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional()` between `abilityAdjustments` and `description`. `schemaVersion: z.literal('1')` preserved (additive optional nullable, mirror of Phase 16-01).
- `race-assembler.ts` reads `row.AbilitiesPointBuyNumber` per PlayerRace=1 row using the favoredClass guard idiom (`parseInt` → `Number.isFinite` → `>= 0`). Invalid non-numeric values fail-soft via `warnings.push`, never throw. Coercion of `'****' → null` is upstream in `parseTwoDa`, so the guard tests `!= null` not `!== '****'`.
- `apps/planner/src/data/compiled-races.ts` regenerated atomically: `datasetId` advanced 2026-04-17 → 2026-04-28; each of the 45 race entries now ships `abilitiesPointBuyNumber: 30` (Puerta uniform per Phase 12.6 evidence + `racialtypes.2da` source).
- `race:halfelf2` Semielfo dup recurred during regen (as RESEARCH Pitfall 1 + Phase 16-01 SUMMARY both predicted) and was excised in-band per D-07. 45 race entries remain canonical.
- Wave 1 RED-gate spec at `tests/phase-17/per-race-point-buy-extractor.spec.ts` transitioned RED → GREEN: 5 schema-parse subtests passed throughout; 2 catalog-coverage subtests RED at Task 1 commit, GREEN at Task 2 commit. 7/7 GREEN at Wave 1 boundary.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend compiledRaceSchema + RED-gate Wave 1 spec** — `9d393ae` (test)
   - `packages/data-extractor/src/contracts/race-catalog.ts`: insert `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional(),` between lines 10 and 11.
   - `tests/phase-17/per-race-point-buy-extractor.spec.ts`: created. 7 subtests — 5 GREEN immediately (schema parse: accept null/0/omitted; reject string and negative), 2 RED at this checkpoint (catalog coverage — closed by Task 2).
2. **Task 2: Read AbilitiesPointBuyNumber + regenerate compiled-races** — `ed45edf` (feat)
   - `packages/data-extractor/src/assemblers/race-assembler.ts`: insert AbilitiesPointBuyNumber column-read block between size-lookup (line 163) and `races.push` (line 165). Add `abilitiesPointBuyNumber,` field to the `races.push({...})` call.
   - `apps/planner/src/data/compiled-races.ts`: regenerated via `corepack pnpm --filter @pdb/data-extractor extract`. Sibling catalogs and `extraction-report.txt` reverted to baseline. `race:halfelf2` excised via line-walking node script.

**Plan metadata commit:** (this commit) — docs(17-01): plan complete + STATE/ROADMAP update.

## Files Created/Modified

- `tests/phase-17/per-race-point-buy-extractor.spec.ts` — Wave 1 RED-gate spec (CREATED). 7 subtests covering V-01/V-08/V-12: schema-shape (5 schema-parse subtests) + catalog coverage (2 subtests assert every race ships non-undefined non-negative-int-or-null `abilitiesPointBuyNumber`).
- `packages/data-extractor/src/contracts/race-catalog.ts` — added one line in `compiledRaceSchema` (the new `abilitiesPointBuyNumber` field). Schema version untouched (D-06).
- `packages/data-extractor/src/assemblers/race-assembler.ts` — added one column-read block (favoredClass guard mirror, lines 165-180 post-edit) and one field in `races.push` (line 184).
- `apps/planner/src/data/compiled-races.ts` — regenerated. Diff hunks scoped to: (a) `datasetId` bump 2026-04-17 → 2026-04-28, (b) `abilitiesPointBuyNumber: 30` insertion per race, (c) `race:halfelf2` entry deletion (lines 213-229 of the regenerated artifact).

## Decisions Made

- **D-07 (in-band dedup hygiene applied):** `race:halfelf2` Semielfo dup recurred on regen as predicted by RESEARCH Pitfall 1 + Phase 16-01 SUMMARY evidence. Excised in-band rather than deferring to a separate dedup plan, because Phase 17's Wave 1 was already touching `compiled-races.ts`. The excision is line-scoped (17 lines deleted) and does not touch the assembler — the dup is regenerated upstream by 2DA-source content; in-file deletion is the durable post-extract hygiene.
- **Atomic-extract scoping (transferred):** Reverted sibling catalogs (`compiled-classes.ts`, `compiled-feats.ts`, `compiled-skills.ts`, `compiled-deities.ts`) AND `packages/data-extractor/extraction-report.txt` to post-Phase-16 baseline. The extraction-report describes the full pass (including spell/domain assemblers absent from the post-Phase-16 baseline); leaving it modified would mis-advertise sibling drift as Phase 17 work.
- **Snapshot module preservation:** Per PLAN acceptance criteria, `point-buy-snapshot.ts`, `puerta-point-buy.json`, `puerta-point-buy.md`, and the foundation barrel re-export of `point-buy-snapshot` are all UNTOUCHED. Wave 2 reuses them through the existing selector path; Wave 3 deletes them atomically with the spec migration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regex-based dedup excision was unsafe; switched to line-walking node script**
- **Found during:** Task 2 (race:halfelf2 dedup hygiene step)
- **Issue:** Initial attempt used a non-greedy regex `/    \{\n(?:[^\n]*\n)*?      "id": "race:halfelf2",\n(?:[^\n]*\n)*?    \},\n/` to excise the dup. The lazy quantifier expanded greedily across the *first* `    {\n` anchor (line 9, dwarf entry) backward, so a single replacement deleted 19748 bytes spanning 13 entries. Verified via `grep -c '"id": "race:'` returning 33 instead of 45.
- **Fix:** Reverted via `git checkout HEAD -- apps/planner/src/data/compiled-races.ts` and re-extracted. Replaced regex with a line-walking node script that locates the `race:halfelf2` id-line, walks backward to the nearest `    {` line (open brace), walks forward to the nearest `    },` line (close brace), and splices that range out via `lines.splice`. Result: exactly 17 lines removed, 45 race entries remain.
- **Files modified:** `apps/planner/src/data/compiled-races.ts` (final excision committed in `ed45edf`).
- **Verification:** `grep -c '"id": "race:'` → 45; `grep -c "race:halfelf2"` → 0; `grep -c "abilitiesPointBuyNumber"` → 45; phase-12.6 + phase-12.8 dedup specs 209 GREEN.
- **Committed in:** `ed45edf` (Task 2 commit; the failed regex attempt was reverted before commit, so no botched-state commit exists in history).

**2. [Rule 3 - Blocking] `pnpm` not on PATH on this Windows host; used `corepack pnpm --filter` invocation**
- **Found during:** Task 2 (regen step)
- **Issue:** Top-level `corepack pnpm extract` runs `pnpm --filter @pdb/data-extractor extract`, which fails because the inner `pnpm` is not resolved on PATH (`"pnpm" no se reconoce como un comando interno o externo`).
- **Fix:** Bypassed the wrapper script and invoked `corepack pnpm --filter @pdb/data-extractor extract` directly (corepack-managed pnpm resolves the workspace filter without re-shelling out to a bare `pnpm`).
- **Files modified:** None — runtime invocation only.
- **Verification:** Extraction completed in 1.1s with 5 catalogs emitted as expected.
- **Committed in:** N/A (process-only fix; no source diff).

**3. [Rule 3 - Blocking] Reverted `packages/data-extractor/extraction-report.txt` to baseline (atomic-extract scoping extension)**
- **Found during:** Task 2 (post-extract hygiene)
- **Issue:** The PLAN's atomic-extract scoping covered the 4 sibling compiled-*.ts files but did not enumerate `extraction-report.txt`. The regenerated report described the full extractor pass (warnings count 492 → 101 reduction, feats 1487 → 1485, plus spell/domain catalog rows missing in current Phase 16 baseline) — leaving it modified would mis-advertise sibling drift as Phase 17 work.
- **Fix:** `git checkout HEAD -- packages/data-extractor/extraction-report.txt`. Phase 16-01 atomic-extract scoping pattern naturally extends to this artifact.
- **Files modified:** None (revert only).
- **Verification:** `git status` shows only `compiled-races.ts` modified; `git diff --diff-filter=D` against final commit returns empty (no unintended deletions).
- **Committed in:** N/A (revert only; not part of Phase 17 commits).

---

**Total deviations:** 3 auto-fixed (3× Rule 3 blocking).
**Impact on plan:** All three fixes were process-level (tooling environment + atomic-extract scoping completeness) — no source-level scope creep. Wave 1 deliverables landed exactly per PLAN spec.

## Issues Encountered

- **Pre-existing baseline failures NOT caused by Phase 17:** `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx` reports 2 failures (`L9 Caballero Arcano blocker arcane-spell exacto` + `L1 regresión: toda clase de prestigio`). Verified pre-existing on baseline by stashing Phase 17 changes and re-running — failures reproduce identically without Phase 17. STATE.md line 6 explicitly tracks these as "Phase 13 drift, NOT counted against [later phases]". Phase 17 leaves them untouched (out of scope per PLAN scope-boundary rule).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Wave 2 (17-02 plan) prerequisites READY:**
- Extractor surface exists: `compiledRaceCatalog.races[].abilitiesPointBuyNumber: number | null` is queryable from any consumer.
- Snapshot module preserved: Wave 2 can rewire selector to read `compiledRaceCatalog` directly while still importing `PUERTA_POINT_BUY_SNAPSHOT` until the swap lands; alternatively, Wave 2 can do the swap-and-delete atomically per PLAN.
- Cost-table constant + `deriveAbilityBudgetRules` helper are Wave 2 scope.

**Wave 3 (17-03 plan) outstanding:**
- Atomic spec migration of 5 specs (`tests/phase-12.6/ability-budget-per-race.spec.ts` + `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` + 3 pre-12.6 specs in `tests/phase-03/` and `tests/phase-10/`).
- Delete `point-buy-snapshot.ts`, `puerta-point-buy.json`, `puerta-point-buy.md`, and `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts`.
- Append `CLOSED-BY: Phase 17` footer to `.planning/UAT-FINDINGS-2026-04-20.md` § A1 with D-05 disposition note.

**Open ATTR-02 closure status:** Wave 1 closes V-01 + V-08 + V-12. V-02/V-03/V-07 land in Wave 2. V-04/V-05/V-06/V-09/V-10/V-11 land in Wave 3. Requirement ATTR-02 fully retires only after Wave 3 closeout.

## Verification Commands (final state)

```bash
# Wave 1 spec — should be 7/7 GREEN
corepack pnpm exec vitest run tests/phase-17/per-race-point-buy-extractor.spec.ts --reporter=dot

# Cross-phase regression — phase 12.6 + 12.8 dedup invariants
corepack pnpm exec vitest run tests/phase-12.6 tests/phase-12.8 --reporter=dot

# Typecheck
corepack pnpm exec tsc -p tsconfig.base.json --noEmit

# Atomic-extract scoping witness — only compiled-races.ts modified at HEAD
git diff HEAD~1 HEAD --name-only
# Expected: packages/data-extractor/src/assemblers/race-assembler.ts
#           apps/planner/src/data/compiled-races.ts
# (race-catalog.ts + tests/phase-17/* are in HEAD~2 from Task 1)

# Coverage witness — every race ships abilitiesPointBuyNumber
grep -c "abilitiesPointBuyNumber" apps/planner/src/data/compiled-races.ts   # 45

# Dedup witness — race:halfelf2 excised
grep -c "race:halfelf2" apps/planner/src/data/compiled-races.ts             # 0

# Snapshot module preservation witness (Wave 3 retires these)
ls packages/rules-engine/src/foundation/data/puerta-point-buy.json \
   packages/rules-engine/src/foundation/data/puerta-point-buy.md   \
   packages/rules-engine/src/foundation/point-buy-snapshot.ts
grep "point-buy-snapshot" packages/rules-engine/src/foundation/index.ts     # 1 export line
```

## Self-Check

- [x] `tests/phase-17/per-race-point-buy-extractor.spec.ts` exists (7-test Wave 1 gate)
- [x] `packages/data-extractor/src/contracts/race-catalog.ts` contains `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional(),`
- [x] `packages/data-extractor/src/assemblers/race-assembler.ts` reads `row.AbilitiesPointBuyNumber` with parseInt + Number.isFinite + warnings.push fail-soft idiom
- [x] `apps/planner/src/data/compiled-races.ts` regenerated; 45 race entries; 45 `abilitiesPointBuyNumber` occurrences; 0 `race:halfelf2` occurrences
- [x] Sibling catalogs reverted: `git status apps/planner/src/data/compiled-*.ts` shows clean tree post-commit
- [x] Snapshot module + JSON + provenance dossier preserved untouched
- [x] Foundation barrel still exports `point-buy-snapshot` (Wave 3 removes)
- [x] Commit `9d393ae` exists in `git log --oneline --all` (Task 1)
- [x] Commit `ed45edf` exists in `git log --oneline --all` (Task 2)
- [x] Wave 1 phase-gate checks block from PLAN: 7/7 phase-17 GREEN; 209/209 phase-12.6+12.8 GREEN; tsc 0; abilitiesPointBuyNumber count = 45; race:halfelf2 count = 0

## Self-Check: PASSED

---
*Phase: 17-per-race-point-buy*
*Plan: 01 (Wave 1 of 3)*
*Completed: 2026-04-28*
