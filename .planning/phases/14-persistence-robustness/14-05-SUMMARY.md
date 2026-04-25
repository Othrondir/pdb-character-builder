---
phase: 14-persistence-robustness
plan: 05
subsystem: rules-engine
tags: [refactor, ability-modifier, magic-10, single-source-of-truth, rules-engine, foundation, vitest]

requires:
  - phase: 12.1-foundation-barrel
    provides: packages/rules-engine/src/foundation/index.ts barrel for foundation helpers (groupRacesByParent + projection adapters)
provides:
  - "Single canonical abilityModifier(score: number): number helper at packages/rules-engine/src/foundation/ability-modifier.ts"
  - "Sentinel scan locking 'no inline (score - 10) / 2 expressions in the four migrated files'"
  - "Divergent test-fixture migration: tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts now imports the shared helper"
affects: [skills-selectors, attributes-board, resumen-selectors, character-sheet, future-houserule-changes]

tech-stack:
  added: []
  patterns:
    - "Pure framework-agnostic helper (no React, no zustand, no compiled-catalog imports) re-exported via @rules-engine/foundation barrel"
    - "Single-source-of-truth refactor with sentinel test scanning the four migrated production files for inline regression"
    - "Divergent-fixture migration pattern: production helper imported into the test that previously hand-coded the same formula, so the assertion stays in lock-step with any future change to the canonical helper"

key-files:
  created:
    - packages/rules-engine/src/foundation/ability-modifier.ts
    - tests/phase-14/ability-modifier.spec.ts
    - .planning/phases/14-persistence-robustness/deferred-items.md
  modified:
    - packages/rules-engine/src/foundation/index.ts
    - apps/planner/src/features/skills/selectors.ts
    - apps/planner/src/features/character-foundation/attributes-board.tsx
    - apps/planner/src/features/summary/resumen-selectors.ts
    - apps/planner/src/components/shell/character-sheet.tsx
    - tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts

key-decisions:
  - "Helper named `abilityModifier` (not `computeModifier` or `intMod`) so the resumen-selectors.ts call site keeps its syntax verbatim — only the local function declaration is removed; the imported symbol fills its slot."
  - "In attributes-board.tsx the local variable was also named `abilityModifier`; renamed to `mod` to avoid shadowing the imported helper. The four usages in the JSX block (className branching + sign label) updated."
  - "In character-sheet.tsx the local helper was named `computeModifier` with 7 callers; renamed all 7 to `abilityModifier` and deleted the local definition rather than keeping a thin alias — every call site now reads identically across all four files."
  - "Divergent fixture in tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts (1,254 generated assertions) migrated to import the helper instead of inlining `Math.floor((intScore - 10) / 2)`. Lock-step with the production formula so houserule changes update both production + spec atomically."
  - "Sentinel test reads the four migrated files via fs.readFileSync + regex; runs as part of phase-14/ability-modifier.spec.ts, anchored at process.cwd() (repo root)."
  - "Score=0 edge case asserted as -5 in helper spec (mathematically floor(-10/2)=-5). Documented as schema-unreachable but mathematically locked so the helper stays a pure function."

patterns-established:
  - "Foundation barrel pattern (Phase 12.1) extended: ability-modifier joins ability-budget, origin-rules, group-races-by-parent, apply-race-modifiers, point-buy-snapshot."
  - "Production-site sweep sentinel: a single fs.readFileSync + regex test inside a phase spec proves the inline formula has been removed from a known list of files. Cheaper than full grep CI step, regression-locked at test time."

requirements-completed:
  - SHAR-05

duration: 12min
completed: 2026-04-25
---

# Phase 14-05: Ability Modifier Magic-10 Consolidation Summary

**Single canonical `abilityModifier(score)` helper extracted to `packages/rules-engine/src/foundation/ability-modifier.ts`, four planner sites that previously inlined `Math.floor((score - 10) / 2)` migrated to delegate, and a divergent test fixture in tests/phase-12.7 migrated to consume the same helper — closing ROADMAP SC#5 (Phase 14 magic-10 fallback removed) and partially advancing SC#7 (helper covered by 11 phase-14 specs + 1,254 phase-12.7 formula assertions reusing the helper).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-25T15:55:51Z
- **Completed:** 2026-04-25T16:08:00Z (approx)
- **Tasks:** 2 (TDD RED+GREEN, then refactor sweep)
- **Files modified:** 9 (2 created production, 1 created spec, 1 created deferred-items, 1 modified barrel, 4 modified production sites, 1 modified divergent fixture)

## Accomplishments

