---
phase: 13
plan: 02
subsystem: orphan-sweep / dead-code cleanup
tags: [tech-debt, refactor, a11y, extractor]
requires:
  - 13-01 (verification doc retro-author — wave-1 sibling, no source overlap)
provides:
  - prestige-gate-build.ts free of dead computeHighestClassLevel
  - level-aware aria-label on level-sub-steps container
  - cli.ts default extractor runs skip the EMIT_MAGIC_CATALOGS-only 2DA parse
  - confirmed-live ConfirmDialog primitive (Branch B — false-positive audit reclassification)
affects:
  - apps/planner/src/features/level-progression/prestige-gate-build.ts
  - apps/planner/src/components/shell/level-sub-steps.tsx
  - packages/data-extractor/src/cli.ts
tech_stack:
  added: []
  patterns:
    - "Pre-flight callsite grep gates surgical deletion — Task 1 fail-safe, Task 2 dead-code proof"
key_files:
  created:
    - .planning/phases/13-verification-orphan-sweep/13-02-SUMMARY.md
  modified:
    - apps/planner/src/features/level-progression/prestige-gate-build.ts
    - apps/planner/src/components/shell/level-sub-steps.tsx
    - packages/data-extractor/src/cli.ts
decisions:
  - "ConfirmDialog audit finding (v1.0-MILESTONE-AUDIT.md tech_debt 07.2 line 42) reclassified as false positive — pre-flight grep on 2026-04-24 confirmed 1 live caller in apps/planner/src/features/summary/save-slot-dialog.tsx (Phase-08 SaveSlotDialog overwrite flow) plus 3 phase-08 test cases. Phase 07.2 magic purge correctly removed magic ConfirmDialog usages; Phase 08 independently re-introduced a legitimate non-magic caller. Primitive + CSS block left byte-identical. Future doc pass should strike line 42 of v1.0-MILESTONE-AUDIT.md."
  - "ARCANE_SPELLCASTER_IDS PRESERVED (Rule-1 plan correction). Plan + ROADMAP + 12.8-REVIEW IN-01 all asserted the constant was dead alongside computeHighestClassLevel. Re-grep at execute time proved the set is consumed by the LIVE computeHighestSpellLevel helper at line 336 (called by buildPrestigeGateBuildState lines 389+390 for the arcane-gate calculation). Plan author conflated computeHighestSpellLevel (live) with computeHighestClassLevel (dead). Deleting the constant would have broken the arcane prestige gate. Only computeHighestClassLevel (genuinely dead) was excised."
  - "level-sub-steps.tsx `level` prop preserved (consumed at lines 40-54 by claseComplete/habilidadesComplete/dotesComplete predicates). Only the generic aria-label literal `'Sub-pasos del nivel'` was the actionable defect — fixed via template literal interpolation."
  - "cli.ts auxiliary 2DA-parse calls (loadClassLabels + loadSpellsColumnNames) relocated INSIDE the existing `if (EMIT_MAGIC_CATALOGS)` spells branch — they are consumed only by buildSpellClassRows. The outer `let spellIdsByRow = new Map<number, string>();` declaration is preserved because the domains branch reads it after the spells branch assigns it (both branches already EMIT_MAGIC_CATALOGS-gated)."
metrics:
  duration: ~8 minutes
  completed_date: 2026-04-24
---

# Phase 13 Plan 02: Orphan Sweep — Dead-Code Cleanup Summary

Closes ROADMAP Phase 13 Success Criteria #2..#6 by surgically removing
dead-code residue from the v1.0 milestone audit, fixing one a11y aria-label
miss, and gating an extractor 2DA parse behind its existing magic-emit
flag — with all six zero-diff invariants preserved and a Rule-1 plan
correction applied to ARCANE_SPELLCASTER_IDS.

## Task 1 — ConfirmDialog callsite audit

**Branch taken:** B — re-classified as false-positive audit finding. ConfirmDialog primitive + its `app.css` style block left byte-identical.

**Pre-flight grep command:**

```text
Grep pattern: "ConfirmDialog|from.*confirm-dialog|@planner/components/ui/confirm-dialog"
Search roots: apps/planner/src, packages, tests
```

**Pre-flight grep results (2026-04-24, executor pass):**

