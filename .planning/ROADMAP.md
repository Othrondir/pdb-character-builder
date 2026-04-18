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
- [x] **Phase 8: Summary, Persistence & Shared Builds** - Preserve and share exact dataset-pinned builds through local storage, JSON, and URLs.
- [x] **Phase 9: Verification + Traceability Closure** (GAP) - Close unverified phases (01, 02, 05.1), reclassify descoped requirements, reconcile REQUIREMENTS.md traceability.
- [x] **Phase 10: Integration Fixes** (GAP) - Close integration defects surfaced by milestone audit — attributes→level1 forward action, slot-load fail-closed parity, orphan shell `validationStatus` cleanup.
- [x] **Phase 11: UAT + Open-Work Closure** (GAP) - Close P06 human UAT, archive P05/P07 UAT files, resolve open debug + quick task.
- [x] **Phase 12: Tech Debt Sweep** (GAP) - Fix P03 typecheck errors, P07.2 IN-07 class-label bug (FEAT-02 quality), IN-03 label cleanup, IN-05 counter alignment.
- [ ] **Phase 12.1: Roster Wiring & Overflow Fixes** (INSERTED) - Wire compiled class + race catalogs (PDB TLK extractor roster) into L1 pickers and fix CSS overflow/scroll on SelectionScreen + planner-layout panels. Surfaced during Phase 11 UAT (2026-04-18).

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

**Plans:** 2/2 plans complete

Plans:
- [x] 07.2-01-PLAN.md — Runtime purge: delete magic dirs, compiled spell/domain catalogs, phase-07 tests, copy namespace; detach feats from magic; revert ConfirmDialog + PlannerValidationStatus; disconnect extractor spell/domain emit
- [x] 07.2-02-PLAN.md — Catalog schema cleanup (drop minSpellLevel) + archive deferred-items + final verification checkpoint (build + vitest + dev server + human cold-load UAT)

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

**Plans:** 1/1 plans complete

Plans:
- [x] 07.1-01-PLAN.md — MobileNavToggle + store action + CSS scaffolding + jsdom regression specs

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
- [x] 08-01: Build summary, local save or load, and JSON import or export
- [x] 08-02: Implement URL sharing, dataset pinning, and mismatch handling
**UI hint**: yes

### Phase 9: Verification + Traceability Closure (GAP)
**Goal**: Close unverified phases (01, 02, 05.1), supersede stale Phase 07 verification, reclassify descoped requirements, and reconcile REQUIREMENTS.md traceability so milestone v1.0 audit can pass cleanly.
**Depends on**: Phase 8
**Requirements**: VALI-04, LANG-01, LANG-02, FLOW-01, FLOW-02, VALI-02 (verification closures); CHAR-03, MAGI-01, MAGI-02, MAGI-03, MAGI-04 (descope reclassification); FEAT-02, FEAT-03, FEAT-04 (stale traceability)
**Gap Closure**: Closes all verification-only partials + descope reclassification gaps from v1.0-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. `01-VERIFICATION.md` exists and verifies VALI-04 goal-backward.
  2. `02-VERIFICATION.md` exists (or 07.2 transitive verification is explicitly accepted) covering LANG-01, FLOW-01, FLOW-02.
  3. `05.1-VERIFICATION.md` exists and verifies LANG-02, FEAT-01, MAGI-01, MAGI-04 data-pipeline claims (magic portion noted as descoped).
  4. `07-VERIFICATION.md` marked `superseded_by: 07.2` (not `gaps_found`).
  5. REQUIREMENTS.md reflects: CHAR-03 + MAGI-01..04 as descoped v1 → v2; VALI-02 explicit audit pass (non-magic satisfied, magic descoped); FEAT-02/03/04 as Complete.
  6. REQUIREMENTS.md coverage count shows 34 active v1 + 5 descoped with explicit mapping.
**Plans**: 2 plans

Plans:
- [x] 09-01: Produce missing VERIFICATION.md trio (01, 02, 05.1) via `/gsd-verify-work`
- [x] 09-02: Mark 07 superseded, reclassify descoped requirements, reconcile traceability + coverage