- Closed ROADMAP SC#5 (Phase 14): magic-10 fallback removed; the canonical D&D 3.5 / NWN1 EE formula now lives in exactly one production file (`packages/rules-engine/src/foundation/ability-modifier.ts`).
- Partially advanced ROADMAP SC#7 with 11 phase-14 specs + a sentinel scan + 1,254 phase-12.7 formula assertions reusing the helper. Skill math, attributes-board math, resumen math, and character-sheet math are bit-for-bit identical pre/post migration.
- T-14-05-01 (Tampering — helper drift across 4 copies) mitigated: single source of truth + sentinel scan locks the invariant against future regression.
- Divergent fixture removed: `tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts` now imports `abilityModifier` instead of inlining `Math.floor((intScore - 10) / 2)`. Lock-step with the production formula.
- Foundation barrel re-exports the new helper alongside ability-budget, origin-rules, group-races-by-parent, apply-race-modifiers, point-buy-snapshot.

## Task Commits

1. **Task 1: RED — extract abilityModifier helper + spec** — `9274f02` (feat)
2. **Task 2: Migrate 4 call sites + sentinel + divergent-fixture migration** — `74f59c0` (refactor)

_Plan-level type=execute (not type=tdd); both tasks individually used `tdd="true"`. RED proven by 11/11 spec failure prior to helper creation; GREEN reached after helper added (10/10 unit + 1 sentinel intentionally pending Task 2). Sentinel transitioned to GREEN at end of Task 2 (11/11 phase-14 specs passing)._

## Files Created/Modified

### Created

- `packages/rules-engine/src/foundation/ability-modifier.ts` — pure helper, 21 lines including JSDoc.
- `tests/phase-14/ability-modifier.spec.ts` — 11 tests: H1..H8 formula cases (10, 11, 12, 18, 25, 8, 1, 0), H9 idempotence/purity, D1 evaluateSkillSnapshot delegation, sentinel scan.
- `.planning/phases/14-persistence-robustness/deferred-items.md` — out-of-scope environment finding (phase-12.9 dexie resolution).

### Modified

- `packages/rules-engine/src/foundation/index.ts` — added `export * from './ability-modifier';` line, position 2 (alphabetical).
- `apps/planner/src/features/skills/selectors.ts` — added `import { abilityModifier } from '@rules-engine/foundation';` near sibling `@rules-engine/*` imports; `getIntelligenceModifier` body replaced multi-line `Math.floor((... - 10) / 2)` block (lines 227-229) with `abilityModifier(baseIntelligence + racialInt + intelligenceIncreases)`. Inline comment updated to note delegation.
- `apps/planner/src/features/character-foundation/attributes-board.tsx` — added import; line 125 inline expression `Math.floor((totalValue - 10) / 2)` replaced with `abilityModifier(totalValue)`; local variable renamed from `abilityModifier` (which would shadow the imported helper) to `mod`; four downstream JSX references (modifierLabel, className branching) updated to `mod`.
- `apps/planner/src/features/summary/resumen-selectors.ts` — added import; deleted local `function abilityModifier(score: number)` (lines 54-56); the call site at line ~184 (`abilityMod = abilityModifier(abilityScore)`) keeps its syntax unchanged because the imported symbol fills the deleted slot. Comment added documenting the migration.
- `apps/planner/src/components/shell/character-sheet.tsx` — added import; renamed all 7 callers `computeModifier` → `abilityModifier` (replace_all), then deleted the local `function computeModifier(score)` definition. `formatModifier` (separate concern, formats with `±` prefix) kept untouched.
- `tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts` — added import; replaced `Math.floor((intScore - 10) / 2)` with `abilityModifier(intScore)`. 1,254 generated assertions now consume the canonical helper.

## Test Results

- **tests/phase-14/ability-modifier.spec.ts** — 11/11 pass (H1..H9 helper + D1 delegation + sentinel scan).
- **tests/phase-14/toast-clobber-race.spec.tsx** — 6/6 pass (preserved baseline from 14-01).
- **tests/phase-05/skill-rules.spec.ts** — 3/3 pass (skill math invariant preserved).
- **tests/phase-05/skill-revalidation.spec.ts** — 2/2 pass.
- **tests/phase-08/resumen-board.spec.tsx** — 5/5 pass.
- **tests/phase-08/resumen-selectors.spec.ts** — 4/4 pass (resumen view-model invariant preserved).
- **tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts** — 1,254/1,254 pass (divergent fixture migrated; values unchanged).
- **Aggregate run:** 1,285 passed across phase-05 + phase-08 + phase-12.7 + phase-14 with zero new failures over baseline.

### Pre-existing failures (out of scope)

