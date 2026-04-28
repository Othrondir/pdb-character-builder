---
phase: 17-per-race-point-buy
plan: 03
subsystem: rules-engine + tests

tags: [point-buy, atomic-retirement, snapshot-deletion, uat-closure, spec-migration, attr-02]

# Dependency graph
requires:
  - phase: 17-per-race-point-buy
    provides: "Wave 1 (17-01) extractor surface — `compiledRaceCatalog.races[].abilitiesPointBuyNumber: number | null` ships on all 45 race entries; race:halfelf2 dedup hygiene applied."
  - phase: 17-per-race-point-buy
    provides: "Wave 2 (17-02) rules-engine helper + selector rewire — `NWN1_POINT_BUY_COST_TABLE` constant + `deriveAbilityBudgetRules` + `AbilityBudgetRules` exported interface; `selectAbilityBudgetRulesForRace` reads `compiledRaceCatalog`. 1 spec migration (`tests/phase-12.6/attributes-board-fail-closed.spec.tsx`) brought forward into Wave 2 (Rule 3 deviation, fully documented)."
  - phase: 12.6-attribute-budget
    provides: "Null-branch fail-closed contract preserved verbatim across the migration."

provides:
  - "Atomic snapshot retirement: 4 source/test files deleted (point-buy-snapshot.ts, puerta-point-buy.json, puerta-point-buy.md, point-buy-snapshot-coverage.spec.ts)."
  - "Foundation barrel cleaned: `packages/rules-engine/src/foundation/index.ts` ships 5 exports (was 6)."
  - "4 spec migrations off the legacy snapshot dictionary: `tests/phase-12.6/ability-budget-per-race.spec.ts` + `tests/phase-03/summary-status.spec.tsx` + `tests/phase-03/attribute-budget.spec.tsx` + `tests/phase-10/attributes-advance.spec.tsx`."
  - "Documentation hygiene: residual `PointBuyCurve` doc-references + literal banned-token mentions scrubbed from `ability-budget.ts`, `tests/phase-12.6/ability-budget-per-race.spec.ts`, and `tests/phase-17/per-race-point-buy-selector.spec.ts` so the zero-grep success criterion holds across `apps/`, `packages/`, `tests/`."
  - "UAT-FINDINGS-2026-04-20 §A1 closed with `CLOSED-BY: Phase 17 (per-race-point-buy)` footer + verbatim D-05 disposition note + git-history evidence pointer for the deleted dossier."

affects: [requirement-attr-02, milestone-v1.1]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern S-17-E (deletion-execution): atomic retirement of source-of-truth + JSON + provenance dossier + dependent coverage spec + barrel export, after dependent consumers migrated. Mirrors Phase 16-02 D-04 atomic-fixture-migration discipline applied to source-of-truth retirement."
    - "Pattern S-17-I (zero-grep documentation hygiene): when a phase retires a named symbol/file/dictionary, scrub residual literal-token mentions from comments + docstrings to keep the success-criteria grep sweep clean. Replace banned tokens with neutral phrasing that preserves historical context (e.g. \"legacy hand-authored snapshot\" instead of `PUERTA_POINT_BUY_SNAPSHOT`)."
    - "Pattern S-17-J (UAT closeout footer): for resolved-by-evidence findings whose source files are about to be deleted, append CLOSED-BY footer with the verbatim CONTEXT disposition note + a git-history evidence pointer (`git log --follow --all -- <deleted-path>`) so the audit trail survives the deletion."

key-files:
  deleted:
    - packages/rules-engine/src/foundation/point-buy-snapshot.ts
    - packages/rules-engine/src/foundation/data/puerta-point-buy.json
    - packages/rules-engine/src/foundation/data/puerta-point-buy.md
    - tests/phase-12.6/point-buy-snapshot-coverage.spec.ts
  modified:
    - packages/rules-engine/src/foundation/index.ts
    - packages/rules-engine/src/foundation/ability-budget.ts
    - tests/phase-12.6/ability-budget-per-race.spec.ts
    - tests/phase-12.6/attributes-board-fail-closed.spec.tsx
    - tests/phase-03/summary-status.spec.tsx
    - tests/phase-03/attribute-budget.spec.tsx
    - tests/phase-10/attributes-advance.spec.tsx
    - tests/phase-17/per-race-point-buy-selector.spec.ts
    - .planning/UAT-FINDINGS-2026-04-20.md