| File | Line | Match |
|------|------|-------|
| apps/planner/src/styles/app.css | 1238 | `/* ── ConfirmDialog ───────────────────────────────────────── */` (CSS block marker, not a caller) |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 3 | `import { ConfirmDialog } from '@planner/components/ui/confirm-dialog';` |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 28 | doc comment "...opens a ConfirmDialog overwrite branch..." |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 29 | doc comment "(reuses the Phase-7-descope ConfirmDialog primitive)" |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 109 | `<ConfirmDialog ...` (live JSX render) |
| apps/planner/src/components/ui/version-mismatch-dialog.tsx | 19 | doc comment "Reuses the `<dialog>` primitive pattern from ConfirmDialog." (no actual usage) |
| apps/planner/src/components/ui/confirm-dialog.tsx | 4, 12, 18 | self-references (interface decl, function decl, type ref) |
| tests/phase-08/save-slot-dialog.spec.tsx | 81 | `it('opens the overwrite ConfirmDialog when the slot name already exists', ...)` |
| tests/phase-08/save-slot-dialog.spec.tsx | 124 | `// Click Aceptar on the ConfirmDialog variant.` |
| tests/phase-08/save-slot-dialog.spec.tsx | 150 | `// Click the Cancelar button inside the ConfirmDialog (last one rendered).` |

Searches under `packages/` returned 0 hits.

**Decision:** Branch B executed.

**Reasoning:**

- Live import + JSX render in `save-slot-dialog.tsx` (not a test, not a doc comment — the production overwrite flow).
- 3 phase-08 test cases exercise the overwrite-confirm flow; deleting the primitive would break all three.
- The ROADMAP SC #2 phrase "0 callers post-magic-purge" was true at end of Phase 07.2 but is no longer true on master — Phase 08 SaveSlotDialog (slot-name collision) re-introduced a legitimate non-magic caller.
- `v1.0-MILESTONE-AUDIT.md` tech_debt 07.2 line 42 ("Orphan ConfirmDialog primitive (0 callers post-magic-purge)") is stale and should be struck in a future doc-only housekeeping pass — that is out of scope for this orphan-sweep plan, which is forbidden from touching audit text by zero-diff gates.

**No source edits in Task 1.** `confirm-dialog.tsx` and the `app.css` block at line 1238 remain byte-identical against the worktree base.

**Invariant check:**

```text
Branch B OK: primitive preserved while live caller exists
```

(via the planner-supplied node script, exit 0)

**Commit:** e0a79d0 — `docs(13-02): record ConfirmDialog audit Branch B (false positive)`

## Task 2 — prestige-gate-build.ts dead-code excision

**Pre-flight grep command (executor pass):**

```text
Grep pattern: "computeHighestClassLevel|ARCANE_SPELLCASTER_IDS"
Source-tree results (excluding planning .md files and prestige-gate-build.ts itself):
   ZERO external callers
```

**In-file references (prestige-gate-build.ts):**

```text
ARCANE_SPELLCASTER_IDS:
  Line 188 — declaration (Set<CanonicalId>)
  Line 336 — read inside computeHighestSpellLevel  ← LIVE consumer

computeHighestClassLevel:
  Line 346 — function declaration
  No internal callers
  No external callers
```

**Rule-1 plan correction:**

The plan + ROADMAP + 12.8-REVIEW IN-01 all asserted that **both** `computeHighestClassLevel` AND `ARCANE_SPELLCASTER_IDS` were dead. The pre-flight grep performed at execute time proves this is wrong: `ARCANE_SPELLCASTER_IDS` is consumed by the LIVE `computeHighestSpellLevel` helper (line 336), which is in turn called by `buildPrestigeGateBuildState` at lines 389+390 for the arcane-gate calculation. The plan author conflated `computeHighestSpellLevel` (live, kept) with `computeHighestClassLevel` (dead, deleted). Deleting the constant would have crashed the arcane prestige gate at runtime.

The executor preserved `ARCANE_SPELLCASTER_IDS` and excised only `computeHighestClassLevel`. This is a Rule-1 fix (correctness — the plan asserted bug-free dead code, but one item was load-bearing).

**Diff applied:**

```diff
@@ -343,23 +343,6 @@ function computeHighestSpellLevel(
   return highest;
 }

-function computeHighestClassLevel(
-  classLevels: Record<string, number>,
-  allowedClassIds?: ReadonlySet<CanonicalId>,
-) {
-  let highest = 0;
-
-  for (const [classId, classLevel] of Object.entries(classLevels)) {
-    if (allowedClassIds && !allowedClassIds.has(classId as CanonicalId)) {
-      continue;
-    }
-
-    highest = Math.max(highest, classLevel);
-  }
-
-  return highest;
-}
-
 export function buildPrestigeGateBuildState(
```

