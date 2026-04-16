# Phase 7: Magic & Full Legality Engine - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver Puerta-valid magic selection (domains, spellbook, known spells) across all casting classes and a full-build legality recomputation that prevents illegal or unsupported builds from being marked valid.

Scope:
- Domain selection for clerics (level 1, 2 domains, granted feats + bonus spell IDs per domain).
- Spell learning flows per casting paradigm: spellbook (wizard), known spells (sorcerer, bard), prepared casters (cleric, druid, paladin, ranger) where selection is applicable per Puerta rules.
- Full build recomputation on every store commit, cascading through origin → progression → skills → feats → magic → derived legality.
- Spanish explanations for domain/spell/rule rejections, sourced from the compiled catalog descriptions.

Out of scope (deferred or other phases):
- Sharing, persistence, exports (Phase 8).
- Multi-dataset mismatch UX (Phase 8).
- Per-encounter spell preparation or spell slots management at runtime (Puerta runtime concern, not planner).

</domain>

<decisions>
## Implementation Decisions

### Magic Selection Workflow (Area 1)
- **D-01:** Add a single `magia` sub-step to each level's stepper (alongside `class`, `skills`, `feats`). The sub-step renders only the magic UI relevant for the selected class at that level — domains when cleric level 1, spellbook additions for wizard, known spells for sorcerer/bard, auto-granted summaries for prepared casters. No separate top-level "Magia" route.
- **D-02:** The `magia` sub-step is hidden/disabled when the level's class has no casting progression.

### Casting Class Coverage (Area 2)
- **D-03:** MVP covers the full caster roster — cleric, wizard, sorcerer, druid, bard, paladin, ranger. The compiled `spellGainTables` already exposes slots and casterLevel for all of them; excluding classes would be artificial scope reduction.
- **D-04:** Prepared casters without selection surface (druid, paladin, ranger base) still render a summary of slot progression and granted abilities for the active level, but no selection UI.

### Recomputation Engine (Area 3)
- **D-05:** Full-build legality recomputes automatically on every zustand store commit via shared pure selectors over the compiled catalogs. No explicit "recomputar" action.
- **D-06:** Upstream changes cascade into downstream repair markers (same pattern as Phase 04 progression, Phase 05 skills, Phase 06 feats) — later levels/spells/feats are preserved but marked invalid/blocked until the user repairs. Never auto-delete downstream selections.
- **D-07:** Recomputation latency target: < 50ms for a level-16 build on a commit touching origin/class/attributes. Must stay off the main render path.

### Legality Enforcement Policy (Area 4)
- **D-08:** Hybrid block model —
  - **Hard block:** hard prerequisites (class level requirements, alignment restrictions, race restrictions, ability prerequisites for feats, spell prereq chains) — the `+`/add button is disabled; the selection cannot be committed.
  - **Soft block (repair-required):** runtime capacity violations (spell slot overflow, known-spell overflow, domain mismatch after class change, skill overspend from Phase 05 pattern) — state is preserved, marked rojo with inline reason, and the build is gated from share/export until repaired.
- **D-09:** Shell summary severity respects the established priority: `foundation → progression → skills → feats → magic`. Magic legality contributes a new severity tier between feats and export-ready.
- **D-10:** VALI-01 is satisfied by the export/share gate, not by forcing hard blocks on every runtime capacity issue. A build with soft blocks is never presented as valid — the shell summary, route banners, and export routes all reflect the `illegal` or `repair_needed` severity.

### Rule Explanation Presentation (Area 5)
- **D-11:** Right-side detail panel pattern (same as Phase 03 origin selectors). Click on a spell/domain row selects it AND surfaces full Spanish description in the detail panel.
- **D-12:** Short rejection reasons (VALI-02 "explicaciones precisas y legibles") render inline below the row in red/amber. Full prereq breakdown appears in the detail panel when the row is selected.
- **D-13:** All user-facing magic copy (names, descriptions, rejection messages) comes from the compiled catalogs (`compiled-domains.ts`, `compiled-spells.ts`) which are already Spanish via the Phase 05.1 extractor. Hand-authored override strings only for legality messages not present in catalog data (e.g., "Ranura nivel 3 agotada: reduce o elimina una selección").

### Spell List Mutation Semantics (Area 6)
- **D-14:** Per-level editable. Each level's selection lives in its own store slice keyed by `level + kind` (spellbook add, spells known, domains selected). Editing level N does not require returning to level 1.
- **D-15:** Spontaneous casters (sorcerer, bard) expose a "Cambiar conjuro conocido" (swap) action on levels that allow swap per NWN EE rules (sorcerer 4, 8, 12, 16; bard 5, 8, 11, 14). The swap action is an explicit affordance, not an implicit edit.
- **D-16:** Wizard spellbook additions at level N are forget-and-replace via explicit "Eliminar del grimorio" control (not silent overwrite).
- **D-17:** Cascade repair (from D-06) applies: upstream class change that invalidates previously selected magic marks the downstream levels as `repair_needed`, preserving user work.

### Claude's Discretion
- Internal module layout within `packages/rules-engine` and `apps/planner/src/features/magic` — planner/executor decide file structure following Phase 05/06 precedent (selectors, store slice, board component, sheet tab).
- Exact React component split (FeatBoard-style vs SkillBoard-style) — planner decides based on density and interaction pattern needs.
- Cache/memoization strategy for derived magic legality selectors — keep deterministic, no cross-render state.
- Telemetry or debug logging surface — none required; no observability decision in scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — phase requirement list; pending for Phase 7: MAGI-02, MAGI-03, VALI-01, VALI-02, VALI-03. Already complete: LANG-02, MAGI-01, MAGI-04, VALI-04 (must not regress).

