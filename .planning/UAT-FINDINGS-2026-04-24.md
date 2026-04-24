---
title: UAT Findings 2026-04-24 — Dotes UX Sweep + L1 Copy
status: resolved
fixture: "Elfo + Neutral puro + Atributos default + Guerrero L1 — clean localStorage + IndexedDB, reload localhost:5173"
executor: agent-driven MCP Chrome (tab 761727061)
spawned_from: Phase 12.8 live re-UAT after F3 RAF fix
---

# UAT Findings 2026-04-24

Live re-sweep surfaced 13 UX defects after Phase 12.8 closed. All fixed inline on master; no formal phase phase gate opened because edits are small and scoped.

## Findings Table

| ID | Area | Severity | Finding | Fix Commit |
|----|------|----------|---------|------------|
| E1 | Clase L1 | minor | Prestige rows show redundant `Disponible a partir del nivel 2` under every row | `9d7d2f0` |
| E2 | Habilidades | major | +/- click reshuffled skill rows (status-tier sort re-ordered rank-flipped rows) | `2fe773a` |
| E3 | Dotes | major | Extractor-artifact labels surfaced to players (`(PB) …`, `Herramienta …`, `WeapFocSap`) | `e0708e1` |
| E4 | Dotes | major | `Competencia con arma X` / `Crítico mejorado X` / `Defensa arcana X` / `Resistencia a la energía X` rendered as 20+ near-duplicate rows each | `e0708e1`, `0e066fd` |
| E5 | Dotes | minor | Brown side-gutters on `aside.feat-sheet` — rows only ~230px of 300px panel width | `e0708e1` |
| E6 | Dotes | minor | `Pendiente` pill on `Dote general 2` slot card overflowed card edge | `e0708e1` |
| E7 | Dotes | minor | Section heading (`Dotes generales`) first letter grazing group gold border | `9b72774` |
| E8 | Dotes | minor | Counter note (`1/2 dotes generales elegidas`) had negative margin-top, overlapping heading row | `744a6cf`, `e8b2531` |
| E9 | Dotes | minor | Family pill copy rename `{N} objetivos` → `Seleccionar tipo`; added synthetic families for Defensa arcana + Resistencia energía | `0e066fd` |
| E10 | Dotes | minor | `Dotes del nivel N: X/Y` text flush with its gold separator | `0e066fd` |
| E11 | Dotes | minor | `Disponibles` / `No disponibles` partition headings flush with partition edge | `3f5e641` |
| E12 | Dotes | minor | Chosen rows (`--chosen`) gold border flush with group gold border (double-border feel) + `ImpCritSap` extractor stub surfaced | `863f0c7` |
| E13 | Dotes | minor | Section header pill (`Ahora` / `Elegida`) still tight against group edge; family pills could overflow narrow rows | `6692a5a` |

## Files touched

- `apps/planner/src/features/feats/feat-sheet.tsx` (E3/E4 pipeline — drop search UI, split partitions, render families)
- `apps/planner/src/features/feats/selectors.ts` (E3/E4/E9 filter + synthetic family prefixes)
- `apps/planner/src/features/feats/feat-search.tsx` (deleted — search removed)
- `apps/planner/src/features/level-progression/class-picker.tsx` (E1 reason-kind suppression)
- `apps/planner/src/features/skills/selectors.ts` (E2 alphabetical-only sort)
- `apps/planner/src/lib/copy/es.ts` (E9 + partition headings copy)
- `apps/planner/src/styles/app.css` (E5..E13 layout/spacing)
- `tests/phase-12.4/class-picker-grouping.spec.tsx` (E1 assertion update)
- `tests/phase-12.4/feat-family-expander.spec.tsx` (E9 assertion update)

## Baseline preservation

- Vitest full: 2133 pass / 6 pre-existing fail / 0 new regressions.
- Playwright phase-12.8: 9/9 pass.
- Typecheck: 2 pre-existing errors, unchanged.

## Cross-reference

- Parent phase: `.planning/phases/12.8-uat-04-23-residuals/` (closed 2026-04-24).
- Playwright harness + naming contract inherited from Phase 12.8-01.
- Synthetic family mechanism extends `groupIntoFamilyEntries` without touching extractor output (`compiled-feats.ts` unmodified).

## Acceptance

Live-browser re-verification against the locked fixture:

- E1: Clase L1 prestige rows render with no `em.class-picker__reason` element.
- E2: Clicking +/- on any `Habilidades` row holds row position at `rectDelta=0`.
- E3: No `(PB)`, `Herramienta`, `WeapFocSap`, `ImpCritSap` labels in DOM.
- E4: 2 synthetic family rows for competencia, crítico-mejorado, defensa-arcana, resistencia-energía (4 new family rows) with pill "Seleccionar tipo".
- E5: `aside.feat-sheet` rows span ~286px of 300px panel.
- E6: `Dote general 2` card pill wraps below title when too narrow.
- E7..E13: every `.feat-board__section-header`, `.feat-picker__counter`, `.feat-picker__partition`, `.feat-picker__partition-heading`, and `.feat-board__section-note` carries symmetric 8px horizontal padding; pills never graze the group border.
