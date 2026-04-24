---
phase: 13
plan: 02
subsystem: orphan-sweep / dead-code cleanup
tags: [tech-debt, refactor, a11y, extractor]
requires:
  - 13-01 (verification doc retro-author — wave-1 sibling, no source overlap)
provides:
  - prestige-gate-build.ts free of dead computeHighestClassLevel + ARCANE_SPELLCASTER_IDS
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
  - "ConfirmDialog audit finding (v1.0-MILESTONE-AUDIT.md tech_debt 07.2 line 42) reclassified as false positive — pre-flight grep on 2026-04-24 confirms 1 live caller in apps/planner/src/features/summary/save-slot-dialog.tsx (Phase-08 SaveSlotDialog overwrite flow) plus 3 phase-08 tests. Phase 07.2 magic purge correctly removed magic ConfirmDialog usages; Phase 08 independently re-introduced a legitimate non-magic caller. Primitive + CSS block left byte-identical. Future doc pass should strike line 42 of v1.0-MILESTONE-AUDIT.md."
  - "level-sub-steps.tsx `level` prop preserved (consumed by claseComplete/habilidadesComplete/dotesComplete predicate calls at lines 40-54). Only the generic aria-label literal `'Sub-pasos del nivel'` was the actionable defect — fixed via template literal interpolation. ROADMAP SC #4 wording (`unused level prop dropped`) was a misreading of the audit source; corrected here in plan and execution."
  - "cli.ts auxiliary 2DA-parse calls (loadClassLabels + loadSpellsColumnNames) relocated INSIDE the existing `if (EMIT_MAGIC_CATALOGS)` spells branch — they are consumed only by buildSpellClassRows. The outer `let spellIdsByRow = new Map<number, string>();` declaration is preserved because the domains branch reads it after the spells branch assigns it (both branches already EMIT_MAGIC_CATALOGS-gated)."
metrics:
  duration: TBD
  completed_date: TBD
---

# Phase 13 Plan 02: Orphan Sweep — Dead-Code Cleanup Summary

Closes ROADMAP Phase 13 Success Criteria #2..#6 by surgically removing
dead-code residue from the v1.0 milestone audit, fixing one a11y aria-label
miss, and gating an extractor 2DA parse behind its existing magic-emit
flag — with all four zero-diff invariants preserved.

## ConfirmDialog callsite audit (Task 1)

**Branch taken:** B — re-classified as false-positive audit finding. ConfirmDialog primitive + its app.css style block left byte-identical.

**Pre-flight grep command:**

```text
Grep pattern: "ConfirmDialog|from.*confirm-dialog|@planner/components/ui/confirm-dialog"
Search roots: apps/planner/src, packages, tests
```

**Pre-flight grep results (2026-04-24, executor pass):**

| File | Line | Match |
|------|------|-------|
| apps/planner/src/styles/app.css | 1238 | `/* ── ConfirmDialog ───────────────────────────────────────── */` (CSS block marker) |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 3 | `import { ConfirmDialog } from '@planner/components/ui/confirm-dialog';` |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 28 | doc comment "...opens a ConfirmDialog overwrite branch..." |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 29 | doc comment "(reuses the Phase-7-descope ConfirmDialog primitive)" |
| apps/planner/src/features/summary/save-slot-dialog.tsx | 109 | `<ConfirmDialog ...` (live JSX render) |
| apps/planner/src/components/ui/version-mismatch-dialog.tsx | 19 | doc comment "Reuses the `<dialog>` primitive pattern from ConfirmDialog." (no actual usage) |
| apps/planner/src/components/ui/confirm-dialog.tsx | 4, 12, 18 | self-references (interface decl, function decl, type ref) |
| tests/phase-08/save-slot-dialog.spec.tsx | 81 | `it('opens the overwrite ConfirmDialog when the slot name already exists', ...)` |
| tests/phase-08/save-slot-dialog.spec.tsx | 124 | `// Click Aceptar on the ConfirmDialog variant.` |
| tests/phase-08/save-slot-dialog.spec.tsx | 150 | `// Click the Cancelar button inside the ConfirmDialog (last one rendered).` |

**Decision:** Branch B executed.

**Reasoning:**
- Live import + JSX render in `save-slot-dialog.tsx` (not a test, not a doc comment — the production overwrite flow).
- 3 phase-08 test cases exercise the overwrite-confirm flow; deleting the primitive would break all three.
- The ROADMAP SC #2 phrase "0 callers post-magic-purge" was true at end of Phase 07.2 but is no longer true on master — Phase 08 SaveSlotDialog (slot-name collision) re-introduced a legitimate non-magic caller.
- v1.0-MILESTONE-AUDIT.md tech_debt 07.2 line 42 ("Orphan ConfirmDialog primitive (0 callers post-magic-purge)") is stale and should be struck in a future doc-only housekeeping pass — that is out of scope for this orphan-sweep plan, which is forbidden from touching audit text by zero-diff gates.

**No source edits in Task 1.** confirm-dialog.tsx and the app.css block at line 1238 remain byte-identical.

## Task 2: prestige-gate-build.ts dead-code excision

(filled in after task execution)

## Task 3: level-sub-steps.tsx aria-label fix

(filled in after task execution)

## Task 4: cli.ts 2DA-parse gating

(filled in after task execution)

## Verification

(filled in after all tasks execute)
