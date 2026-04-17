# Roadmap: NWN 1 Character Builder

## Overview

This roadmap starts by freezing a compiler-first, versioned Puerta rules contract from local NWN EE assets plus the local `nwsync` snapshot, then layers the static Spanish-first planner in the same order players actually build characters. The sequence keeps legality, dataset pinning, and GitHub Pages compatibility ahead of richer screens while still converging on the NWN2DB planner flow with an NWN1 visual identity.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Canonical Puerta Dataset** - Freeze the versioned rules contract, source precedence, and static-runtime data boundary.
- [x] **Phase 2: Spanish-First Planner Shell** - Deliver the NWN2DB-style screen flow as a static NWN1-themed shell in Spanish.
- [x] **Phase 3: Character Origin & Base Attributes** - Let players define race, alignment, deity, and starting stats with immediate restriction feedback.
- [x] **Phase 4: Level Progression & Class Path** - Build the editable level 1-16 progression timeline and class legality backbone.
- [ ] **Phase 5: Skills & Derived Statistics** - Add per-level skill allocation with server-specific enforcement and synchronized stats.
- [ ] **Phase 6: Feats & Proficiencies** - Model Puerta feat choices, proficiencies, and exact prerequisite failures.
- [ ] **Phase 7: Magic & Full Legality Engine** - Complete domains, spells, Spanish rules text, and full-build recomputation.
- [ ] **Phase 8: Summary, Persistence & Shared Builds** - Preserve and share exact dataset-pinned builds through local storage, JSON, and URLs.

## Phase Details

### Phase 1: Canonical Puerta Dataset
**Goal**: One versioned, provenance-aware Puerta rules dataset can feed the planner without runtime access to raw game assets.
**Depends on**: Nothing (first phase)
**Requirements**: VALI-04
**Success Criteria** (what must be TRUE):
  1. The project has a single source-precedence contract across base NWN EE data, the local Puerta `nwsync` snapshot, and manual overrides for script/forum-only exceptions.
  2. A compiled dataset manifest exists with stable IDs, `schemaVersion`, `datasetId`, hash, and provenance for every rules snapshot.
  3. Unsupported or conflicting rules are surfaced as explicit non-valid states instead of being silently treated as legal.
  4. The browser runtime is limited to compiled static assets, preserving GitHub Pages deployment and local-first use.
**Plans**: 3 plans

Plans:
- [x] 01-01: Freeze canonical schema, IDs, and source precedence
- [x] 01-02: Define dataset manifest, provenance, and override registry
- [x] 01-03: Define unsupported/conflict handling for ambiguous rules

