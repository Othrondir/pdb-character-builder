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