### Phase 10: Integration Fixes (GAP)
**Goal**: Close integration defects surfaced by milestone v1.0 integration check — recurring attributes→level1 blocker, slot-load fail-closed parity, and orphan shell aggregate state.
**Depends on**: Phase 8
**Requirements**: FLOW-01 (attributes forward action), SHAR-02 + SHAR-05 (loadSlot diffRuleset gate), VALI-01 (shell aggregate `validationStatus` cleanup or completion)
**Gap Closure**: Closes HIGH/MEDIUM/LOW integration gaps from v1.0-MILESTONE-AUDIT.md integration check
**Success Criteria** (what must be TRUE):
  1. `AttributesBoard` renders an ActionBar "Aceptar" action that advances to `setExpandedLevel(1)` + `setActiveLevelSubStep('class')` — creation wizard chain unbroken end to end.
  2. `LoadSlotDialog.onPick` calls `diffRuleset` before `hydrateBuildDocument` and routes mismatches through `VersionMismatchDialog`, matching the URL-share and JSON-import paths.
  3. `PlannerShellState.validationStatus` is either deleted (if unused) or wired to an aggregate severity surface — no orphan state.
  4. `origin-board.tsx` empty-string fallback is normalised to `null` in the foundation setters so downstream `buildDocumentSchema` never sees a raw `'' as CanonicalId`.
  5. Regression tests cover the three fixes (attributes→level1 advance, slot-load mismatch branch, shell aggregate state removal/use).
**Plans**: 3 plans

Plans:
- [x] 10-01: AttributesBoard ActionBar + forward action wiring (unblocks recurring attributes blocker)
- [x] 10-02: loadSlot diffRuleset gate + VersionMismatchDialog branch + regression tests
- [x] 10-03: Shell `validationStatus` cleanup + origin-board empty-string normalisation
**UI hint**: yes

### Phase 11: UAT + Open-Work Closure (GAP)
**Goal**: Close outstanding human UAT scenarios and archive open workflow artifacts (debug session, quick task, stale UAT files).
**Depends on**: Phase 10
**Requirements**: FEAT-01, FEAT-02, FEAT-03, FEAT-04 (P06 human UAT); SKIL-01..03 (P05 UAT close); descope reconciliation (P07 UAT)
**Gap Closure**: Closes human UAT debt + open debug/quick tasks from v1.0-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. P06 5-scenario human UAT run (FeatBoard visual flow, search accent-insensitive, Dotes tab grouping, revalidation markers, proficiency feats visibility) — all signed off.
  2. `05-HUMAN-UAT.md` closed with re-verification note (12/12 programmatic + layout pass).
  3. `07-UAT.md` marked descoped per Phase 07.2.
  4. `.planning/debug/guardar-slot-zoderror.md` verified (4f03865 fix confirmed) and closed.
  5. `.planning/quick/260414-gxx-ignorar-artefactos-locales-del-workspace/SUMMARY.md` written and quick task closed.
**Plans**: 3 plans

Plans:
- [x] 11-01: Run P06 5-scenario human UAT + archive P05/P07 UAT files
- [x] 11-02: Close debug session `guardar-slot-zoderror` (verify 4f03865 fix)
- [x] 11-03: Write SUMMARY.md for quick task `260414-gxx`
**UI hint**: yes

### Phase 12: Tech Debt Sweep (GAP)
**Goal**: Clear documented tech debt surfaced by audit so milestone v1.0 can close without known defects leaking into v2.
**Depends on**: Phase 8
**Requirements**: FEAT-02 (user-visible class-label bug IN-07 degrades FEAT-02 quality)
**Gap Closure**: Closes tech debt items from v1.0-MILESTONE-AUDIT.md (P03 typecheck, P07.2 IN-03/05/07)
**Success Criteria** (what must be TRUE):
  1. `tests/phase-03/foundation-validation.spec.ts` compiles without the 3 DeityRuleRecord[] vs branded CanonicalId typecheck errors (tests still pass).
  2. `getClassLabel` helper in `packages/rules-engine/src/feats/feat-prerequisite.ts` looks up class IDs in CLASSES (not FEATS) — FEAT-02 class-prerequisite labels render Spanish class names, not raw canonical IDs.
  3. `FEAT_CATEGORY_LABELS` no longer maps `'3' → 'Arcana'` or `'15' → 'Divina'` — magic-flavoured feat chips gone.
  4. `[N/7]` extract-progress counters align when `EMIT_MAGIC_CATALOGS=0` (cosmetic, default run state).