**Byte counts:** 17 lines removed (16-line function body + 1 trailing blank line). Zero lines added.

**Acceptance grep results (post-edit):**

| Symbol | Pre-edit count | Post-edit count |
|--------|----------------|-----------------|
| `computeHighestClassLevel` (in prestige-gate-build.ts) | 2 (line 346 decl + zero internal) | 0 |
| `ARCANE_SPELLCASTER_IDS` (in prestige-gate-build.ts) | 2 (line 188 decl + line 336 use) | 2 (preserved) |
| `computeHighestSpellLevel` (in prestige-gate-build.ts) | 4 (line 329 decl + 2 calls + 1 doc) | 4 (preserved) |

**Commit:** 184d3da — `refactor(13-02): delete dead computeHighestClassLevel from prestige-gate-build.ts`

## Task 3 — level-sub-steps.tsx aria-label fix

**Pre-flight grep:**

```text
"Sub-pasos del nivel" anywhere under tests/ → 0 hits
```

No test-harness alignment needed.

**Diff applied:**

```diff
@@ -68,7 +68,7 @@ export function LevelSubSteps({ level }: LevelSubStepsProps) {
   }

   return (
-    <div className="level-sub-steps" role="group" aria-label={`Sub-pasos del nivel`}>
+    <div className="level-sub-steps" role="group" aria-label={`Sub-pasos del nivel ${level}`}>
       {levelSubSteps.map((subStep) => (
         <StepperStep
           dataSubStep={subStep.id}
```

**Single-line edit; no other changes.** The `level` prop is preserved (consumed at lines 40-54 by `claseComplete` / `habilidadesComplete` / `dotesComplete` predicates) — the ROADMAP wording "unused level prop dropped" was a misreading of the audit source (07.2-REVIEW.md lines 68-88 specifically called out the aria-label, not the prop).

**Acceptance grep results (post-edit):**

| Pattern | Expected | Actual |
|---------|----------|--------|
| `Sub-pasos del nivel \${level}` in level-sub-steps.tsx | 1 | 1 |
| `aria-label={\`Sub-pasos del nivel\`}` in level-sub-steps.tsx | 0 | 0 |
| `level }: LevelSubStepsProps` in level-sub-steps.tsx | 1 | 1 |
| `isClaseLevelComplete(progressionState, level)` in level-sub-steps.tsx | 1 | 1 |

**Commit:** 1146e47 — `fix(a11y)(13-02): level-sub-steps aria-label interpolates active level`

## Task 4 — cli.ts 2DA-parse gating

**Pre-flight symbol audit:**

```text
loadClassLabels: declaration at line 143 (module-scope helper)
loadSpellsColumnNames: declaration at line 165 (module-scope helper)
EMIT_MAGIC_CATALOGS: const declared at line 270 in main()
spellIdsByRow: outer-scope `let` at line 321, mutated inside spells branch (line 407 pre-edit), read inside domains branch (line 424)
```

**Diff applied:**

```diff
@@ -307,9 +307,10 @@ export async function main(): Promise<void> {
   console.log(`[3/4] Dataset: ${datasetId}`);
   console.log('');

-  // Load auxiliary data for cross-assembler linking
-  const classLabelsByRow = loadClassLabels(nwsyncReader, baseGameReader);
-  const spellsColumnNames = loadSpellsColumnNames(nwsyncReader, baseGameReader);
+  // Phase 13-02 (IN-06): loadClassLabels + loadSpellsColumnNames moved into
+  // the spells branch below — they are consumed only by buildSpellClassRows
+  // (inside `if (EMIT_MAGIC_CATALOGS)`). Default extractor runs now skip
+  // both 2DA-parse round-trips.

   // -------------------------------------------------------------------------
   // d. Run assemblers in dependency order
@@ -388,6 +389,11 @@ export async function main(): Promise<void> {
   if (EMIT_MAGIC_CATALOGS) {
     try {
       console.log(`  ${step('spells')} Assembling spells...`);
+      // Phase 13-02 (IN-06): auxiliary 2DA parse calls relocated here from
+      // their previous unconditional position in main() — both consts feed
+      // only buildSpellClassRows below. Default runs skip the parse.
+      const classLabelsByRow = loadClassLabels(nwsyncReader, baseGameReader);
+      const spellsColumnNames = loadSpellsColumnNames(nwsyncReader, baseGameReader);
       const classCatalog = catalogs.classes as {
         classes: Array<{
           id: string;
```

