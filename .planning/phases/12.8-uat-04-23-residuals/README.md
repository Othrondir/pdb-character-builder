# Phase 12.8 — UAT-2026-04-23 Residuals (INSERTED)

## Goal

Close 6 findings (F1..F6) surfaced by agent-driven UAT against master 2026-04-23 (post Phase 12.7). Two highest-impact items: F1/F2 Habilidades `scroll-snap` regression (carries Phase 12.7 T3 deferral — real scroller is `.selection-screen__content` not `.skill-sheet`, plus `app.css:473-477` snap rules override programmatic scrollTop) and F3 Dotes multi-slot viewport nudge (user cannot reach the general slot after the class-bonus slot fills because viewport stays on the class section).

## Findings Reference

- `.planning/UAT-FINDINGS-2026-04-23.md`
- `.planning/phases/12.7-uat-04-20-post-12.6-residuals/12.7-UAT.md` (T3 gap deferral)

| ID | Severity | Summary |
|----|----------|---------|
| F1 | major | Habilidades opens at `scrollTop=206` — `scroll-snap-type: y proximity` snaps past header |
| F2 | major | `+`/`-` jitter — same snap re-evaluates on each React commit |
| F3 | major | Dotes: filling class slot does not surface general slot (viewport locked on class section) |
| F4 | major | Dotes: cannot deselect after completion — `<FeatSummaryCard>` chips not toggleable |
| F5 | minor | Prestige gate: `pale-master` + `caballero-arcano` FAIL-OPEN; `shadowdancer` too permissive (BAB-only) |
| F6 | minor | Race roster: Semielfo duplicated (45 rows, should be 44) |

## Fixture

Elfo + Neutral puro + Atributos default (FUE 8 DES 10 CON 6 INT 8 SAB 8 CAR 8) + Guerrero L1. Clean `localStorage.clear() + indexedDB.deleteDatabase` + reload on `localhost:5173`.

## Entry

Next step: `/gsd-spec-phase 12.8` to lock falsifiable requirements, then `/gsd-discuss-phase 12.8` for gray areas (F3 resolution choice: auto-scroll vs collapse-on-complete vs viewport-nudge banner; F4 resolution choice: per-chip × button vs no-collapse-on-same-substep vs whole-chip-toggle; F5 fail-closed tightening heuristic).
