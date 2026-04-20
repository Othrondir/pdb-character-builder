# Phase 12.7 — UAT-2026-04-20 Post-12.6 Residuals (INSERTED)

## Goal

Close 7 findings (F1..F7) surfaced in agent-driven UAT against master 2026-04-20 immediately after Phase 12.6 closure. F7 is a BLOCKER (user cannot advance from L1 → L2 because `LevelEditorActionBar` mounts only inside the Progresión-Clase sub-step host, not as a stepper-global footer).

## Findings Reference

`.planning/UAT-FINDINGS-2026-04-20-post-12.6.md` (commit `34b84db`)

| ID | Severity | Summary |
|----|----------|---------|
| F1 PROG-LABEL | minor | Pills jam without separators in level-progression-row header |
| F2 SKILL-SCROLL | major | Habilidades sub-step opens scrolled mid-list |
| F3 SKILL-DUP-EXPLANATION | minor | Per-row "Clase"/"Transclase" labels duplicate section headers |
| F4 SKILL-OVER-ALLOC | major | `+` allows over-spend (`Puntos restantes: -1`); no gate |
| F5 SKILL-CARRYOVER | minor | No ≤4 carryover to next level (data-blocked on Puerta source) |
| F6 SKILL-INT-MOD-FORMULA | minor | L1 ×4 verified; L2+ pending |
| F7 FEAT-CONFUSING + ADVANCE-MISSING | **BLOCKER** | LevelEditorActionBar mounts only on Clase sub-step |

## Entry

Next step: `/gsd-spec-phase 12.7` to lock falsifiable requirements, then `/gsd-discuss-phase 12.7` for gray areas (advance-bar host-mount choice, skill carryover semantics, Dotes UX redesign).
