---
status: descoped
phase: 07-magic-full-legality-engine
source:
  - 07-01-SUMMARY.md
  - 07-02-SUMMARY.md
  - 07-03-SUMMARY.md
  - 07-04-SUMMARY.md
  - 07-05-SUMMARY.md
started: 2026-04-17T13:00:00Z
updated: 2026-04-17T19:56:00Z
descoped_by: 07.2-magic-ui-descope
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running Vite dev server. Clear browser state for localhost:5173. Run `pnpm --filter @nwn1-character-builder/planner dev` from repo root. Planner loads at http://localhost:5173/ without console errors. Spanish shell renders: step nav shows Origen / Atributos / Construcción / Resumen. No red validation spinner on blank build.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running Vite dev server. Clear browser state for localhost:5173. Run `pnpm --filter @nwn1-character-builder/planner dev` from repo root. Planner loads at http://localhost:5173/ without console errors. Spanish shell renders: step nav shows Origen / Atributos / Construcción / Resumen. No red validation spinner on blank build.
result: [pending]

### 2. Wizard Spellbook Paradigm
expected: Build a Human Wizard level 1 (Con/Int baseline stats, no restricted race). Navigate to Construcción → level 1 → sub-step "Magia". MagicBoard renders with spellbook paradigm: left pane shows spell-level tabs 0..1 (wizard starts with level-0 and level-1), detail panel on right. Spells list in Spanish. No "Ya conocido" grey-outs for fresh build.
result: [pending]

### 3. Sorcerer Known-Spells + Swap Cadence
expected: Build Human Sorcerer level 4. At level 1-3, MagicBoard shows known-spells paradigm (add/remove up to the known-spells cap). At level 4, SwapSpellDialog becomes reachable (sorcerer swap level per SORCERER_SWAP_LEVELS = {4,8,12,16}). Click swap: dialog shows step 1 (forget) with Aceptar disabled until a spell is selected, step 2 (learn) same gating, step 3 confirm. Swap persists after closing.
result: [pending]

### 4. Cleric Level 1 Domain Picker
expected: Build Cleric level 1. Sub-step Magia shows domain paradigm with 2-column DomainTileGrid. Exactly 2 domains selectable (MAX_DOMAINS_PER_CLERIC = 2). Selecting a third deselects or blocks. All 27 domains render with Spanish names and grantedFeatIds populated (no blank power icons). Advancing to level 2 without 2 domains leaves repair state flagged.
result: [pending]

### 5. Cleric Level 2+ Prepared Summary
expected: On Cleric level 2+, sub-step Magia switches away from the domain picker to the prepared-summary paradigm. Domain selection from level 1 stays locked (not editable at L2+). Prepared-summary view shows spell-slot totals for levels available at current caster level.
result: [pending]

### 6. Non-Caster Hides Magia Sub-Step (D-02)
expected: Build Fighter level 1. At Construcción → level 1, the level-sub-steps strip shows Clase / Estadísticas / Habilidades / Dotes but NOT Magia. Multiclass Fighter-1/Wizard-2: at Fighter level, Magia hidden; at Wizard level, Magia visible.
result: [pending]

### 7. Bard Known-Spells + Swap at Level 5
expected: Build Bard level 5. Known-spells paradigm visible at levels 1-4. At level 5, SwapSpellDialog accessible (BARD_SWAP_LEVELS = {5,8,11,14}). Outside cadence levels (e.g. level 6), swap UI disabled or absent with Spanish rationale "swapOutOfCadence".
result: [pending]

### 8. Multiclass Cleric Domain Dispatch (WR-01)
expected: Build Fighter level 1 then Cleric level 2 (character-level 2, cleric-level 1). At character-level 2, sub-step Magia shows DomainTileGrid (domain picker), NOT prepared-summary. Domain picker triggers on first cleric level regardless of character level.
result: [pending]

### 9. Character-Sheet Magic Tab
expected: On any caster build, character sheet (right rail or Resumen screen) shows a "Conjuros" tab. Tab renders `{N} conjuros` header in Spanish. If any spell is illegal/blocked, additional `{invalid} magia no válida` counter appears. Per-class spell groups render with status classes (legal/illegal/blocked). Tab is read-only — no edit controls leak in.
result: [pending]

### 10. Shell Summary Severity Reflects Magic State
expected: Build Wizard level 3 with incomplete spell selections (missing required spells or pending slots). Shell summary strip shows repair_needed severity (amber / repair icon) and surfaces the magic issue. Fix selections → severity clears. Introduce illegal selection (e.g. spell outside eligibility) → severity escalates to illegal.
result: [pending]

### 11. Sorcerer Spell Catalog Coverage (WR-04 regression)
expected: Build Sorcerer level 1. MagicBoard known-spells list shows level-0 and level-1 sorcerer spells — non-empty catalog. Spot-check: at least 10 level-1 spells visible (compiled-spells.ts now holds 232 sorcerer-tagged entries). No "catálogo vacío" blocked state from fail-closed gate.
result: [pending]

### 12. Druid / Paladin / Ranger Prepared-Summary Paradigm
expected: Build a Druid level 1 and separately a Paladin level 4 and Ranger level 4 (low-class-level casters still flagged as casters per D-04). Each shows prepared-summary paradigm in sub-step Magia. Paladin and Ranger remain casters even below typical spell-access level.
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0

## Gaps

[none yet]

---

## DESCOPED — 2026-04-17 (Phase 07.2)

All 12 tests above target the Phase 07 magic runtime (MagicBoard, DomainTileGrid, SwapSpellDialog, Conjuros tab, Magia sub-step). Phase 07.2 removed that entire vertical from the planner. The feature surface these tests verified no longer exists and the tests are obsolete.

Retained as historical record of the evaluation criteria the Phase 07 verification was aiming at, should magic ever be re-scoped. See `.planning/phases/07-magic-full-legality-engine/deferred-items.md` (DESCOPED trailer) for the full descope rationale and `.planning/phases/07.2-magic-ui-descope/` for the removal plans + verification evidence.