key-decisions:
  - "Wave-2-deviation reconciliation: PLAN 17-03's must_haves listed 5 importer specs to migrate, but Wave 2 SUMMARY documented that `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` was already migrated forward as a Rule 3 auto-fix (snapshot mutation became a no-op once the selector read `compiledRaceCatalog`). Wave 3 effective scope: 4 spec migrations + 1 spec deletion + atomic source retirement + barrel cleanup + UAT footer. Validated via grep before starting Task 1 (zero `PUERTA_POINT_BUY_SNAPSHOT` matches in attributes-board-fail-closed.spec.tsx pre-Wave-3)."
  - "Zero-grep success criterion enforcement: PLAN's V-09 acceptance asserts `grep -r 'PUERTA_POINT_BUY_SNAPSHOT|PointBuyCurve|point-buy-snapshot|puerta-point-buy' apps/ packages/ tests/` returns ZERO matches. A literal interpretation requires scrubbing four residual narrative comments where these tokens appeared as historical context (one in `ability-budget.ts`, two in `tests/phase-12.6/ability-budget-per-race.spec.ts`, one in `tests/phase-17/per-race-point-buy-selector.spec.ts`). All four scrubbed in the Task 3 atomic commit using neutral phrasing — context preserved, banned tokens removed."
  - "UAT footer placement: appended `CLOSED-BY` block after the §A1 'Candidate surfaces' bullet list and BEFORE the next `### A2` heading, so the section is self-contained and the closure metadata travels with the finding when the file is read top-to-bottom."
  - "Pre-existing baseline failures NOT counted against Phase 17: `tests/phase-08/ruleset-version.spec.ts > BUILD_ENCODING_VERSION is literal 1` + `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx` (2 failures). All three are documented on STATE.md line 6 + Wave 1/2 SUMMARYs as Phase 13 + Phase 08 drift. Reproduced unchanged on the Wave-3 HEAD; no Phase 17 contribution."

patterns-established:
  - "Atomic retirement requires zero-grep verification across `apps/ + packages/ + tests/`, NOT just the deleted source files themselves. Documentation comments, migration notes, and selector spec docstrings can carry banned tokens forward unintentionally."
  - "When a deletion target's history matters for audit trail (e.g. provenance dossier `puerta-point-buy.md`), publish the `git log --follow --all` evidence pointer in the consuming UAT entry / CLAUDE.md before the deletion lands. Future readers can `git log --follow --all -- <deleted-path>` to walk the pre-deletion history without an explicit commit pin."
  - "Wave-N+1 plans should validate Wave-N deviation impact at execution start (re-grep the affected files to confirm the documented forward-migration is actually in place) so scope reconciliation is data-driven, not memory-driven."

requirements-completed: [ATTR-02]

# Metrics
duration: ~7min
completed: 2026-04-28
---

# Phase 17 Plan 03: Per-Race Point-Buy — Wave 3 (Atomic Snapshot Retirement) Summary

**Phase 17 closes ATTR-02: legacy hand-authored point-buy snapshot module + JSON + provenance dossier + coverage spec deleted; foundation barrel cleaned; 4 dependent specs migrated off the snapshot import; UAT-FINDINGS-2026-04-20 §A1 closed with verbatim D-05 disposition footer; full grep sweep on apps/, packages/, tests/ returns ZERO matches across all four banned tokens.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-28T08:36:14Z
- **Completed:** 2026-04-28T08:43:38Z
- **Tasks:** 3 atomic commits
- **Files deleted:** 4 (3 source + 1 spec)
- **Files modified:** 9 (1 barrel + 1 doc-comment-only source + 6 test files + 1 UAT doc)
- **Net diff:** +98 / −676 lines

## Accomplishments

