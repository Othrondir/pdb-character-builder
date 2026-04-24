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
- [x] **Phase 12.1: Roster Wiring & Overflow Fixes** (INSERTED) - Wire compiled class + race catalogs (PDB TLK extractor roster) into L1 pickers and fix CSS overflow/scroll on SelectionScreen + planner-layout panels. Surfaced during Phase 11 UAT (2026-04-18).
- [x] **Phase 12.2: Roster Detail & Race Ability Modifiers** (INSERTED) - Surface TLK descriptions in race + class picker detail panes, wire race ability modifiers (CHAR-02 pipeline gap) through attributes computation, fix prestige-filter false positives/negatives at L1, and dedupe class-catalog duplicate IDs. Surfaced during Phase 12.1 UAT (2026-04-18).
- [x] **Phase 12.3: UAT Correctness Closure** (INSERTED) - Close 9 blockers surfaced by deep UAT (2026-04-18) before milestone v1.0: B1 attributes overspend, B2 multiclass level picker, B3 Dotes per-level gate, B4 slot count prompt, B5 description paragraphs, B6 HP pipeline, B7 origin stepper decoupling, B8/B9 header + sub-step ripples. Milestone v1.0 close blocked on B1/B2/B3/B6.

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
- [x] 12.1-01: Wire PDB class roster into L1 picker (verify compiled catalog ≡ extractor output)
- [x] 12.1-02: Wire PDB race roster + subrace hierarchy into race picker
- [x] 12.1-03: Restore overflow-y scroll on SelectionScreen + planner-layout panels

### Phase 12.2: Roster Detail & Race Ability Modifiers (INSERTED)
**Goal**: Close the user-visible correctness gaps Phase 12.1 surfaced — picker detail panes show the TLK description text instead of just the label, race ability modifiers flow through to attributes, prestige classes are gated correctly at L1, and the compiled class catalog stops producing duplicate React keys.
**Depends on**: Phase 12.1 (roster already wired from compiled catalogs)
**Requirements**: CHAR-02 (race ability modifiers fold into base attributes), FEAT-01 (class selection surface correct), visual picker quality (description readable before commit).
**Gap Closure**: Closes the four deferred items in `.planning/phases/12.1-roster-wiring-and-overflow-fixes/deferred-items.md`: (1) TLK description surfacing (medium), (2) race ability-modifier pipeline (large, CHAR-02 structural gap from Phase 3), (3) prestige-filter false positives/negatives at L1 (Clérigo wrongly blocked; `Alma Predilecta` / `Caballero de Luz` / `Paladin Oscuro` / `Paladin Vengador` / `Artífice` wrongly enabled), (4) compiled class catalog duplicate canonical IDs (`class:harper`, `class:shadowadept`).
**Success Criteria** (what must be TRUE):
  1. Race picker detail pane renders the race's TLK `description` text (not just its label). Class picker detail pane renders the class's TLK `description` text.
  2. Race ability modifiers (`abilityAdjustments` in `CompiledRace`, e.g. Elfo DEX +2 / CON −2, Enano CON +2 / CHA −2) flow through the foundation-selector adapter and are applied to the attributes-computation layer so the stats sheet reflects base + racial adjustments separately or combined (final displayed stats include the racial layer).
  3. At L1 with a legal alignment, Clérigo is enabled; prestige classes that require BAB / specific-class-levels unreachable at L1 remain blocked with a Spanish `deferredRequirementLabel`.
  4. The compiled class catalog no longer ships duplicate canonical IDs (or — fallback — the projection adapter applies first-wins dedupe so React key warnings disappear and no phase-04 JSX spec regresses).
**Plans**: 4 plans (planned)

Plans:
- [x] 12.2-01: Wire TLK descriptions through projection adapters into race + class picker detail panes
- [x] 12.2-02: Introduce race-ability-modifier pipeline (rules-engine helper + foundation-store integration + attributes-board display)
- [x] 12.2-03: Fix prestige-filter false positives/negatives + Clérigo L1 regression (projection / collectVisibleClassOptions audit)
- [x] 12.2-04: Dedupe compiled class catalog (extractor-level preferred; fixture-level dedupe fallback)
**UI hint**: yes