- `tests/phase-12.9/resumen-identity-dedup.spec.tsx`, `tests/phase-12.9/resumen-progresion-full-width.spec.tsx`, plus 1 additional phase-12.9 spec all fail with `Failed to resolve import "dexie" from apps/planner/src/features/persistence/dexie-db.ts`. **Verified pre-existing** by stashing 14-05 changes (`git stash --keep-index`) and re-running phase-12.9 against the unmigrated baseline — same 3 files fail with identical resolve error before any 14-05 file is touched. Documented in `.planning/phases/14-persistence-robustness/deferred-items.md`. Worktree node_modules layout issue, not an ability-modifier regression.

## Threat Register

| Threat ID | Category | Disposition | Mitigation |
|-----------|----------|-------------|------------|
| T-14-05-01 | Tampering — helper drift across 4 copies | mitigate | Single source of truth in `ability-modifier.ts`. Sentinel test in `tests/phase-14/ability-modifier.spec.ts` scans the four migrated files via `fs.readFileSync` + regex and asserts no inline `Math.floor((... - 10) / 2)` remains. CI failure if any production-side regression reintroduces the inline formula. |
| T-14-05-02 | Integrity — numeric overflow | accept | NWN1 schema clamps attributes to `[3, 25]` at `build-document-schema.ts`. JS `Math.floor` is exact for inputs `≤ 2^31`. No overflow risk. |
| T-14-05-03 | Information Disclosure | n/a | Pure helper has no I/O. |
| T-14-05-04 | DoS | n/a | O(1) operation. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Auto-add missing functionality] Migrated divergent fixture in tests/phase-12.7 instead of "negative finding" path**

- **Found during:** Task 2, divergent-fixture sweep.
- **Issue:** Plan said "If no such fixture exists, document the negative finding in SUMMARY." A fixture *did* exist: `tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts:98` hand-coded `Math.floor((intScore - 10) / 2)` to compute expected values for 1,254 generated assertions across 11 classes × 6 INT scores × 19 levels.
- **Fix:** Imported `abilityModifier` and replaced the inline formula. Now any future change to the canonical helper updates both production and spec atomically.
- **Files modified:** `tests/phase-12.7/skill-budget-l2-l20-formula.spec.ts` (2 lines).
- **Commit:** `74f59c0`.

**2. [Rule 1 — Bug avoidance] Replaced `computeModifier` (not `abilityModifier`) in character-sheet.tsx and deleted it**

- **Found during:** Task 2, M4 migration.
- **Issue:** Plan said "If the helper is named `abilityModifier` (local), inline-callers + delete the local definition. If named differently, replace only the inline expression." The local helper was named `computeModifier` (not `abilityModifier`) with 7 callers across StatsPanel.
- **Fix:** Renamed all 7 callers to `abilityModifier` (replace_all), then deleted `function computeModifier(score)` so every call site reads identically across all four files. This matches the plan's spirit ("All four production sites delegate") more cleanly than keeping a thin local alias.
- **Files modified:** `apps/planner/src/components/shell/character-sheet.tsx`.
- **Commit:** `74f59c0`.

### Deviations summary

- 2 auto-fixes applied per Rules 1+2; both improve consolidation rather than expand scope.
- No Rule-3 blockers, no Rule-4 architectural decisions surfaced.
- No additional production code changes beyond the four migration targets.

## Authentication Gates

None encountered (pure refactor, no I/O, no external services).

## Local-Variable Rename Collisions

- **attributes-board.tsx:** local `abilityModifier` (line 125 in old code) collided with imported helper of the same name. Renamed local to `mod`. Four downstream references updated (modifierLabel computation + className conditional branches).
- **character-sheet.tsx:** local `computeModifier` did not collide name-wise with the imported `abilityModifier`, but was renamed (not aliased) so all four production sites share one symbol. 7 references updated then the local definition deleted.
- **resumen-selectors.ts:** local `abilityModifier` was a function declaration; deleted entirely. Call site at line ~184 keeps its syntax unchanged (the imported symbol fills the deleted slot — name parity preserves the call).
- **skills/selectors.ts:** no local helper, just an inline expression. No rename needed.

## Self-Check: PASSED

- `packages/rules-engine/src/foundation/ability-modifier.ts` exists (21 lines, exports `abilityModifier`).
- `tests/phase-14/ability-modifier.spec.ts` exists (11 tests).
- `.planning/phases/14-persistence-robustness/deferred-items.md` exists.
- Commit `9274f02` (Task 1) is in `git log --oneline -5` reachable from HEAD.
- Commit `74f59c0` (Task 2) is HEAD.
- Grep confirms 4 imports of `abilityModifier` from `@rules-engine/foundation` across the four production files; zero inline `Math.floor((... - 10) / 2)` remain in `apps/planner/src/`.
- 11/11 phase-14 specs pass; 1,285 aggregate tests pass across phase-05 + phase-08 + phase-12.7 + phase-14.
