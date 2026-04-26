# Roadmap: NWN 1 Character Builder

## Milestones

- ✅ **v1.0 MVP** — Phases 1-15 (shipped 2026-04-26) — see `.planning/milestones/v1.0-ROADMAP.md`
- 📋 **v1.1** — Phase 16 + carry-forward UAT residuals (planned)

## Phases

<details>
<summary>✅ v1.0 MVP — SHIPPED 2026-04-26 (27 phases / 99 plans)</summary>

- [x] Phase 1: Canonical Puerta Dataset (3/3) — 2026-03-30
- [x] Phase 2: Spanish-First Planner Shell (3/3) — 2026-03-30
- [x] Phase 3: Character Origin & Base Attributes (2/2) — 2026-03-30
- [x] Phase 4: Level Progression & Class Path (3/3) — 2026-03-30
- [x] Phase 5: Skills & Derived Statistics (4/4) — 2026-03-31
- [x] Phase 5.1: Data Extractor Pipeline (INSERTED) (5/5) — 2026-04-15
- [x] Phase 5.2: UX Overhaul (INSERTED) (8/8)
- [x] Phase 6: Feats & Proficiencies (2/2)
- [x] Phase 7: Magic & Full Legality Engine — Superseded by Phase 07.2
- [x] Phase 7.1: Shell Narrow Viewport Nav Fix (INSERTED) (1/1) — 2026-04-17
- [x] Phase 7.2: Magic UI Descope (INSERTED) (14/14) — 2026-04-17
- [x] Phase 8: Summary, Persistence & Shared Builds (6/6) — 2026-04-18
- [x] Phase 9: Verification + Traceability Closure (GAP) (6/6) — 2026-04-18
- [x] Phase 10: Integration Fixes (GAP) (3/3) — 2026-04-18
- [x] Phase 11: UAT + Open-Work Closure (GAP) (3/3) — 2026-04-18
- [x] Phase 12: Tech Debt Sweep (GAP) (2/2) — 2026-04-18
- [x] Phase 12.1: Roster Wiring & Overflow Fixes (INSERTED) (3/3) — 2026-04-18
- [x] Phase 12.2: Roster Detail & Race Ability Modifiers (INSERTED) (4/4) — 2026-04-18
- [x] Phase 12.3: UAT Correctness Closure (INSERTED) (6/6) — 2026-04-19
- [x] Phase 12.4: Construcción Correctness & Clarity (INSERTED) (9/9) — 2026-04-20
- [x] Phase 12.6: UAT-2026-04-20 Residuals (INSERTED) (10/10) — 2026-04-20
- [x] Phase 12.7: UAT-2026-04-20 Post-12.6 Residuals (INSERTED) (4/4) — 2026-04-20
- [x] Phase 12.8: UAT-2026-04-23 Residuals (INSERTED) (4/4) — 2026-04-24
- [x] Phase 12.9: Resumen (Hoja de personaje) UX Pass (INSERTED) (2/2) — 2026-04-24
- [x] Phase 13: Verification + Orphan Sweep (GAP) (7/7) — 2026-04-24
- [x] Phase 14: Persistence Robustness (GAP) (6/6) — 2026-04-25
- [x] Phase 15: A11y + Modal Polish (GAP) (3/3) — 2026-04-26

Full phase detail: `.planning/milestones/v1.0-ROADMAP.md`.

</details>

### 📋 v1.1 — Planned

- [ ] Phase 16: Feat Engine Completion (GAP) — close Phase 06 bonus-feat TODOs (`feat-eligibility.ts` L45+L49) + Phase 12.4 Humano L1 store-capacity gap (2→3 feat slots).

Carry-forward residuals (to be triaged into v1.1 phases via `/gsd-new-milestone`):
- A1 point-buy cost per race (blocked on extractor enrichment or Puerta snapshot override)
- P5 level-table redesign (open-ended UX)
- 3 untracked quick-task workspace dirs from 2026-04-25 (q1m, qzv, r5j) — review first
- Nyquist VALIDATION.md coverage 4/27 (systemic process gap; no correctness impact)
- DEF-12.4-02 pre-existing font-weight:700 at app.css:113 (design-token hygiene backlog)
- @playwright/test missing from package.json (Phase 12.4-09 SPEC R9 RTL fallback acknowledged)

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 27 | 99/99 | ✅ Shipped | 2026-04-26 |
| v1.1 | TBD | 0 | 📋 Planning | — |