**Plans**: 2 plans

Plans:
- [x] 12-01: Fix P03 typecheck errors + P07.2 IN-07 getClassLabel bug (user-visible) — Completed 2026-04-18 (commits: 6920be9 RED / 2bbc9cf GREEN / 43ae985 Bug 1)
- [x] 12-02: Drop P07.2 IN-03 magic feat labels + align IN-05 extract counters — Completed 2026-04-18 (commits: 305f51c Bug 3 / 4b34bbe RED / cf05b9f GREEN+hygiene)

### Phase 12.1: Roster Wiring & Overflow Fixes (INSERTED)
**Goal**: Planner UI consumes the full PDB TLK extractor roster for classes and races, and scrollable panels expose their overflow so no information is clipped.
**Depends on**: Phase 05.1 (extractor output), Phase 05.2 (shell layout)
**Requirements**: FEAT-01 (correct class selection surface), RACE-01..n (race picker completeness), SHEL-01 (shell usability — no clipped panels)
**Gap Closure**: Closes UAT observations surfaced during Phase 11 browser walk-through (2026-04-18): L1 class picker rendered 7 entries vs full PDB roster; race picker rendered 3 parent races with only 2 subrace dropdowns; SelectionScreen + planner-layout center lack `overflow-y: auto` and clip content.
**Success Criteria** (what must be TRUE):
  1. The L1 class picker renders exactly the set of classes emitted by the PDB extractor into `compiled-classes` — no hand-trimmed subset, no NWN1-canon extras. `selectClassOptionsForLevel` does not filter below the compiled roster for base classes.
  2. The race picker renders every parent race emitted by the PDB extractor into `compiled-races`, with subraces attached to their parents per the compiled hierarchy. `phase03FoundationFixture.races` (or its replacement) sources from the compiled catalog, not from a hand-authored array.
  3. SelectionScreen, planner-layout center, and any other panel whose content exceeds the viewport exposes `overflow-y: auto` (or equivalent) so the user can scroll to see the full list. No panel clips content silently.
  4. A regression test (or negative grep) asserts that the class + race catalogs are wired through the full data path; a manual UAT re-run of Phase 11 scenarios 1 + 4 succeeds against the expanded roster.
**Plans**: 3 plans (planned)

Plans:
- [ ] 12.1-01: Wire PDB class roster into L1 picker (verify compiled catalog ≡ extractor output)
- [ ] 12.1-02: Wire PDB race roster + subrace hierarchy into race picker
- [ ] 12.1-03: Restore overflow-y scroll on SelectionScreen + planner-layout panels

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 5.1 -> 5.2 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 12.1

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
| 7. Magic & Full Legality Engine | Descoped | Superseded by Phase 07.2 | - |
| 07.2 Magic UI descope (INSERTED) | 2/2 | Complete | 2026-04-17 |
| 07.1 Shell narrow viewport nav fix (INSERTED) | 1/1 | Complete   | 2026-04-17 |
| 8. Summary, Persistence & Shared Builds | 2/2 | Complete | 2026-04-18 |
| 9. Verification + Traceability Closure (GAP) | 0/2 | Pending | - |
| 10. Integration Fixes (GAP) | 0/3 | Pending | - |
| 11. UAT + Open-Work Closure (GAP) | 0/3 | Pending | - |
| 12. Tech Debt Sweep (GAP) | 2/2 | Complete | 2026-04-18 |