### Phase 2: Spanish-First Planner Shell
**Goal**: Users can navigate a static Spanish-first planner shell that mirrors NWN2DB's main screens with an NWN1 visual identity.
**Depends on**: Phase 1
**Requirements**: LANG-01, FLOW-01, FLOW-02
**Success Criteria** (what must be TRUE):
  1. User can open the static planner and move between `Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, and `Utilities` areas in an NWN2DB-equivalent flow.
  2. User sees shell navigation, headings, and primary actions in Spanish.
  3. The planner looks intentionally NWN1-inspired rather than like a direct NWN2DB skin.
  4. The shell runs from compiled static assets with no backend dependency.
**Plans**: 3 plans

Plans:
- [x] 02-01: Build the SPA shell and route or state skeleton
- [x] 02-02: Implement Spanish-first navigation and screen framing
- [x] 02-03: Establish the NWN1 visual system for the shell
**UI hint**: yes

### Phase 3: Character Origin & Base Attributes
**Goal**: Users can define a legal Puerta character foundation before planning later levels.
**Depends on**: Phase 2
**Requirements**: CHAR-01, CHAR-02, CHAR-03, CHAR-04, ABIL-01
**Success Criteria** (what must be TRUE):
  1. User can choose race, subrace, alignment, and deity from Puerta-supported options.
  2. User can set starting attributes using the planner's supported creation rules.
  3. User sees incompatibilities caused by race, subrace, alignment, or deity before moving on.
  4. Origin choices remain coherent when later planner screens consume them.
**Plans**: 2 plans

Plans:
- [x] 03-01: Deliver identity selectors and base character state
- [x] 03-02: Enforce origin restrictions and starting-ability rules
**UI hint**: yes

### Phase 4: Level Progression & Class Path
**Goal**: Users can build and edit a stable level 1-16 class progression that respects Puerta class rules.
**Depends on**: Phase 3
**Requirements**: FLOW-03, ABIL-02, PROG-01, PROG-02, PROG-03, CLAS-01, CLAS-02, CLAS-03, CLAS-04
**Success Criteria** (what must be TRUE):
  1. User can build a full progression from level 1 to level 16 and inspect it level by level.
  2. User can add, remove, or revisit earlier levels without corrupting downstream state.
  3. User can choose Puerta base and prestige classes while seeing entry prerequisites before confirming a level.
  4. The planner blocks illegal multiclass combinations, minimum-class blocks, and known server exceptions while showing class gains at each level.
**Plans**: 3 plans

Plans:
- [x] 04-01: Build the level timeline and editable progression state
- [x] 04-02: Implement class catalogs, prerequisites, and per-level gains
- [x] 04-03: Enforce multiclass and progression-specific Puerta rules
**UI hint**: yes

### Phase 5: Skills & Derived Statistics
**Goal**: Users can allocate skills per level with server-accurate restrictions and synchronized derived stats.
**Depends on**: Phase 4
**Requirements**: SKIL-01, SKIL-02, SKIL-03
**Success Criteria** (what must be TRUE):
  1. User can assign skill ranks at each level using the selected class and current build state.
  2. The planner enforces class or cross-class costs, caps, and Puerta skill restrictions, including known heavy-armor or equivalent exceptions.
  3. Stats and derived totals remain synchronized with skill and progression changes.
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md — Define the compiled skill catalog, rules helpers, and raw skill store
- [x] 05-02-PLAN.md — Build the routed `Habilidades` editor over the shared skill selectors
- [x] 05-03-PLAN.md — Synchronize `Estadísticas` and the shell summary with skill evaluation
- [x] 05-04-PLAN.md — Gap closure: unified scrollable skill board with compact NWN1-style rows
**UI hint**: yes

### Phase 05.1: Data Extractor Pipeline (INSERTED)

**Goal:** Build the nwsync-to-compiled-JSON extraction pipeline that reads Puerta de Baldur server data directly from the local nwsync SQLite databases and produces typed, static TypeScript catalogs for all character-building data.
**Requirements**: LANG-02, FEAT-01, MAGI-01, MAGI-04
**Depends on:** Phase 5
**Plans:** 4/4 plans complete

Plans:
- [x] 05.1-01-PLAN.md — Bootstrap data-extractor package and implement core parsers (NSYC, TLK, 2DA)
- [x] 05.1-02-PLAN.md — Implement BIF/KEY parsers, base-game reader, and catalog Zod contracts
- [x] 05.1-03-PLAN.md — Build nwsync reader, TLK resolver, and core assemblers (classes, races, skills, deities)
- [x] 05.1-04-PLAN.md — Implement complex assemblers (feats, spells, domains) with cross-references
- [x] 05.1-05-PLAN.md — Build CLI orchestrator, run extraction, and wire planner imports

### Phase 05.2: UX Overhaul (INSERTED)

**Goal:** Rebuild the planner's navigation flow and layout density so the app is actually usable — guided wizard flow for character creation, compact information display, and clear visual hierarchy instead of an endless vertical scroll of identical cards.
**Requirements**: FLOW-01, FLOW-02
**Depends on:** Phase 5.1
**Plans:** 8/8 plans complete

Plans:
- [x] 05.2-01-PLAN.md — Design system foundation: dark NWN1 tokens, CSS overhaul, UI primitives (NwnFrame, NwnButton, ActionBar)
- [x] 05.2-02-PLAN.md — Shell state model, step definitions, creation stepper + level rail components
- [x] 05.2-03-PLAN.md — Center content primitives (SelectionScreen, OptionList, DetailPanel) + character sheet
- [x] 05.2-04-PLAN.md — Shell frame rewrite, router simplification, Phase 2 test updates
- [x] 05.2-05-PLAN.md — Feature board adaptation (origin, attributes, progression, skills) + dead code cleanup
- [x] 05.2-06-PLAN.md — Visual verification checkpoint (human approval)
- [x] 05.2-07-PLAN.md — Gap closure: remove deity references from 14 test files (24 failures)
- [x] 05.2-08-PLAN.md — Gap closure: dead CSS cleanup + feature file class name migration
**UI hint**: yes

### Phase 6: Feats & Proficiencies
**Goal**: Users can choose Puerta feats and proficiencies with exact prerequisite feedback.
**Depends on**: Phase 5
**Requirements**: FEAT-01, FEAT-02, FEAT-03, FEAT-04
**Success Criteria** (what must be TRUE):
  1. User can choose general, class, and Puerta custom feats that are available to the build at each level.
  2. User sees exact prerequisite failures and legality reasons before selecting a feat.
  3. Weapon, armor, and shield proficiencies reflect the server's custom splits and overrides instead of base NWN defaults.
  4. Feat selections remain coherent with earlier class, ability, and skill decisions.
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Rules engine (prerequisite evaluator, BAB calculator, eligibility filter, revalidation), zustand store, selectors, Spanish copy, and test suite
- [x] 06-02-PLAN.md — React UI components (FeatBoard, FeatSheet, FeatSearch, FeatDetailPanel, FeatSheetTab), CSS, shell wiring, and visual verification
**UI hint**: yes

### Phase 7: Magic & Full Legality Engine
**Goal**: Users can complete magic planning and trust the planner's full legality recomputation across the whole build.
**Depends on**: Phase 6
**Requirements**: LANG-02, MAGI-01, MAGI-02, MAGI-03, MAGI-04, VALI-01, VALI-02, VALI-03
**Success Criteria** (what must be TRUE):
  1. User can choose Puerta-supported domains, spells, known spells, and other magic selections according to class and level.
  2. User sees Spanish names and descriptions for classes, feats, spells, domains, and Puerta custom rules throughout the planner.
  3. Any build change triggers full recomputation of legality, prerequisites, and derived outcomes across the entire character.
  4. Illegal or unsupported selections are blocked with precise, readable explanations and the build is never presented as valid when rules are uncertain.
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — Rules engine magic module + extractor catalog remediation + BuildStateAtLevel migration + Wave 0 test scaffolding
- [x] 07-02-PLAN.md — Magic zustand store + multi-store selectors + MagicBoard/MagicSheet/MagicDetailPanel/SpellLevelTabs/DomainTileGrid/SpellRow/SwapSpellDialog
- [x] 07-03-PLAN.md — Magic-legality aggregator + shell severity projection + shellCopyEs.magic namespace + MagicSheetTab + shell wiring + jsdom smoke tests
**UI hint**: yes

### Phase 07.2: Magic UI descope (INSERTED)

**Goal:** Strip all magic UI, spell catalogs, and cleric-domain picker from the planner so the product surface matches the "Plantilla Base.xlsx" reference (Resumen Ficha / Caracteristicas&Dotes / Puntos de habilidad / Dotes) — characters are built with attributes, class progression, skills, and feats only.
**Depends on:** Phase 7
**Requirements**: FLOW-01, FLOW-02, LANG-01
**Success Criteria** (what must be TRUE):
  1. `apps/planner/src/features/magic/` is deleted and no import references it anywhere in `apps/planner` or `packages/*`.
  2. The character sheet's `Conjuros` tab is gone; sheet shows Estadísticas / Habilidades / Dotes only.
  3. The level stepper does not offer a `Magia` sub-step for any class (caster or non-caster); the D-02 conditional filter is removed.
  4. `packages/rules-engine/src/magic/` is deleted; nothing in the rules engine or planner selectors imports from it.
  5. `apps/planner/src/data/compiled-spells.ts` and `compiled-domains.ts` are deleted; the runtime no longer bundles spell or domain data.
  6. `tests/phase-07/` is deleted; no test file references magic, spells, domains, `aggregateMagicLegality`, `MagicSheetTab`, or `SwapSpellDialog`.
  7. `shellCopyEs.magic`, `shellCopyEs.stepper.levelSubSteps.spells`, and `shellCopyEs.sheetTabs.spells` are removed; `scripts/verify-phase-07-copy.cjs` is deleted.
  8. `PlannerValidationStatus.repair_needed` is removed unless a non-magic consumer remains (audit before removing).
  9. Extractor code for spells and domains (`packages/data-extractor/src/assemblers/spell-assembler.ts`, `domain-assembler.ts`) stays buildable but is no longer invoked by the default `pnpm extract` run.
  10. Full vitest suite passes after the purge; planner dev server boots; cold-load UAT (race → alignment → attributes → level 1 class pick) works without any magic references in console or UI.

**Plans:** 1/2 plans executed

Plans:
- [x] 07.2-01-PLAN.md — Runtime purge: delete magic dirs, compiled spell/domain catalogs, phase-07 tests, copy namespace; detach feats from magic; revert ConfirmDialog + PlannerValidationStatus; disconnect extractor spell/domain emit
- [ ] 07.2-02-PLAN.md — Catalog schema cleanup (drop minSpellLevel) + archive deferred-items + final verification checkpoint (build + vitest + dev server + human cold-load UAT)

### Phase 07.1: Shell narrow viewport nav fix (INSERTED)

**Goal:** At viewports ≤1023px the planner shell stays fully operable — the creation stepper (Origen / Progresión / Resumen / Utilidades) is reachable through a visible toggle and never leaves the user stranded on the Atributos step.
**Depends on:** Phase 7
**Requirements**: FLOW-01, FLOW-02
**Success Criteria** (what must be TRUE):
  1. At viewport widths ≤1023px, a visible Spanish-labeled toggle control opens the creation-stepper drawer and another affordance closes it.
  2. When the drawer is open, users can reach Raza, Alineamiento, Atributos, every Progresión level, Resumen, and Utilidades — no step is hidden behind an unreachable nav.
  3. Opening the drawer does not cover the active step content so that tapping outside or pressing Escape closes the drawer without destroying attribute or build state.
  4. Desktop layout (>1023px) remains unchanged: stepper column always visible, no toggle button rendered.
  5. Regression suite covers the narrow-viewport open/close flow (jsdom or Vitest component-level) so the hamburger never regresses silently again.

**Plans:** 1 plan

Plans:
- [ ] 07.1-01-PLAN.md — MobileNavToggle + store action + CSS scaffolding + jsdom regression specs

### Phase 8: Summary, Persistence & Shared Builds
**Goal**: Users can preserve, reload, and share an exact build snapshot pinned to its dataset version.
**Depends on**: Phase 7
**Requirements**: LANG-03, SHAR-01, SHAR-02, SHAR-03, SHAR-04, SHAR-05
**Success Criteria** (what must be TRUE):
  1. User can review a clear final summary of the complete build before handing it off.
  2. User can save and reload local builds without a backend.
  3. User can import or export JSON and share URL payloads that reproduce the same character decisions on another machine.
  4. Shared or imported builds expose their dataset or rules version and handle mismatches without silent revalidation drift.
**Plans**: 2 plans

Plans:
- [ ] 08-01: Build summary, local save or load, and JSON import or export
- [ ] 08-02: Implement URL sharing, dataset pinning, and mismatch handling
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 5.1 -> 5.2 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Canonical Puerta Dataset | 3/3 | Complete | 2026-03-30 |
| 2. Spanish-First Planner Shell | 3/3 | Complete | 2026-03-30 |
| 3. Character Origin & Base Attributes | 2/2 | Complete | 2026-03-30 |
| 4. Level Progression & Class Path | 3/3 | Complete | 2026-03-30 |
| 5. Skills & Derived Statistics | 3/4 | Gap closure | 2026-03-31 |
| 5.1 Data Extractor Pipeline | 5/5 | Complete | 2026-04-15 |
| 5.2 UX Overhaul | 8/8 | Complete | - |
| 6. Feats & Proficiencies | 2/2 | Complete | - |
| 7. Magic & Full Legality Engine | 0/3 | Not started | - |
| 8. Summary, Persistence & Shared Builds | 0/2 | Not started | - |