### Phase 12.3: UAT Correctness Closure (INSERTED)
**Goal**: Clear the 9 correctness blockers deep UAT (2026-04-18) surfaced so milestone v1.0 can close. Fix attributes overspend gate, multiclass level picker, per-level Dotes gate, HP computation, origin-step decoupling, description paragraph rendering, and the ripple bugs on header + sub-step progress.
**Depends on**: Phase 12.2 (roster + race modifiers already wired)
**Requirements**: ABIL-01 (attribute budget enforcement), ABIL-02 (HP derived), CLAS-01..04 (multiclass progression), PROG-01..03 (per-level progression), FEAT-01 (feat selection + slot clarity).
**Gap Closure**: Closes the 9 bugs documented in `.planning/UAT-FINDINGS-2026-04-18.md` (B1..B9). Milestone v1.0 close is blocked on B1, B2, B3, B6.
**Success Criteria** (what must be TRUE):
  1. Attributes `+` button is disabled when the next-increment cost exceeds `Puntos restantes`. `Puntos restantes` cannot go negative. Regression test locks the boundary.
  2. Clicking a level N button in the progression rail activates N as the current level: header title reads `SELECCIONA LA CLASE DEL NIVEL N`, class picks persist to level N (not L1), and the rail reflects `1<class1> 2<class2>` after multiclassing.
  3. Dotes sub-step surfaces per-level feat slots: the center panel shows how many class-bonus + general feats are available at the active level and the "Completa una progresion valida" block only appears when the active level genuinely lacks a class.
  4. Character-sheet `PG` reports hit points at L1 as `hitDie + conMod` (class die + CON modifier) and updates on later levels; no permanent `--`.
  5. Origin rail `✓` on Raza + Alineamiento remains intact regardless of downstream Atributos validity. Stepper "origin complete" predicate depends on race+alignment only.
  6. Race + class DetailPanel bodies render multi-paragraph descriptions with readable paragraph breaks (no wall-of-text).
**Plans**: 6 plans (planned)

Plans:
- [x] 12.3-01: Disable attributes `+` when cost exceeds remaining budget (B1)
- [x] 12.3-02: Multiclass per-level switching (B2 + B8 + B9)
- [x] 12.3-03: Per-level Dotes gate + slot-count prompt (B3 + B4)
- [x] 12.3-04: Hit-points pipeline through rules-engine + sheet (B6)
- [x] 12.3-05: Origin-stepper decoupling from atributos validity (B7)
- [x] 12.3-06: Description paragraph rendering in DetailPanel (B5)
**UI hint**: yes

