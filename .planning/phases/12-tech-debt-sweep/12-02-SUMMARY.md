---
phase: 12-tech-debt-sweep
plan: 02
subsystem: infra
tags: [dead-code, extractor, vitest, test-hygiene, typescript, pnpm-monorepo]

# Dependency graph
requires:
  - phase: 12-tech-debt-sweep (Plan 12-01)
    provides: "selectors.ts rewritten to import shared getClassLabel helper; file ready to receive FEAT_CATEGORY_LABELS / categoryLabel deletions on top"
  - phase: 07.2-magic-ui-descope
    provides: "EMIT_MAGIC_CATALOGS env flag; classes/races/skills/feats/deities default run (5 catalogs); spells/domains preserved behind flag"
provides:
  - "FEAT_CATEGORY_LABELS map + FeatOptionView.categoryLabel field + mapToOptionView assignment deleted (Phase 12 SC3)"
  - "buildEmitterPlan({ emitMagic }): Array<{index,total,name}> exported from packages/data-extractor/src/cli.ts as single source of truth for extract-progress counters (Phase 12 SC4)"
  - "Extract-progress counter self-labels as [1/5]..[5/5] under default EMIT_MAGIC_CATALOGS=0 and [1/7]..[7/7] under EMIT_MAGIC_CATALOGS=1; zero hardcoded '[N/7]' literals remain"
  - "cli.ts main() only runs on direct invocation (import.meta.url == argv[1]) so test imports no longer clobber apps/planner/src/data/compiled-*.ts"