- **Task 1 (`bed5239`):** migrated `tests/phase-12.6/ability-budget-per-race.spec.ts` from `PUERTA_POINT_BUY_SNAPSHOT[raceId]` dict-lookup to `selectAbilityBudgetRulesForRace(raceId)` selector calls. Three describe.each branches (every-race-non-null + baseline-spent-zero + DEX-bump-delta) + variance describe block (Elfo vs Enano sourced-uniformity) updated. `it.todo` block at original line 154-156 preserved verbatim. Same task scrubbed the residual `PUERTA_POINT_BUY_SNAPSHOT` historical-context mention from `tests/phase-12.6/attributes-board-fail-closed.spec.tsx`'s docstring (Wave 2 had migrated the seed mechanism but the docstring still named the legacy symbol).
- **Task 2 (`b4fdac0`):** migrated 3 pre-12.6 specs by dropping the `PRE_12_6_UNIFORM_CURVE` seed-and-cleanup pattern. The post-Phase-17 catalog ships `abilitiesPointBuyNumber: 30` natively for `race:human` + `race:elf`, so the test bodies already pass against the canonical pipeline without test-side seeding.
  - `tests/phase-03/summary-status.spec.tsx`: dropped `PUERTA_POINT_BUY_SNAPSHOT` import, `PRE_12_6_UNIFORM_CURVE` constant, `beforeEach` two-key seeding (race:human + race:elf), `afterEach` cleanup, and the now-unused `afterEach` import.
  - `tests/phase-03/attribute-budget.spec.tsx`: dropped same constants/imports/blocks for `race:human` only.
  - `tests/phase-10/attributes-advance.spec.tsx`: dropped same constants/imports/seed line; kept the `afterEach { cleanup() }` block but removed the snapshot-delete inside it.
- **Task 3 (`b1539fd`):** atomic snapshot retirement.
  - **Deleted via `git rm`:** `point-buy-snapshot.ts` + `puerta-point-buy.json` + `puerta-point-buy.md` + `point-buy-snapshot-coverage.spec.ts` (4 files).
  - **Barrel cleaned:** `packages/rules-engine/src/foundation/index.ts` dropped the `export * from './point-buy-snapshot';` line. 5 exports remain (was 6).
  - **Documentation hygiene:** scrubbed three more residual literal-token mentions to honour the zero-grep success criterion — the historical `PointBuyCurve` doc-reference in `ability-budget.ts:8` (Wave 2 SUMMARY had flagged it for revision in W3), the `puerta-point-buy.md` dossier path mention in the `NWN1_POINT_BUY_COST_TABLE` provenance comment, and a literal `point-buy-snapshot-coverage.spec.ts` filename in the new selector spec's migration note. Replaced all with neutral phrasing pointing at `git log --follow --all`.
  - **UAT closure:** appended `**CLOSED-BY:** Phase 17 (per-race-point-buy)` footer to `.planning/UAT-FINDINGS-2026-04-20.md` §A1, with verbatim D-05 disposition text and a git-history evidence pointer for the deleted dossier.
- **Phase 17 phase-gate:** `corepack pnpm exec vitest run tests/phase-03 tests/phase-10 tests/phase-12.6 tests/phase-17 --reporter=dot` → 14 test files / 195 tests + 1 todo, ALL GREEN. `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` → exit 0. Full vitest run: 2280 passed + 2 skipped + 1 todo + 3 pre-existing baseline failures (Phase 08 + Phase 12.4 drift documented in STATE.md line 6 + Wave 1/2 SUMMARYs); zero new failures introduced by Phase 17.

## Task Commits

1. **Task 1: phase-12.6 spec migration (D-04)** — `bed5239` (test) — `tests/phase-12.6/ability-budget-per-race.spec.ts` + `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` (docstring scrub only).
2. **Task 2: pre-12.6 specs seeder migration (V-10)** — `b4fdac0` (test) — `tests/phase-03/summary-status.spec.tsx` + `tests/phase-03/attribute-budget.spec.tsx` + `tests/phase-10/attributes-advance.spec.tsx`.
3. **Task 3: atomic snapshot retirement + UAT A1 closure (V-09 + V-11)** — `b1539fd` (refactor) — 4 deletions + barrel + 3 doc scrubs + UAT footer.

**Plan metadata commit:** (this commit) — `docs(17-03): complete Wave 3 (snapshot retirement + UAT closure)`.

## Files Created/Modified

- **Deleted (4):**
  - `packages/rules-engine/src/foundation/point-buy-snapshot.ts` — Zod-validated module loader; replaced by `compiledRaceCatalog` + `deriveAbilityBudgetRules` + `NWN1_POINT_BUY_COST_TABLE`.
  - `packages/rules-engine/src/foundation/data/puerta-point-buy.json` — 45-entry hand-authored snapshot; replaced by extractor-sourced `compiledRace.abilitiesPointBuyNumber`.
  - `packages/rules-engine/src/foundation/data/puerta-point-buy.md` — provenance dossier; preserved via `git log --follow --all` (commit `5d4e1ad` and earlier 12.6 commits).
  - `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` — Zod parse + uniform-shape coverage; replaced by `tests/phase-17/per-race-point-buy-extractor.spec.ts` (Wave 1 schema parse) + `tests/phase-17/per-race-point-buy-selector.spec.ts` (Wave 2 catalog coverage).