### Phase 12.4: Construcción Correctness & Clarity (INSERTED)
**Goal**: Close the 8 cross-cutting UX + correctness defects UAT 2026-04-19 surfaced across the Construcción flow (class picker, skills route, feats route, per-level gating). Separate base vs prestige classes with evidence-based gating; surface per-level feat-slot + skill-point budgets as authoritative UI truth; add a dynamic "Continuar al nivel N" affordance; split Habilidades into class vs transclase sections with coste hint; restructure Dotes with selectability states, slot counter, and collapse-on-complete behavior; fold parameterized feat families (Soltura, Weapon Focus, etc.) behind secondary pickers; strip DELETED / sentinel rows from extractor + UI; move Dotes scroll onto list column. Also fix the sub-step ✓ pre-check regression (X1) that auto-greens Clase/Habilidades/Dotes at L1 before user interaction.
**Depends on**: Phase 12.3 (UAT correctness closure) — F3 math surfacing builds on existing per-level selectors.
**Requirements**: CLAS-01..04 (multiclass + prestige legality), PROG-01..03 (per-level progression), FEAT-01 (feat selection + slot clarity), SKIL-01..02 (skill allocation + class/cross-class cost), PICK-01 (class picker gating).
**Gap Closure**: Closes the 8 findings + X1 documented in `.planning/UAT-FINDINGS-2026-04-19.md` (F1..F8 + X1).
**Success Criteria** (what must be TRUE):
  1. Class picker renders base classes in an explicit `Clases básicas` group above prestige classes in a `Clases de prestigio` group. Prestige rows whose prerequisites fail at the currently-edited level are disabled and display the unmet prereq inline. At L1, every prestige row is disabled.
  2. Level editor footer shows a contextual advance button whose label reflects completion state: `Continuar al nivel N+1` when current level fully allocated; `Faltan {N} dotes que asignar en este nivel` or `Faltan {N} puntos de habilidad por gastar` (disabled) otherwise. Button dispatches `setActiveLevel(N+1)` + `setExpandedLevel(N+1)` + appropriate sub-step.
  3. Feat-slot + skill-point math per level (L1..L16) is exposed as header counters (`Dotes: {chosen}/{slots}`, `Puntos de habilidad: {spent}/{budget}`). Math accounts for Humano L1 bonus feat, class-bonus feats (Guerrero L1/L2, Mago L1+L5+L10+L15), L1 skill-point quadruple, Pícaro/Explorador INT-based bonus, and prestige-class boundary transitions. Regression fixture tests assert canonical builds.
  4. Habilidades route splits into two headered sections (`Habilidades de clase` + `Habilidades transclase`) with visible cost-per-rank hint on each section; `Solo entrenada` shown as a per-row badge orthogonal to the grouping.
  5. Dotes route renders per-row selectability states (selectable / blocked-prereq / blocked-already-taken / blocked-budget) with muted styling + inline reason for blocked rows. **Visibility policy: unavailable feats remain in the list — never hidden — with explicit unmet-requirement copy so the user can plan forward.** Panel header shows `Dotes del nivel N: {chosen}/{slots}`. When `chosen === slots`, the list body collapses to a summary card with chosen feats + `Modificar selección` expand link.
  6. L1 sub-steps (Clase / Habilidades / Dotes) render neutral / pending state on first entry — ✓ is granted only after the user affirms a class, allocates skill points up to budget, and selects all feat slots at that level.
  7. Parameterized feat families (`Soltura con una habilidad`, `Soltura con una escuela de magia`, and any other 2DA-expanded variant family) collapse to one canonical row in the main Dotes list. Selecting the family row opens a secondary picker (modal / inline expander) scoped to valid targets, inheriting the same selectability + prereq treatment from SC5. Stored feat id still carries the specific target so rules-engine logic is unchanged.
  8. Extractor feat catalog emits zero rows whose label / description matches `DELETED`, `***DELETED***`, `UNUSED`, or equivalent 2DA sentinel. Belt-and-braces UI filter suppresses any sentinel rows that leak through. Regression test asserts zero sentinel rows post-extraction and zero rendered sentinel rows in the picker. Skill + class + race catalogs audited for the same pattern in the same plan.
  9. Dotes route scroll container lives on the feat-list column (`overflow-y: auto` on the list, not the shared two-column wrapper). Description panel remains pinned while the list scrolls; description panel scrolls internally only when its own content exceeds its height. Same pattern verified on class + race pickers to prevent regression.
**Plans**: 9 plans

Plans:
- [x] 12.4-01-PLAN.md — R8 extractor + UI sentinel (DELETED/UNUSED/PADDING) filter
- [x] 12.4-02-PLAN.md — R9 Dotes scroll relocation onto .feat-picker__list
- [x] 12.4-03-PLAN.md — R3 per-level-budget pure selector + Monje/Pícaro schedule fixtures + bench
- [x] 12.4-04-PLAN.md — R6+X1 L1 neutral sub-steps + predicates + vitest jsdom glob (Wave 0 infra)
- [x] 12.4-05-PLAN.md — R4 Habilidades class/transclase section split + cost hint
- [x] 12.4-06-PLAN.md — R1 ClassPicker extracted + reachableAtLevelN prestige gate
- [x] 12.4-07-PLAN.md — R5 Dotes four selectability states + slot counter + collapse-on-complete
- [x] 12.4-08-PLAN.md — R7 parameterizedFeatFamily schema + inline <fieldset> expander
- [x] 12.4-09-PLAN.md — R2 LevelEditorActionBar sticky footer + atomic dispatch + E2E
**UI hint**: yes