affects: [v1.0-milestone-closure, future-catalog-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unit-helper seam: pure `buildEmitterPlan` helper colocated with its consumer enables unit-test regression lock without child-process spawn"
    - "CLI direct-invocation guard: import.meta.url vs pathToFileURL(process.argv[1]) for side-effect-free module import"

key-files:
  created:
    - "tests/phase-12/extract-counter-magic-off.spec.ts"
  modified:
    - "apps/planner/src/features/feats/selectors.ts"
    - "packages/data-extractor/src/cli.ts"

key-decisions:
  - "Phase 12-02: buildEmitterPlan exported as pure helper so the regression spec can unit-test the counter plan shape without spawning the extractor -- SC4 assertion stays crisp + CI flake-proof"
  - "Phase 12-02: cli.ts main() gated behind import.meta.url === pathToFileURL(process.argv[1]).href so tests/phase-12 importing @data-extractor/cli no longer triggers an extractor run on every `vitest run`"
  - "Phase 12-02: FEAT_CATEGORY_LABELS deletion took the full-map branch (not keys-only fallback) because scout+guard grep confirmed zero JSX consumers of categoryLabel anywhere in apps/planner/src, packages/, or tests/"

patterns-established:
  - "Declarative emitter descriptor list: add catalogs to EMITTERS[] with { name, magicGated } instead of adding another '[N/X]' console.log literal. Counter math happens once inside buildEmitterPlan."
  - "Direct-invocation guard for tsx/ESM CLIs: `import.meta.url === pathToFileURL(process.argv[1]).href` is the Windows-safe idiom (pathToFileURL normalizes C:\\ paths to file:///C:/ shape)."

requirements-completed: []

# Metrics
duration: 13min
completed: 2026-04-18
---

# Phase 12 Plan 02: Tech-Debt Sweep (Bug 3 + Bug 4) Summary

**Dead-code purge of magic-leaked `FEAT_CATEGORY_LABELS` map + `categoryLabel` field, plus declarative `buildEmitterPlan` helper that collapses the extractor's `[N/7]` counter to `[N/5]` when `EMIT_MAGIC_CATALOGS=0`.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-18T18:13:44Z
- **Completed:** 2026-04-18T18:26:22Z
- **Tasks:** 3
- **Files modified:** 3 (2 modified + 1 created)

## Accomplishments

- **Bug 3 / IN-03 / Phase 12 SC3 closed:** the 12-entry `FEAT_CATEGORY_LABELS` literal (including the magic-flavoured `'3':'Arcana'` and `'15':'Divina'`), `FeatOptionView.categoryLabel`, and the `mapToOptionView` assignment all deleted. Guard grep confirmed zero JSX consumers before deletion, so the full-map branch was safe.
- **Bug 4 / IN-05 / Phase 12 SC4 closed:** `buildEmitterPlan({ emitMagic })` exported from `packages/data-extractor/src/cli.ts` drives all 7 `[index/total]` counter strings from a single EMITTERS descriptor array; default run now shows `[1/5]..[5/5]`, opt-in shows `[1/7]..[7/7]`. Zero `[N/7]` literals remain.
- **Test-hygiene deviation (Rule 2):** gated cli.ts's top-level `main()` invocation behind `import.meta.url === pathToFileURL(process.argv[1]).href` so the Phase 12 spec's `import { buildEmitterPlan } from '@data-extractor/cli'` no longer re-runs a full extraction on every `vitest run`.
- **3 new Phase 12 specs landed green**, 390/390 total (was 387 → +3).

## Task Commits

Each task was committed atomically on `master`:

1. **Task 1: Delete FEAT_CATEGORY_LABELS + categoryLabel** — `305f51c` (fix)
2. **Task 2: RED — extract-counter regression spec** — `4b34bbe` (test)
3. **Task 3: GREEN — dynamic emitter counter in cli.ts + test-hygiene guard** — `cf05b9f` (fix)

_Task 3 absorbed the Rule-2 auto-fix (direct-invocation guard) per atomic-commit protocol; no separate commit._

## Files Created/Modified

- `apps/planner/src/features/feats/selectors.ts` — **modified**. Deleted lines 33-45 (FEAT_CATEGORY_LABELS block), deleted `categoryLabel: string` field from FeatOptionView, deleted the `categoryLabel: FEAT_CATEGORY_LABELS[feat.category] ?? feat.category,` line in `mapToOptionView`. No other edits (shared `getClassLabel` import from 12-01 preserved).
- `packages/data-extractor/src/cli.ts` — **modified**. Added EMITTERS descriptor array + `buildEmitterPlan` export above `main()`. Replaced all 7 hardcoded `[1-7/7]` literals with `${step('<name>')}` template calls. Added import-vs-argv guard around the top-level `main().catch(...)` invocation (imports `pathToFileURL` from `node:url`).
- `tests/phase-12/extract-counter-magic-off.spec.ts` — **created**. Unit-helper regression spec with 3 tests: magic-off ⇒ 5 active + total=5, magic-on ⇒ 7 active + total=7, ordering invariant `classes, races, skills, feats, spells, domains, deities`. No child-process spawn, no skip-marks.

## Bug 3 Evidence

**Branch taken:** full-map deletion (not keys-only fallback).

**Guard grep** (run before deletion):

```
apps/planner/src/features/feats/selectors.ts:60:  categoryLabel: string;
apps/planner/src/features/feats/selectors.ts:359:    categoryLabel: FEAT_CATEGORY_LABELS[feat.category] ?? feat.category,
```

Only the declaration + assignment — confirmed orphan (no JSX consumer in `apps/planner/src`, `packages/`, or `tests/`). Safe for full-map deletion.

**Deleted symbols:**
- `FEAT_CATEGORY_LABELS: Record<string, string>` (12 entries including `'3':'Arcana'` and `'15':'Divina'`)
- `FeatOptionView.categoryLabel: string`
- `mapToOptionView` `categoryLabel: FEAT_CATEGORY_LABELS[feat.category] ?? feat.category,`

**Post-deletion grep audit** (`apps/planner/src`):
- `grep -rn "FEAT_CATEGORY_LABELS" apps/planner/src` → empty ✓
- `grep -rn "categoryLabel" apps/planner/src` → empty ✓
- `grep -rnE "Arcana|Divina" apps/planner/src` → empty ✓

## Bug 4 Evidence

**Before** (7 hardcoded literals, lines 277-400):

```typescript
console.log('  [1/7] Assembling classes...');
console.log('  [2/7] Assembling races...');
console.log('  [3/7] Assembling skills...');
console.log('  [4/7] Assembling feats...');
if (EMIT_MAGIC_CATALOGS) {
  console.log('  [5/7] Assembling spells...');
  console.log('  [6/7] Assembling domains...');
}
console.log('  [7/7] Checking deity data...');
```

**After** (single EMITTERS source of truth + computed `step(name)` lookup):

```typescript
const EMITTERS: ReadonlyArray<{ name: string; magicGated: boolean }> = [
  { name: 'classes', magicGated: false },
  { name: 'races',   magicGated: false },
  { name: 'skills',  magicGated: false },
  { name: 'feats',   magicGated: false },
  { name: 'spells',  magicGated: true  },
  { name: 'domains', magicGated: true  },
  { name: 'deities', magicGated: false },
];

export function buildEmitterPlan(
  opts: { emitMagic: boolean },
): Array<{ index: number; total: number; name: string }> {
  const active = EMITTERS.filter((e) => !e.magicGated || opts.emitMagic);
  const total = active.length;
  return active.map((e, i) => ({ index: i + 1, total, name: e.name }));
}

// inside main():
const emitterPlan = buildEmitterPlan({ emitMagic: EMIT_MAGIC_CATALOGS });
const step = (name: string): string => {
  const s = emitterPlan.find((p) => p.name === name);
  return s ? `[${s.index}/${s.total}]` : '[?/?]';
};
// ...
console.log(`  ${step('classes')} Assembling classes...`);   // [1/5] when magic off
console.log(`  ${step('races')} Assembling races...`);       // [2/5] ...
// ... etc.
```

**Post-refactor grep audit:**
- `grep -nE '\[[1-7]/7\]' packages/data-extractor/src/cli.ts` → empty ✓
- `buildEmitterPlan` export site exists at cli.ts:250 ✓

**Spec result:** `tests/phase-12/extract-counter-magic-off.spec.ts` 3/3 GREEN (duration 443ms after the direct-invoke guard; was 777ms while the extractor still ran as a test side-effect).

**Manual smoke:** not run — repo does not have nwsync fixtures wired for CI. The unit spec covers the counter-compute branch; stdout-format verification can be done by the user via `EMIT_MAGIC_CATALOGS=0 pnpm extract` / `EMIT_MAGIC_CATALOGS=1 pnpm extract` locally.

## File-Collision Handling with Plan 12-01

Both plans modify `apps/planner/src/features/feats/selectors.ts`:
- **12-01** (landed first in commits `2bbc9cf` GREEN + `43ae985`): rewrote `selectFeatBoardView` to import the shared `getClassLabel` helper from `@rules-engine/feats/get-class-label`, replacing the local helper.
- **12-02** (this plan, commit `305f51c`): layered deletions on top of 12-01 — removed `FEAT_CATEGORY_LABELS` + `categoryLabel` field + assignment without touching the `getClassLabel` import.

Sequencing enforced via `wave: 2 + depends_on: ['01']` in the 12-02 frontmatter. No merge conflict; the two diffs are disjoint within the file.

## Decisions Made

- **Full-map deletion (not keys-only fallback) for Bug 3** — guard grep found zero JSX consumers of `categoryLabel` anywhere in the live source tree, so the CONTEXT.md D-03 primary branch was safe. Fallback branch documented in the plan would have left the map and only deleted the `'3':'Arcana'` and `'15':'Divina'` keys; not needed.
- **Unit-helper seam for Bug 4 regression spec** — per plan-checker ruling 2026-04-18, the full-extractor / child-process variant was explicitly rejected. Exporting `buildEmitterPlan` as a pure helper keeps SC4's no-`[N/7]` invariant assertable in unit-test time (milliseconds) without needing nwsync fixtures, and is the only approved shape.
- **Direct-invocation guard for cli.ts top-level `main()`** — see "Deviations" below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] CLI top-level `main()` runs on every module import**
- **Found during:** Task 3 (GREEN verify)
- **Issue:** `packages/data-extractor/src/cli.ts` closes with a top-level `main().catch(...)` call. Before this plan, nothing in `tests/` imported that module, so the side-effect was dormant. After Task 2 landed the RED spec (which imports `buildEmitterPlan` from `@data-extractor/cli`), every `vitest run` started triggering a full extractor run at module-eval time — which regenerated `apps/planner/src/data/compiled-{classes,races,skills,feats,deities}.ts` (timestamp-only diff, but still `git status`-visible) and dropped `extraction-report.txt` into the repo root. Confirmed by running the spec once post-Task-3 and observing `M apps/planner/src/data/compiled-*.ts` in `git status`. This is a test-hygiene regression DIRECTLY caused by Task 2/3's import.
- **Fix:** Gated the `main().catch(...)` call behind an `import.meta.url === pathToFileURL(process.argv[1]).href` check. `pathToFileURL` is imported from `node:url` and normalizes Windows-style paths to the same `file:///C:/...` shape `import.meta.url` uses. Direct invocation via `npx tsx src/cli.ts` or `pnpm extract` still runs `main()` as before; unit-test imports no longer trigger it.
- **Files modified:** `packages/data-extractor/src/cli.ts` (end of file)
- **Verification:**
  - `npx vitest run tests/phase-12/extract-counter-magic-off.spec.ts` → 3/3 green, 443ms (down from 777ms pre-guard — no extractor run).
  - `git status` after re-running vitest: clean (only the 2 files this plan intentionally modified remain dirty).
  - `pnpm typecheck` clean.