### Prior phase contracts
- `.planning/phases/03-character-origin-base-attributes/03-*-SUMMARY.md` — origin detail-panel pattern to reuse for magic row descriptions (D-11).
- `.planning/phases/04-level-progression-class-path/04-*-SUMMARY.md` — cascade repair semantics reference for D-06, D-17.
- `.planning/phases/05-skills-derived-statistics/05-*-SUMMARY.md` — soft-block + repair-required pattern for skills overspend; template for D-08 runtime violations.
- `.planning/phases/06-feats-proficiencies/06-*-SUMMARY.md` — feat prerequisite engine + Spanish rejection reason rendering; closest analog for magic prereqs.
- `.planning/phases/05.2-ux-overhaul-inserted/05.2-UI-SPEC.md` — shell stepper + sub-step layout that must host the new `magia` sub-step (D-01).

### Compiled catalogs
- `apps/planner/src/data/compiled-domains.ts` — domain catalog with per-level `spellIds` and `grantedFeatIds` (MAGI-01 foundation).
- `apps/planner/src/data/compiled-spells.ts` — spell catalog + `spellGainTables` per class with slot counts per casterLevel (MAGI-04 foundation; feeds MAGI-03).
- `apps/planner/src/data/compiled-classes.ts` — class table with caster flags and known-spell progression references (feeds MAGI-02 wiring).
- `packages/data-extractor/src/contracts/domain-catalog.ts` — Zod schema source of truth for DomainCatalog shape.
- `packages/data-extractor/src/contracts/spell-catalog.ts` — Zod schema source of truth for SpellCatalog shape.

### State + selectors
- `apps/planner/src/state/planner-shell.ts` — shell store, activeLevelSubStep dispatch; `magia` sub-step must be added to `LevelSubStep` union and routed in `center-content.tsx`.
- `apps/planner/src/lib/sections.ts` — `levelSubSteps` catalog (add `magia`).
- `apps/planner/src/components/shell/center-content.tsx` — switch statement that maps active sub-step to board; add MagicBoard case.

### Project instructions
- `CLAUDE.md` — project tech stack contract (React 19.2.3, TypeScript 5.9.2 strict, Zustand 5.0.10, Zod 4.3.5, Vitest 4.0.16). Rules engine must stay framework-agnostic; no React imports in `packages/rules-engine`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SkillBoard` (apps/planner/src/features/skills/skill-board.tsx) — unified scrollable board with section headers + per-row steppers; direct template for spell-list surface.
- `FeatBoard`/`FeatDetailPanel` (apps/planner/src/features/feats/*) — search + prerequisite rejection pattern; direct template for spell search + rejection reasons (VALI-02).
- `OriginBoard` detail panel layout (Phase 03) — template for D-11 magic detail panel.
- Stepper sub-step infrastructure (`components/shell/level-sub-steps.tsx`, `stepper-step.tsx`) already supports arbitrary sub-step count; add `magia` entry and it renders.
- `scroll-snap-type: y proximity` + bottom-frame padding pattern from `.skill-board` (app.css, post phase 05 UAT fix) — reuse directly for magic board to avoid the same bottom-clip bug.

### Established Patterns
- Pure-selector recomputation from zustand state (Phase 04/05/06) — magic legality selectors must follow the same `(state) => derived` shape.
- Cascade repair severity enum (legal/blocked/illegal/pending) from `state/planner-shell.ts` — extend with a `repair_needed` case if not already present for magic scope.
- Compiled-catalog-first data access: never read strings from constants, always from `compiled-*.ts` → extractor contract → raw server data.
- Zod parsing at catalog boundary only (`domainCatalogSchema.parse(...)` already called in compiled files).

### Integration Points
- `packages/rules-engine/src/magic/` — new module; domain rules, spell learning rules, legality aggregator.
- `apps/planner/src/features/magic/` — new feature folder; store slice, selectors, boards, detail panel.
- `apps/planner/src/components/shell/center-content.tsx` — route `activeLevelSubStep === 'magia'` to `<MagicBoard />`.
- Shell summary severity composer — extend to fold magic legality into the existing foundation→progression→skills→feats chain.
- Export/share gate (prepares Phase 8 handoff) — must check `magicLegality === 'legal'` before enabling share affordance.

</code_context>

<specifics>
## Specific Ideas

- Domain detail shown must include the granted feat list AND the bonus spell list per level, both present in `compiled-domains.ts`.
- Wizard spellbook at level 1: 3 + INT mod cantrips known + (3 + INT mod) 1st-level spells. Use extractor-provided initial-known tables, not hardcoded numbers.
- Sorcerer/Bard swap levels per NWN EE rules (sorcerer: 4, 8, 12, 16; bard: 5, 8, 11, 14) — confirm via `spellGainTables` or add to extractor contract as explicit `swapLevels` field if missing.
- Paladín/Explorador casting starts at class level 4 (not 1) in NWN. Planner must respect that — empty magic state for levels 1-3 as a Paladin.
- Rejection reason strings should mirror Phase 06 feat rejection style: short inline ("Requiere Hechicero nivel 5"), detailed in panel.

</specifics>

<deferred>
## Deferred Ideas

- Cross-dataset build validation UX — Phase 8 (SHAR-02 mismatch handling).
- Per-day prepared spell configuration (player-facing runtime decision) — not a planner concern.
- Scribing cost / gold tracking for wizard spellbook — out of planner scope.
- Metamagic feat integration deep-dive — Phase 6 feats module already surfaces feats; magic phase only needs to honor slot cost modifiers if a selected feat declares them via compiled catalog. Extended metamagic UI deferred.
- Spell VFX or iconography — visual asset layer deferred; Phase 7 uses text-only rows + descriptions (matches prior phases).

</deferred>

---

*Phase: 07-magic-full-legality-engine*
*Context gathered: 2026-04-16*