### Phase 12.6: UAT-2026-04-20 Residuals (INSERTED)
**Goal**: Close the two UAT-2026-04-20 findings that the hot-fix batch (commits `e8181a5..9513fe6`) could not resolve without formal scoping: **A1** — point-buy cost per race (source data blocked — needs extractor enrichment of compiled race catalog or a Puerta snapshot override file; current `packages/rules-engine/src/foundation/ability-budget.ts` uses a uniform curve); **P5** — level table / progression usability redesign (open-ended; compact per-level row with inline class + feats + skills; active-level edit-in-place vs modal; scan pattern for 20 levels on a single screen — L16→L20 landed in P6).
**Depends on**: Phase 12.4 (Construcción correctness) — P5 redesign builds on the existing LevelRail + LevelSubSteps scaffolding + the 12.5 hot-fix batch (sequential gating, caja layout, race modifiers).
**Requirements**: ATTR-01 (per-race point-buy cost surfacing), PROG-04 (level table usability redesign).
**Gap Closure**: Closes A1 + P5 documented in `.planning/UAT-FINDINGS-2026-04-20.md`. P1 + G1 + G2 + A2 + P2 + P3 + P4 + P6 already closed via hot-fix commits on master.
**Success Criteria** (what must be TRUE):
  1. `packages/rules-engine/src/foundation/ability-budget.ts` sources the point-buy cost curve per race — no uniform fallback in the final render path. Every race in the compiled catalog ships with a verified curve (canonical Puerta data — either extractor-emitted `pointBuyCurve` field or a hand-authored `puerta.point-buy.json` override file vetted against server documentation).
  2. AttributesBoard `Puntos restantes` budget recomputes when the user switches race; identical base attributes with different races produce different remaining-point totals.
  3. Level progression route presents all 20 levels in a single scan-friendly surface (exact layout resolved in `/gsd-discuss-phase 12.6` — candidates: compact row-per-level with inline class + feats + skills pills; collapsible per-level cards with active expansion; hybrid). Downstream levels surface class + slot commitments without requiring click-navigation to each rail button.
  4. Regression fixture tests assert canonical per-race point-buy deltas (Elfo DEX+2/CON−2 at score 14 costs differently than Humano; exact numbers pending Puerta source).
**Plans**: 6 plans

Plans:
- [ ] 12.6-01-PLAN.md — Wave 0 infra (vitest glob + 4 test stubs + empty puerta-point-buy.json + provenance skeleton + es.ts copy keys + railHeading fossil scrub)
- [ ] 12.6-02-PLAN.md — ATTR-01 A1a: canonicalRaceIdSchema + point-buy-snapshot.ts loader + ability-budget null branch + selectAbilityBudgetRulesForRace + AttributesBoard fail-closed callout + foundation-fixture excise from runtime
- [ ] 12.6-03-PLAN.md — PROG-04 P5 scan surface: selectLevelLegality + level-progression-row.tsx compact row (4 pills) + build-progression-board.tsx 20-row <ol> + scoped CSS namespace + Scan spec Suites A+B
- [ ] 12.6-04-PLAN.md — PROG-04 P5 expanded-slot host swap: migrate level-sheet.tsx contents verbatim into expanded row + scan spec Suite C (expansion + legality transitions + G1 locked)
- [ ] 12.6-05-PLAN.md — PROG-04 P5 deletion + cleanup: delete level-rail.tsx + level-sheet.tsx + scrub creation-stepper.tsx consumer + strip dead .level-rail__* CSS + migrate 4 legacy test specs to [data-level-row] + Suite D (12.4-09 advance selector preserved)
- [ ] 12.6-06-PLAN.md — ATTR-01 A1b (DATA BLOCKER — autonomous:false): populate puerta-point-buy.json with user-delivered per-race curves + provenance rows + flip coverage + per-race delta spec assertions to green
**UI hint**: yes

### Phase 12.7: UAT-2026-04-20 Post-12.6 Residuals (INSERTED)
**Goal**: Close 7 findings (F1..F7) surfaced by agent-driven UAT against master 2026-04-20 immediately after Phase 12.6 closure. F7 is a BLOCKER — user cannot reach L2 because `LevelEditorActionBar` mounts only inside the Progresión-Clase sub-step host, not as a stepper-global footer; advancing requires returning to Clase from Habilidades or Dotes with no signpost.
**Depends on**: Phase 12.6 (Habilidades + Dotes flow lives inside the BuildProgressionBoard scan-row scaffolding shipped in 12.6-03 + 12.6-04; LevelEditorActionBar mount site is the 12.4-09 component preserved through 12.6-04 host swap).
**Requirements**: PROG-05 (advance-bar host-mount + Dotes UX clarity), SKILL-01 (per-level skill cap + carryover + per-row label hygiene + scroll-on-mount).
**Gap Closure**: Closes F1..F7 documented in `.planning/UAT-FINDINGS-2026-04-20-post-12.6.md` (commit `34b84db`).
**Success Criteria** (what must be TRUE — refined in `/gsd-spec-phase 12.7`):
  1. `LevelEditorActionBar` is visible to the user on every Progresión sub-step (Clase, Habilidades, Dotes) for the active level — not only when the user is on Clase.
  2. Skill `+` buttons hard-block when `puntosGastados >= puntosDisponibles` (no `Puntos restantes: -1` reachable via UI).
  3. Habilidades sub-step lands at `scrollTop === 0` on its inner scroll container the first time it mounts per session.
  4. Per-row "Clase"/"Transclase" category labels are removed; "Solo entrenada" badge is preserved as per-row metadata.
  5. Level-progression-row header text renders explicit separators (e.g. ` · `) and includes the word "Nivel" for screen-reader + visual scan parity with legacy LevelRail.
  6. Dotes sub-step UI surfaces an explicit per-section budget hint ("Selecciona N dote(s) general(es)") + the same advance-bar copy as Clase + Habilidades.
  7. (Optional, data-blocked) Skill point carryover allows up to 4 unspent points at L_N to roll forward to L_{N+1}; vetted against Puerta server source before implementation.