- **Committed in:** `cf05b9f` (rolled into the Task 3 GREEN commit — atomic-per-task convention).

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical test hygiene)
**Impact on plan:** Auto-fix was necessary — without it, every `vitest run` would leave the working tree dirty and contradict `CLAUDE.md`'s no-direct-repo-edit guarantee on subsequent agent runs. No scope creep; the fix is ~10 LOC at the end of an already-touched file.

## Issues Encountered

- **Flake observed:** one full-suite run after Task 3 showed `tests/phase-08/share-entry.spec.tsx` failing on a `downloadSpy` `waitFor` assertion (a timing-related assertion in a pre-existing Phase 08 spec). A second run produced 390/390 green. Flake is unrelated to 12-02's touched files; logged as a pre-existing Phase-08 concern, not a 12-02 regression.

## User Setup Required

None - no external service configuration required. `pnpm extract` run is local / dev-only and did not change its invocation contract.

## Next Phase Readiness

- **Phase 12** (tech-debt-sweep) plan count satisfied: 12-01 + 12-02 = 2/2 plans shipped.
- **Phase 12 success criteria:** SC1 + SC2 closed by 12-01 (P03 typecheck + getClassLabel); SC3 + SC4 closed by 12-02 (FEAT_CATEGORY_LABELS deletion + extract counter). All 4 SCs green.
- **Phase 12.1** (Roster Wiring & Overflow Fixes, inserted per STATE.md) remains the next queued piece of work. No dependency on 12-02's outputs — 12.1 targets class/race picker catalogs + panel overflow, not feats/extractor.
- **v1.0 milestone:** with Phase 12 closed, the `v1.0-MILESTONE-AUDIT.md` Phase 07.2 informational gaps (IN-03, IN-05, IN-07) + P03 typecheck bug are resolved. 12.1 remains for the user-visible L1 picker blocker surfaced in Phase 11 UAT.

## Self-Check: PASSED

Verification (run 2026-04-18T18:26:22Z):

- `tests/phase-12/extract-counter-magic-off.spec.ts` → exists ✓ (62 lines, 3 tests)
- Commit `305f51c` → found on master ✓
- Commit `4b34bbe` → found on master ✓
- Commit `cf05b9f` → found on master ✓
- `buildEmitterPlan` export in `packages/data-extractor/src/cli.ts` → found at line 250 ✓
- `grep -rE 'FEAT_CATEGORY_LABELS|categoryLabel|Arcana|Divina' apps/planner/src` → empty ✓
- `grep -nE '\[[1-7]/7\]' packages/data-extractor/src/cli.ts` → empty ✓
- `npx tsc -p tsconfig.base.json --noEmit` → exit 0 ✓
- Full suite: 70 files / 390 tests pass ✓

---
*Phase: 12-tech-debt-sweep*
*Completed: 2026-04-18*