- **Modified (9):**
  - `packages/rules-engine/src/foundation/index.ts` — barrel ships 5 exports (was 6).
  - `packages/rules-engine/src/foundation/ability-budget.ts` — historical doc-comment refresh (no behavior change).
  - `tests/phase-12.6/ability-budget-per-race.spec.ts` — selector pipeline migration (D-04).
  - `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` — docstring token scrub (Wave 2 had already migrated the seed mechanism).
  - `tests/phase-03/summary-status.spec.tsx` — drop seed mechanism (V-10).
  - `tests/phase-03/attribute-budget.spec.tsx` — drop seed mechanism (V-10).
  - `tests/phase-10/attributes-advance.spec.tsx` — drop seed mechanism (V-10).
  - `tests/phase-17/per-race-point-buy-selector.spec.ts` — token scrub in migration-note comment.
  - `.planning/UAT-FINDINGS-2026-04-20.md` — §A1 CLOSED-BY footer (V-11).

## Diff Summaries

### Spec migration line-level (Task 1, `tests/phase-12.6/ability-budget-per-race.spec.ts`)

```diff
-import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';
+import { selectAbilityBudgetRulesForRace } from '@planner/features/character-foundation/selectors';
@@ describe.each(uniqueRaces) @@
-    it('snapshot entry exists for every unique race ID', () => {
-      expect(PUERTA_POINT_BUY_SNAPSHOT[raceId]).toBeDefined();
-    });
-    it('baseline ... → ...', () => {
-      const rules = PUERTA_POINT_BUY_SNAPSHOT[raceId];
-      ...
-      expect(snapshot.remainingPoints).toBe(rules.budget);
+    it('selector returns non-null AbilityBudgetRules for every unique race ID', () => {
+      expect(selectAbilityBudgetRulesForRace(raceId)).not.toBeNull();
+    });
+    it('baseline ... → ...', () => {
+      const rules = selectAbilityBudgetRulesForRace(raceId);
+      expect(rules).not.toBeNull();
+      ...
+      expect(snapshot.remainingPoints).toBe(rules!.budget);
@@ variance describe block @@
-    const elfRules = PUERTA_POINT_BUY_SNAPSHOT['race:elf'];
-    const dwarfRules = PUERTA_POINT_BUY_SNAPSHOT['race:dwarf'];
+    const elfRules = selectAbilityBudgetRulesForRace('race:elf' as CanonicalId);
+    const dwarfRules = selectAbilityBudgetRulesForRace('race:dwarf' as CanonicalId);
@@ it.todo verbatim preserved @@
   it.todo(
     'per-race deltas: Elfo vs Enano produce different remainingPoints — BLOCKED on server-script override evidence ...',
   );
```

### Pre-12.6 seeder removal (Task 2, all three specs)

```diff
-import { PUERTA_POINT_BUY_SNAPSHOT } from '@rules-engine/foundation/point-buy-snapshot';
-
-const PRE_12_6_UNIFORM_CURVE = {
-  budget: 30, minimum: 8, maximum: 18,
-  costByScore: { '8': 0, '9': 1, ..., '18': 16 },
-} as const;
@@ beforeEach @@
-    (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'] =
-      PRE_12_6_UNIFORM_CURVE;
@@ afterEach @@
-  afterEach(() => {
-    delete (PUERTA_POINT_BUY_SNAPSHOT as Record<string, unknown>)['race:human'];
-  });
```

(Same shape applied to all three pre-12.6 specs; `summary-status.spec.tsx` had two race keys, the other two had one each. `attributes-advance.spec.tsx` kept its `afterEach { cleanup() }` block, only stripping the snapshot delete inside it.)

### Foundation barrel cleanup (Task 3)

```diff
 export * from './ability-budget';
 export * from './ability-modifier';
 export * from './origin-rules';
 export * from './group-races-by-parent';
 export * from './apply-race-modifiers';
-export * from './point-buy-snapshot';
```

### UAT-FINDINGS-2026-04-20 §A1 footer (Task 3)

```diff
@@ ### A1 — Point-buy cost varies per race @@
 - `compiled-races.ts` — add `pointBuyCurve` field (schema change)

+**CLOSED-BY:** Phase 17 (per-race-point-buy)
+
+**Disposition:** User claim of per-race variance was contradicted by user's own 2026-04-20 in-game verification + racialtypes.2da extraction; Phase 17 ships the engineering deliverable (extractor pipeline) on the truthful uniform curve.
+
+**Evidence pointer:** `packages/rules-engine/src/foundation/data/puerta-point-buy.md § "Plan 06 Source Resolution"` (deleted in Phase 17 closeout commit; preserved via git history at commit `bf55129` and earlier 12.6 commits — accessible via `git log --follow --all -- packages/rules-engine/src/foundation/data/puerta-point-buy.md`).
+
 ### A2 — Race ability modifiers not folded into base attributes
```