**Plans**: 4 plans across 4 waves (F7 unblock → F4 skill cap → R3/R4/R5 polish → R6 verify-only spike).

Plans:
- [x] 12.7-01-PLAN.md — Hoist LevelEditorActionBar to creation-stepper + delete row mount (F7 R1 BLOCKER) — COMPLETE 2026-04-20 (commits d5d7246 RED + d38ee18 GREEN)
- [x] 12.7-02-PLAN.md — canIncrementSkill gate + boundary adapter + skill-sheet wire (F4 R2) — COMPLETE 2026-04-20 (commits 90e8caf RED + 79b5e77 GREEN + 7e7afd9 integration)
- [x] 12.7-03-PLAN.md — Skill scroll reset + drop per-row labels + Nivel N prefix (F2 R3 / F3 R4 / F1 R5) — COMPLETE 2026-04-20 (commits 61fb9f5 RED + c856da7 GREEN)
- [x] 12.7-04-PLAN.md — Verify L2..L20 skill-budget formula (F6 R6 verify-only; no-op if green, SUMMARY-only if red) — COMPLETE 2026-04-20 (commits ef8133a + 15d81b9)
**UI hint**: yes

### Phase 12.8: UAT-2026-04-23 Residuals (INSERTED)
**Goal**: Close 6 findings (F1..F6) surfaced by agent-driven UAT against master 2026-04-23 post-12.7: F1/F2 Habilidades `scroll-snap` regression (carries 12.7 T3 deferral), F3 Dotes multi-slot viewport nudge (user cannot reach general slot after class slot fills), F4 Dotes deselect from FeatSummaryCard, F5 prestige fail-closed tightening + 3-class enrichment (pale-master + caballero-arcano FAIL-OPEN; shadowdancer too permissive), F6 Semielfo roster duplicate.
**Depends on**: Phase 12.7 (skill-sheet scroll wiring at `apps/planner/src/features/skills/skill-sheet.tsx` + `app.css:473-477`; FeatSummaryCard mount site from 12.4-07; prestige fail-closed policy from 12.4-06; `dedupeByCanonicalId` from 12.1-02).
**Requirements**: SKIL-01 (Habilidades scroll reset + rank assignment UX — regression), FEAT-02 (Dotes multi-slot UX + prereq clarity — regression), CLAS-02 (prestige gate prereq visibility — regression), CHAR-01 (race picker correctness — regression).
**Gap Closure**: Closes F1..F6 documented in `.planning/UAT-FINDINGS-2026-04-23.md` + 12.7 T3 gap deferral in `.planning/phases/12.7-uat-04-20-post-12.6-residuals/12.7-UAT.md`.
**Success Criteria** (what must be TRUE — refined in `/gsd-spec-phase 12.8`):
  1. `.selection-screen__content.scrollTop === 0` on first Habilidades entry per level; no visual shift on `+`/`-` click.
  2. After filling the class-bonus dote slot, the user's viewport surfaces the general-slot section (auto-scroll / collapse / viewport-nudge — decided in discuss-phase).
  3. `<FeatSummaryCard>` allows per-chip deselect without requiring "Modificar selección" round-trip.
  4. At L2 Elfo Guerrero, `pale-master` and `caballero-arcano` render a real prereq gate (not OPEN); `shadowdancer` surfaces feat + skill-rank prereqs (not BAB-only).
  5. Race roster renders Semielfo exactly once (45 → 44 rows, or dedupe-key fix preserves canonical row).
  6. Regression tests run in Playwright (real layout engine) for F1/F2 since jsdom missed the scroll-snap regression.
**Plans**: 4 plans across 2 waves.