**Character-index proof (post-edit):**

```text
'if (EMIT_MAGIC_CATALOGS)' first occurrence: char 11719
'const classLabelsByRow = loadClassLabels' occurrence: char 15837
'const spellsColumnNames = loadSpellsColumnNames' occurrence: char 15916
→ Both 2DA-parse calls strictly INSIDE the gate (15837 > 11719 and 15916 > 11719). PASS.
```

**Preserved:**

- `let spellIdsByRow = new Map<number, string>();` declaration in `main()` outer scope — domains branch reads it after spells branch assigns. Both branches already EMIT_MAGIC_CATALOGS-gated.
- All 5 non-magic catalogs (classes, races, skills, feats, deities) untouched.
- `buildSpellClassRows` / `loadClassLabels` / `loadSpellsColumnNames` signatures unchanged.

**Commit:** a5fcfb9 — `refactor(13-02): gate cli.ts 2DA-parse calls behind EMIT_MAGIC_CATALOGS`

## Verification

### `pnpm typecheck` (tsc --noEmit)

```text
apps/planner/src/features/feats/selectors.ts(1122,74): error TS2345: ... (pre-existing, baseline)
apps/planner/src/features/feats/selectors.ts(1138,74): error TS2345: ... (pre-existing, baseline)
tests/phase-12.4/prestige-gate.fixture.spec.ts(362,48): error TS2367: ... (pre-existing, baseline)
tests/phase-12.4/prestige-gate.fixture.spec.ts(423,48): error TS2367: ... (pre-existing, baseline)
ELIFECYCLE Command failed with exit code 2.
```

**4 pre-existing baseline errors only — 0 new errors introduced by 13-02.**

### `pnpm test --run` (full vitest suite)

```text
Test Files  3 failed | 108 passed (111)
     Tests  6 failed | 2141 passed | 2 skipped | 1 todo (2150)
```

The 6 failures are all pre-existing baseline (documented in `12.8-VERIFICATION.md` line 115 + `12.9-02 SUMMARY` notes):

1. `tests/phase-08/ruleset-version.spec.ts > BUILD_ENCODING_VERSION is literal 1` — bumped to 2 in 12.9, spec not updated
2. `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx > L9 con Guerrero 8 niveles` — extractor enrichment deferred
3. `tests/phase-12.4/class-picker-prestige-reachability.spec.tsx > L1 regresión` — same family
4. `tests/phase-12.4/prestige-gate.fixture.spec.ts > prestige at L1: l1 blocker with threshold 2` — copy drift
5. `tests/phase-12.4/prestige-gate.fixture.spec.ts > campeondivino override: BAB 7 blocker + feat-or` — feat-or wiring deferred
6. `tests/phase-12.4/prestige-gate.fixture.spec.ts > weaponmaster override: BAB 5 + skill intimidar 4` — same family

**0 new regressions.** Verified by stash-and-rerun: post-Task-2 stash showed identical 6/2141 split → restored stash → identical 6/2141 split.

### Zero-diff gates (vs worktree base ead56267)

| Gate | Path(s) | Diff lines |
|------|---------|------------|
| 1 | `apps/planner/src/features/persistence/` | 0 |
| 2 | `packages/rules-engine/` | 0 |
| 3 | `apps/planner/src/data/compiled-classes.ts compiled-races.ts compiled-skills.ts compiled-feats.ts compiled-deities.ts` | 0 |
| 4 | `apps/planner/src/styles/tokens.css` | 0 |
| 5 (Task 1) | `apps/planner/src/features/summary/save-slot-dialog.tsx tests/phase-08/save-slot-dialog.spec.tsx` | 0 |
| 6 (Task 1) | `apps/planner/src/components/ui/confirm-dialog.tsx apps/planner/src/styles/app.css` | 0 |

**All 6 zero-diff gates hold.**

### `git diff --stat ead56267..HEAD` (touched files)

```text
 .planning/phases/13-verification-orphan-sweep/13-02-SUMMARY.md  | 94+ ++++++++++++++++++++++
 apps/planner/src/components/shell/level-sub-steps.tsx           |  2 +-
 apps/planner/src/features/level-progression/prestige-gate-build.ts | 17 ----
 packages/data-extractor/src/cli.ts                              | 12 ++-
 4 files changed, 104 insertions(+), 21 deletions(-)
```

(SUMMARY.md grew further during this final write — final stats are larger; the table above reflects the pre-final-write snapshot.)

## Deviations from Plan