## Final Grep Sweep (V-09 acceptance)

```bash
grep -rE "PUERTA_POINT_BUY_SNAPSHOT|PointBuyCurve|point-buy-snapshot|puerta-point-buy" apps/ packages/ tests/
```

**Result:** ZERO matches across all 4 banned tokens. Clean retirement.

```bash
grep -c "CLOSED-BY" .planning/UAT-FINDINGS-2026-04-20.md
```

**Result:** 1 match at line 72 (`**CLOSED-BY:** Phase 17 (per-race-point-buy)`).

```bash
ls packages/rules-engine/src/foundation/point-buy-snapshot.ts \
   packages/rules-engine/src/foundation/data/puerta-point-buy.json \
   packages/rules-engine/src/foundation/data/puerta-point-buy.md \
   tests/phase-12.6/point-buy-snapshot-coverage.spec.ts
```

**Result:** all 4 paths emit "no such file or directory" (deletion intact).

```bash
grep -c "^export \* from" packages/rules-engine/src/foundation/index.ts
```

**Result:** `5` (was 6 pre-Wave-3).

```bash
git log --follow --all -- packages/rules-engine/src/foundation/data/puerta-point-buy.md | head -5
```

**Result:** walks back to commit `5d4e1ad` (`fix(12.8-04): delete race:halfelf2 extractor duplicate (F6)`) and earlier — provenance audit trail intact across the deletion.

## Decisions Made

- **Wave-2-deviation reconciliation:** Wave 2's Rule-3 forward-migration of `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` was confirmed in place (zero `PUERTA_POINT_BUY_SNAPSHOT` matches in that file pre-Wave-3 except for one residual narrative comment, which Task 1 scrubbed). Wave 3's effective migration list was 4 specs + 1 spec deletion (down from 5+1 in the original plan) — precisely matching the Wave 2 SUMMARY § "Next Phase Readiness" projection.
- **Zero-grep documentation hygiene scope:** the original plan called for atomic deletion of source files + barrel cleanup + selector spec coverage spec deletion. Strict reading of V-09 ("`grep -r ... apps/ packages/ tests/` returns zero matches") required additional scrubbing of four residual narrative comments. Treated as in-scope hygiene under the same atomic Task 3 commit (no scope creep — the success criterion explicitly mandates zero matches; comments fall under it).
- **D-05 disposition text used verbatim:** the CONTEXT D-05 disposition note ("User claim of per-race variance was contradicted by user's own 2026-04-20 in-game verification + racialtypes.2da extraction; Phase 17 ships the engineering deliverable (extractor pipeline) on the truthful uniform curve.") was copied character-for-character into the UAT §A1 footer. Evidence pointer mentions the dossier path with a `git log --follow --all` recipe so future readers can walk the pre-deletion history without needing a static commit pin.
- **Phase 17 verifier handoff scope:** this plan does NOT mark Phase 17 itself complete in ROADMAP.md status (the orchestrator runs gsd-verifier on the phase as a whole after this plan ships). Plan 17-03 only updates the per-plan checkbox + STATE position.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zero-grep hygiene required scrubbing four residual narrative comments**

- **Found during:** Task 3 verification sweep (`grep -rE "PUERTA_POINT_BUY_SNAPSHOT|PointBuyCurve|point-buy-snapshot|puerta-point-buy" apps/ packages/ tests/`)
- **Issue:** The atomic deletion + barrel cleanup left four residual literal-token mentions in narrative comments:
  - `tests/phase-12.6/ability-budget-per-race.spec.ts:28-29` (header docstring describing the migration)
  - `tests/phase-12.6/ability-budget-per-race.spec.ts:138` (variance-describe inline comment)
  - `tests/phase-17/per-race-point-buy-selector.spec.ts:52` (migration note in the new coverage test)
  - `packages/rules-engine/src/foundation/ability-budget.ts:8` + `ability-budget.ts:77` (`PointBuyCurve` doc-reference in interface comment + `puerta-point-buy.md` path in `NWN1_POINT_BUY_COST_TABLE` provenance comment)
  
  The PLAN's V-09 success criterion is `grep -r ... returns zero matches`. Strict reading mandates scrubbing.