Plans:
- [x] 12.8-01-PLAN.md — Remove .skill-board scroll-snap CSS + retarget scrollerRef to .selection-screen__content + Playwright regression harness (F1 + F2, SKIL-01) [Wave 1] — complete 2026-04-24
- [x] 12.8-02-PLAN.md — Extend ClassPrereqInput schema with 6 new prereq field kinds + evaluator branches + shadowdancer override enrichment + Spanish copy templates (F5, CLAS-02) [Wave 1] — complete 2026-04-24
- [x] 12.8-03-PLAN.md — Dotes auto-scroll to general section on class-slot completion + FeatSummaryCard per-chip × deselect + 12.7 T3 closure marker (F3 + F4, FEAT-02) [Wave 2, depends on 12.8-01] — complete 2026-04-24
- [x] 12.8-04-PLAN.md — Delete race:halfelf2 duplicate row + Vitest regression lock on Semielfo singleton (F6, CHAR-01) [Wave 1] — complete 2026-04-24
**UI hint**: yes

### Phase 12.9: Resumen (Hoja de personaje) UX Pass (INSERTED, promoted from Backlog 999.1)
**Goal**: Full UX/usability pass over the Resumen (Hoja de personaje) screen. UAT-2026-04-24 flagged the section as visually broken: overlap in the Progresión block, duplication between the character-sheet section and the creation-stepper summary items, inconsistent spacing vs the Dotes sweep polish (E1..E16). Audit the full screen, reorganize sections, deduplicate cross-sectional content, verify empty/filled states for L1..L20, preserve Export / Import / Share / Guardar / Cargar dialog surfaces.
**Depends on**: Phase 12.8 (Dotes polish set the spacing baseline — E11/E13/E15 8px inner-padding pattern; resumen-table CSS at `.resumen-table__heading` + `resumen-table__block`); Phase 08 (Summary / Persistence / Shared Builds — the underlying selectors + save/load surface).
**Requirements**: R1, R2, R3, R4, R5, R6 (locked via SPEC.md 2026-04-24).
**Success Criteria** (what must be TRUE — refined in `/gsd-spec-phase 12.9`):
  1. No overlapping content in any Resumen section at the locked fixture (Elfo + Neutral puro + Guerrero L1..L20).
  2. No visual duplication of information that the creation-stepper summary bar already shows (identidad + atributos).
  3. Progresión table: every column reachable without horizontal scroll at `localhost:5173` default viewport.
  4. Save / Load / Export / Import / Share dialogs keep their current functional contract while adopting the E11/E13 inner-padding polish.
  5. Empty-state copy reads cleanly pre-character-creation.
**Plans**: 2 plans

Plans:
- [x] 12.9-01-PLAN.md — R3+R6 groundwork: trim ResumenViewModel.attributes[], add emptyState copy keys, land CSS BEM modifiers + 8px padding deltas + empty-state selectors, add phase-12.9 vitest jsdom glob — complete 2026-04-24
- [ ] 12.9-02-PLAN.md — R1+R2+R4+R5 wave: rewrite <ResumenTable> (compact header + full-width Progresión + Habilidades), gate <ResumenTable> mount behind isProjectable with empty-state NwnFrame, author 3 Vitest RTL specs (progresion full-width + identity dedup + empty-state)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 5.1 -> 5.2 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 12.1 -> 12.2 -> 12.3 -> 12.4 -> 12.6 -> 12.7 -> 12.8 -> 12.9

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
| 12.1 Roster Wiring & Overflow Fixes (INSERTED) | 3/3 | Complete | 2026-04-18 |
| 12.2 Roster Detail & Race Ability Modifiers (INSERTED) | 3/4 | In progress | - |
| 12.3 UAT Correctness Closure (INSERTED) | 6/6 | Complete | 2026-04-19 |
| 12.4 Construcción Correctness & Clarity (INSERTED) | 9/9 | Complete | 2026-04-20 |
| 12.6 UAT-2026-04-20 Residuals (INSERTED) | 6/6 | Complete | 2026-04-20 |
| 12.7 UAT-2026-04-20 Post-12.6 Residuals (INSERTED) | 4/4 | Complete (F7 BLOCKER + F4 gate + F6 verify + F1/F2/F3 polish closed) | 2026-04-20 |
| 12.8 UAT-2026-04-23 Residuals (INSERTED) | 4/4 | Complete (12.8-01 F1+F2 scroll-snap, 12.8-02 prestige schema, 12.8-04 Semielfo dedupe, 12.8-03 Dotes F3+F4 UX + 12.7 T3 closure marker) | 2026-04-24 |
| 12.9 Resumen (Hoja de personaje) UX Pass (INSERTED) | 1/2 | In progress (12.9-01 groundwork merged 2026-04-24; 12.9-02 JSX rewrite pending) | - |