### Rule-1 plan corrections

**1. [Rule 1 — Bug] ARCANE_SPELLCASTER_IDS preserved instead of deleted**

- **Found during:** Task 2 pre-flight grep (executor re-run).
- **Issue:** Plan + ROADMAP + 12.8-REVIEW IN-01 + 12.8-02-SUMMARY all instructed "delete BOTH `computeHighestClassLevel` AND `ARCANE_SPELLCASTER_IDS`". A live grep at execute time showed `ARCANE_SPELLCASTER_IDS` is consumed at line 336 inside the LIVE `computeHighestSpellLevel` helper (called by `buildPrestigeGateBuildState` at lines 389+390 for the arcane-gate calculation). Plan author conflated `computeHighestSpellLevel` (live) with `computeHighestClassLevel` (dead).
- **Fix:** Surgically deleted only `computeHighestClassLevel`. Preserved `ARCANE_SPELLCASTER_IDS` byte-identical at line 188 and its consumer at line 336.
- **Verification:** Pre-edit and post-edit phase-12.4 + phase-12.8 + phase-08 test runs both show 6 pre-existing failures / 2141 passing — identical, no behavior change.
- **Files modified:** `apps/planner/src/features/level-progression/prestige-gate-build.ts`.
- **Commit:** 184d3da.

**Documentation impact:** The `must_haves.truths[1]` line in 13-02-PLAN.md (frontmatter) and `acceptance_criteria` of Task 2 (lines 211-212 reading "ARCANE_SPELLCASTER_IDS returns 0") are now incorrect against runtime reality. Two follow-up doc passes are warranted (out of zero-diff scope here):

1. Strike `v1.0-MILESTONE-AUDIT.md` line 60 ("IN-01 dead code computeHighestClassLevel / ARCANE_SPELLCASTER_IDS") — only the helper is dead; the constant is live.
2. Update `12.8-REVIEW.md` IN-01 to reflect the same.
3. Strike `ROADMAP.md` Phase 13 SC #3 wording "computeHighestClassLevel + ARCANE_SPELLCASTER_IDS removed" — only the helper was removed.

The Self-Check section below confirms this deviation does not break SC #3's primary intent (dead-code excision proceeded; the false dead-code claim has been re-classified).

### Authentication gates

None. No external services or credentials touched.

## Self-Check

| Claim | Verification | Result |
|-------|--------------|--------|
| `apps/planner/src/features/level-progression/prestige-gate-build.ts` modified | `[ -f ... ] && git log --oneline 184d3da` | FOUND |
| `apps/planner/src/components/shell/level-sub-steps.tsx` modified | `[ -f ... ] && git log --oneline 1146e47` | FOUND |
| `packages/data-extractor/src/cli.ts` modified | `[ -f ... ] && git log --oneline a5fcfb9` | FOUND |
| `.planning/phases/13-verification-orphan-sweep/13-02-SUMMARY.md` exists | `[ -f ... ]` | FOUND |
| Commit e0a79d0 (Task 1) exists | `git log --oneline --all \| grep e0a79d0` | FOUND |
| Commit 184d3da (Task 2) exists | `git log --oneline --all \| grep 184d3da` | FOUND |
| Commit 1146e47 (Task 3) exists | `git log --oneline --all \| grep 1146e47` | FOUND |
| Commit a5fcfb9 (Task 4) exists | `git log --oneline --all \| grep a5fcfb9` | FOUND |
| `confirm-dialog.tsx` byte-identical to base | `git diff ead56267..HEAD -- ...` | EMPTY |
| `app.css` byte-identical to base | `git diff ead56267..HEAD -- ...` | EMPTY |
| `save-slot-dialog.tsx` byte-identical to base | `git diff ead56267..HEAD -- ...` | EMPTY |
| `compiled-*.ts` files byte-identical to base | `git diff ead56267..HEAD -- ...` | EMPTY |
| `tokens.css` byte-identical to base | `git diff ead56267..HEAD -- ...` | EMPTY |
| `persistence/` byte-identical to base | `git diff ead56267..HEAD -- ...` | EMPTY |
| `rules-engine/` byte-identical to base | `git diff ead56267..HEAD -- ...` | EMPTY |
| Typecheck baseline 4 errors / 0 new | `pnpm typecheck` | PASSED |
| Test suite 6 baseline failures / 0 new | `pnpm test --run` | PASSED |

## Self-Check: PASSED

All 17 self-check rows above resolve in the expected direction. Plan execution complete.