- **Fix:** replaced banned-token mentions with neutral phrasing (`legacy hand-authored snapshot dictionary`, `legacy snapshot module`, `git log --follow --all` recipe pointing at the deleted dossier directory). All five comments retain historical context; only the literal banned tokens removed. No code semantics touched.
- **Files modified:** Task 3 commit `b1539fd` rolled all five scrubs into the atomic retirement commit (matching the plan's "atomic discipline" rule).
- **Verification:** post-fix grep returns ZERO matches across `apps/ packages/ tests/`.
- **Committed in:** `b1539fd` (Task 3 atomic retirement).

**2. [Rule 1 - Bug] `attributes-board-fail-closed.spec.tsx` historical comment still mentioned the banned token**

- **Found during:** Task 1 verification (after migrating `ability-budget-per-race.spec.ts`)
- **Issue:** Wave 2 had migrated the seed mechanism in `attributes-board-fail-closed.spec.tsx` from snapshot mutation to unknown-raceId, but the comment block at lines 10-22 still referenced `PUERTA_POINT_BUY_SNAPSHOT` as historical context. With Wave 3's zero-grep success criterion, this would fail V-09.
- **Fix:** rephrased the comment block to reference "the legacy hand-authored snapshot module" (banned token removed) and updated the closing summary to note "Phase 17 Wave 3 retired the snapshot module + JSON + provenance dossier + barrel export atomically" (was: "Wave 3 still owns the remaining 5 + snapshot module/JSON/dossier deletion atomically").
- **Files modified:** `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` (comment-only).
- **Verification:** post-fix grep on this file returns zero matches.
- **Committed in:** `bed5239` (Task 1, bundled with the ability-budget-per-race migration so the phase-12.6 directory clears together).

---

**Total deviations:** 2 auto-fixed (2 × Rule 1 — both narrative-comment hygiene to honour the zero-grep success criterion).
**Impact on plan:** No source-level behavior change, no scope creep. Both deviations are direct enforcement of V-09's literal text. The plan's `<acceptance_criteria>` for Task 3 explicitly enumerates `grep -r "..." apps/ packages/ tests/` returning zero — these were the sweep's residual hits and got scrubbed in the same atomic commit.

## Issues Encountered

- **Pre-existing baseline failures NOT caused by Phase 17 W3:** Full `vitest run` reports 3 failures, all pre-existing:
  - `tests/phase-08/ruleset-version.spec.ts > BUILD_ENCODING_VERSION is literal 1` — Phase 08 drift, documented in STATE.md baseline notes + Wave 2 SUMMARY § Issues Encountered ("phase-08 BUILD_ENCODING_VERSION literal etc.").
  - `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx > L9 Caballero Arcano blocker arcane-spell exacto`
  - `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx > L1 regresión: toda clase de prestigio sigue con copy de rama 2 (no L1)`
  
  Both phase-12.4 failures are Phase 13 drift baselines tracked at STATE.md line 6 and confirmed unchanged in Wave 1 + Wave 2 SUMMARYs. None of the three failures touch any file Phase 17 modified.
- **Windows `grep -c` markdown-bold token interaction:** the verification command `grep -c "CLOSED-BY: Phase 17" .planning/UAT-FINDINGS-2026-04-20.md` returned 0 because the literal pattern doesn't match `**CLOSED-BY:** Phase 17` (markdown bold asterisks). Re-running with `grep "CLOSED-BY"` returns the line correctly. Footer text confirmed via direct `Read` on lines 70-78 of the file. Process-only — no source diff.
- **`pnpm` not on PATH on this Windows host:** continued the Wave-1/2 process pattern of using `corepack pnpm exec ...` for vitest + tsc invocations. No source diff.

## User Setup Required

None — atomic retirement is purely structural. The Phase 17 pipeline is now self-contained: extractor → catalog → helper → selector. Snapshot module is gone.

## TDD Gate Compliance

This plan is a **migration + atomic-retirement** plan, not a new-feature plan. The PLAN frontmatter has `tdd="true"` on all three tasks, but the discipline applies as "verify GREEN at each task boundary" rather than the classical RED→GREEN gate (there is no new feature behavior to RED-test; all behavior was locked by the Wave 1/2 specs).

Per-task verification before commit:
- **Task 1:** `vitest tests/phase-12.6/ability-budget-per-race.spec.ts tests/phase-12.6/attributes-board-fail-closed.spec.tsx --reporter=dot` → 142 passed + 1 todo, 2 test files (GREEN at commit `bed5239`).
- **Task 2:** `vitest tests/phase-03 tests/phase-10 --reporter=dot` → 20 passed, 8 test files (GREEN at commit `b4fdac0`); tsc 0.
- **Task 3:** `vitest run --reporter=dot` full suite → 2280 passed + 2 skipped + 1 todo + 3 pre-existing baseline failures (no new failures); `vitest tests/phase-03 tests/phase-10 tests/phase-12.6 tests/phase-17 --reporter=dot` → 195 passed + 1 todo, 14 test files; tsc 0; full grep sweep → ZERO matches (GREEN at commit `b1539fd`).

Gate sequence in git log: `test(17-03) ...` (`bed5239`) → `test(17-03) ...` (`b4fdac0`) → `refactor(17-03) ...` (`b1539fd`). The third commit is `refactor` not `feat` because no new feature behavior lands — only deletion + barrel cleanup + doc closure.

## ATTR-02 Phase-Gate Closure

| Success Criterion | Status | Evidence |
|---|---|---|
| **SC#1** Extractor surface coste point-buy por raza (fail-closed si raza no enriched) | ✅ closed (Wave 1) | `packages/data-extractor/src/contracts/race-catalog.ts` ships `abilitiesPointBuyNumber: z.number().int().nonnegative().nullable().optional()`; `compiled-races.ts` has 45 entries × `abilitiesPointBuyNumber: 30`. |
| **SC#2** `ability-budget.ts` consumes catálogo enriquecido | ✅ closed (Wave 2) | `selectAbilityBudgetRulesForRace` reads `compiledRaceCatalog.races.find` + composes via `deriveAbilityBudgetRules` + `NWN1_POINT_BUY_COST_TABLE`. Zero references to the legacy snapshot anywhere. |
| **SC#3** Atributos board refleja coste correcto al subir/bajar atributo según raza activa | ✅ closed (Wave 3) | `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` 6/6 GREEN against the new selector pipeline; em-dash fallback + Spanish callout text preserved. |
| **SC#4** (D-03 reframe) ≥3 races resolve to non-null `AbilityBudgetRules` AND ≥1 race demonstrates the null fail-closed branch | ✅ closed (Wave 2) | `tests/phase-17/per-race-point-buy-selector.spec.ts` 4/4 GREEN: race:human/elf/dwarf non-null + null raceId fail-closed + unknown raceId fail-closed + every-race-non-null coverage. |

| Validation ID | Plan | Wave | Status |
|---|---|---|---|
| V-01 (extractor surface) | 01 | 1 | ✅ green |
| V-02 (helper composition) | 02 | 2 | ✅ green |
| V-03 (selector rewire) | 02 | 2 | ✅ green |
| V-04 (D-04 atomic phase-12.6 spec migration) | 03 | 3 | ✅ green |
| V-05 (calculateAbilityBudgetSnapshot happy path through selector) | 02 | 2 (covered by V-04) | ✅ green |
| V-06 (UI fail-closed callout under selector pipeline) | 03 | 3 | ✅ green |
| V-07 (SC#4 D-03 reframe) | 02 | 2 | ✅ green |
| V-08 (compiled-races.ts regen coverage) | 01 | 1 | ✅ green |
| V-09 (snapshot retirement + barrel cleanup + grep sweep) | 03 | 3 | ✅ green |
| V-10 (pre-12.6 seeder migrations) | 03 | 3 | ✅ green |
| V-11 (UAT A1 closure footer) | 03 | 3 | ✅ green |
| V-12 (atomic re-extract hygiene + race:halfelf2 dedup) | 01 | 1 | ✅ green |

ATTR-02 closes 12/12 V-ids GREEN + 4/4 SCs green. Phase 17 ready for `/gsd-verify-work 17`.

## Next Phase Readiness

- Orchestrator runs `gsd-verifier` on Phase 17 as a whole. This plan does NOT mark Phase 17 complete in ROADMAP.md status — the verifier owns that.
- Phase 18 (Quick-Task Triage) and Phase 19 (Test Infra) remain unchanged.

## Verification Commands (final state)

```bash
# Phase 17 phase-gate (cross-phase regression scope)
corepack pnpm exec vitest run tests/phase-03 tests/phase-10 tests/phase-12.6 tests/phase-17 --reporter=dot
# Expected: 14 test files / 195 tests + 1 todo, all GREEN.

# Full suite (Wave 3 baseline-no-regression check)
corepack pnpm exec vitest run --reporter=dot
# Expected: 2280 passed + 2 skipped + 1 todo + 3 pre-existing baseline failures
# (phase-08/ruleset-version + 2× phase-12.4/class-picker-prestige-reachability).

# Typecheck
corepack pnpm exec tsc -p tsconfig.base.json --noEmit
# Expected: exit 0.

# Atomic deletion sweep (V-09)
grep -rE "PUERTA_POINT_BUY_SNAPSHOT|PointBuyCurve|point-buy-snapshot|puerta-point-buy" apps/ packages/ tests/
# Expected: zero matches.

# UAT closure verification (V-11)
grep "CLOSED-BY" .planning/UAT-FINDINGS-2026-04-20.md
# Expected: 1 match — `**CLOSED-BY:** Phase 17 (per-race-point-buy)`.

# Foundation barrel
grep -c "^export \* from" packages/rules-engine/src/foundation/index.ts
# Expected: 5 (was 6 pre-Wave-3).

# Provenance audit trail (post-deletion)
git log --follow --all -- packages/rules-engine/src/foundation/data/puerta-point-buy.md | head -1
# Expected: `commit 5d4e1ad...` (last pre-deletion commit reachable).
```

## Self-Check

- [x] `tests/phase-12.6/ability-budget-per-race.spec.ts` does NOT contain `PUERTA_POINT_BUY_SNAPSHOT`
- [x] `tests/phase-12.6/ability-budget-per-race.spec.ts` contains `import { selectAbilityBudgetRulesForRace }`
- [x] `tests/phase-12.6/ability-budget-per-race.spec.ts` `it.todo` block preserved verbatim
- [x] `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` does NOT contain `PUERTA_POINT_BUY_SNAPSHOT|PointBuyCurve|savedHumanCurve`
- [x] `tests/phase-12.6/attributes-board-fail-closed.spec.tsx` contains `race:does-not-exist`
- [x] `tests/phase-03/summary-status.spec.tsx` + `tests/phase-03/attribute-budget.spec.tsx` + `tests/phase-10/attributes-advance.spec.tsx` no longer contain `PUERTA_POINT_BUY_SNAPSHOT|PRE_12_6_UNIFORM_CURVE|point-buy-snapshot`
- [x] `tests/phase-12.6/point-buy-snapshot-coverage.spec.ts` does NOT exist
- [x] `packages/rules-engine/src/foundation/point-buy-snapshot.ts` does NOT exist
- [x] `packages/rules-engine/src/foundation/data/puerta-point-buy.json` does NOT exist
- [x] `packages/rules-engine/src/foundation/data/puerta-point-buy.md` does NOT exist
- [x] `packages/rules-engine/src/foundation/index.ts` ships 5 `export * from` lines (was 6)
- [x] `grep -rE "PUERTA_POINT_BUY_SNAPSHOT|PointBuyCurve|point-buy-snapshot|puerta-point-buy" apps/ packages/ tests/` returns ZERO matches
- [x] `.planning/UAT-FINDINGS-2026-04-20.md` contains `**CLOSED-BY:** Phase 17 (per-race-point-buy)` after §A1 + before §A2
- [x] `.planning/UAT-FINDINGS-2026-04-20.md` contains the verbatim D-05 disposition phrase "User claim of per-race variance was contradicted"
- [x] `corepack pnpm exec vitest run tests/phase-03 tests/phase-10 tests/phase-12.6 tests/phase-17 --reporter=dot` → 195/196 GREEN (1 preserved todo)
- [x] `corepack pnpm exec vitest run --reporter=dot` full suite: no NEW failures vs STATE.md baseline (3 pre-existing failures unchanged)
- [x] `corepack pnpm exec tsc -p tsconfig.base.json --noEmit` exits 0
- [x] `git log --follow --all -- packages/rules-engine/src/foundation/data/puerta-point-buy.md` walks pre-deletion history (commit `5d4e1ad` reachable)
- [x] Commit `bed5239` exists (Task 1 — phase-12.6 spec migration)
- [x] Commit `b4fdac0` exists (Task 2 — pre-12.6 spec seeder migration)
- [x] Commit `b1539fd` exists (Task 3 — atomic snapshot retirement + UAT footer)

## Self-Check: PASSED

---
*Phase: 17-per-race-point-buy*
*Plan: 03 (Wave 3 of 3)*
*Completed: 2026-04-28*
