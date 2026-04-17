# Phase 07 Deferred Items

Items surfaced during Phase 7 execution that are OUT OF SCOPE for the current plan and
deferred to a future plan for resolution. These do not block the plan's goal.

## Discovered in Plan 07-01

### Sorcerer spells missing from compiled-spells.ts (0 tagged entries)

- **Discovered**: Plan 07-01 Task 3 test fixture surfaced this pre-existing data gap.
- **Symptom**: `grep -c '"class:sorcerer"' apps/planner/src/data/compiled-spells.ts` returns 0.
- **Root cause**: `packages/data-extractor/src/cli.ts::buildSpellClassRows` uses the
  `LABEL_TO_COLUMN = { Wizard: 'Wiz_Sorc', Sorcerer: 'Wiz_Sorc' }` mapping. Because both
  classes share the same spells.2da column, `columnToClassId` in `spell-assembler.ts`
  overwrites wizard→Wiz_Sorc with sorcerer→Wiz_Sorc (or vice versa) and only the last
  insertion survives, leaving one class with 0 tagged spells per 2DA row.
- **Scope**: Out of Plan 07-01 (predates this plan; extractor data shape bug).
- **Deferred to**: Plan 07-02 extractor pass OR a dedicated 05.1-followup plan. The fix
  needs `columnToClassId` to become `columnToClassIds: Map<column, string[]>` and the
  class-level mapping pass to emit the spell under EVERY class sharing that column.
- **Workaround in Plan 07-01**: Phase 7 Wave 0 spell-eligibility test targets
  `class:bard` instead of `class:sorcerer` (bard has its own column and full coverage).

### Resolution — 2026-04-17 (Plan 07-05)

- Fixed in Plan 07-05 Task 1: `packages/data-extractor/src/assemblers/spell-assembler.ts` promoted `columnToClassId` to `Map<string, string[]>`, fanning out every spell under each class sharing the column.
- Catalog regenerated via `pnpm extract` in Task 2: `grep -c '"class:sorcerer"' apps/planner/src/data/compiled-spells.ts` returned 232 post-regen (was 0). Wizard count 231 and bard count 94 preserved.
- Test workaround reverted in Task 3: `tests/phase-07/spell-eligibility.spec.ts` now tests `class:sorcerer` directly (bard spot-check kept as regression guard). New catalog-coverage test in `tests/phase-07/sorcerer-catalog-coverage.spec.ts` locks the fix with `sorcererCount === wizardCount`.
- VERIFICATION.md gap 5 (WR-04) closed. MAGI-03 sorcerer coverage restored.

### Spell descriptions are all empty (376 of 376)

- **Discovered**: Plan 07-01 Task 1 symmetric Description strref warnings surfaced this
  catalog completeness gap. Every real spell entry in `compiled-spells.ts` ships with
  `description: ""`, blocking the LANG-02 requirement at the data layer.
- **Root cause**: spells.2da's `Description` column either holds null stringrefs or
  stringrefs that do not resolve in the Puerta TLK window. The warnings distinguish
  the two cases per row in `extraction-report.txt`.
- **Scope**: The rules-engine fail-closed path (Plan 07-01 Task 3's `detectMissingSpellData`)
  correctly marks every selection with an empty description as `blocked + missing-source`,
  so the correctness contract is preserved. The data fix is a separate 07-03 follow-up.
- **Deferred to**: Plan 07-03 UI or a 07-02 data-override pass using the Puerta forum
  spell descriptions as `manual-override` layer evidence.

## Discovered in Plan 07-05

### Pre-existing TypeScript errors in tests/phase-03/foundation-validation.spec.ts

- **Discovered**: Plan 07-05 Task 1 root `pnpm typecheck` surfaced pre-existing errors.
- **Symptom**: `tsc -p tsconfig.base.json --noEmit` fails at lines 25, 38, 60 of
  `tests/phase-03/foundation-validation.spec.ts` with `DeityRuleRecord.allowedAlignmentIds`
  type mismatches (`string[]` vs kind-prefixed CanonicalId union). Exit code 2.
- **Reproduces on HEAD**: Confirmed via `git stash push` + `pnpm typecheck` — the errors
  exist on the parent commit without any Plan 07-05 edits. Not introduced by WR-04 fix.
- **Scope**: Out of Plan 07-05. Plan 07-05's automated verify is scoped to the
  data-extractor package (`pnpm --filter @pdb/data-extractor exec tsc --noEmit`), which
  passes cleanly. The phase-03 test fixture needs to be updated to construct `deity:none`
  with a correctly-typed `allowedAlignmentIds` (alignment:*-prefixed tuple).
- **Deferred to**: A small phase-03 test-fixture fix plan, or a future hygiene pass.
