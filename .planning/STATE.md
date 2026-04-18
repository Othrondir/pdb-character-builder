---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Phase 12.2 plan 03 complete — prestige-filter + AlignRestrict decoder shipped (decodeAlignRestrict + BASE_CLASS_ALLOWLIST + rewritten projectCompiledClass). 16 new phase-12.2 regression tests + full suite 440/440 green. 1 deviation auto-fixed (Rule 1 spec canary reconciliation: class:caballero-de-luz → class:paladin-antiguos). Closes Phase 12.1 UAT Bug 3 at the adapter layer. Next: 12.2-04 duplicate-canonical-id fix or phase close."
last_updated: "2026-04-18T22:17:00Z"
last_activity: 2026-04-18
progress:
  total_phases: 12
  completed_phases: 12
  total_plans: 40
  completed_plans: 40
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** A player can build a Puerta de Baldur character from level 1 to 16 with strict server-valid validation and share that exact build reliably.
**Current focus:** Phase 12.1 complete — milestone v1.0 awaiting Phase 12.2 (Roster Detail + Race Ability Modifiers) to clear deferred UAT findings before audit close.

## Current Position

Phase: 12.2 (roster-detail-and-race-modifiers) — IN PROGRESS
Plan: 03 of N complete (12.2-01 done, 12.2-02 done, 12.2-03 done; 12.2-04 duplicate-canonical-id fix still pending)
Status: 12.2-03 shipped — Phase 12.1 UAT Bug 3 closed at the adapter layer. decodeAlignRestrict pure helper (NWN Aurora hex-bit mask 0x001=LG..0x100=CE with InvertRestrict complement) + decodePrerequisiteMaxLevel helper + BASE_CLASS_ALLOWLIST fail-closed escape hatch (11 classic NWN base classes) + extended projectCompiledClass merging decoded allowedAlignmentIds under CLASS_SERVER_RULE_OVERLAY (overlay wins per-field). 2 atomic commits (3d0f50d RED + 852023b GREEN). 16 new phase-12.2 regression tests; full suite 440/440. Rule 1 auto-fix: spec canary reconciliation (class:caballero-de-luz → class:paladin-antiguos; plan's label-derived canary vs feat-table-ref slug). L1 Legal Bueno Humano: Clérigo no longer mis-blocked on alignment (deity block still applies); Alma Predilecta/Paladin Antiguos/Paladin Oscuro/Paladin Vengador/Artifice correctly blocked with deferred label; Guerrero + Shadowdancer unchanged. Next: 12.2-04 duplicate-canonical-id fix (harper/shadowadept React-key warnings).
Last activity: 2026-04-18

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 21
- Average duration: mixed session work
- Total execution time: 4 completed phases

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3/3 | 16m | 5.3m |
| 2 | 3/3 | 1 session | mixed |
| 3 | 2/2 | 1 session | mixed |
| 4 | 3/3 | 1 session | mixed |
| 5 | 0/2 | - | - |
| 6 | 0/2 | - | - |
| 7 | 0/3 | - | - |
| 8 | 0/2 | - | - |
| 05.2 | 8 | - | - |
| 06 | 2 | - | - |

**Recent Trend:**

- Last 3 plans: 04-01, 04-02, 04-03 completed in one verified shell pass
- Trend: Stable

| Phase 05 P01 | 6 min | 2 tasks | 8 files |
| Phase 05 P02 | 12min | 2 tasks | 11 files |
| Phase 05 P03 | 12 min | 2 tasks | 9 files |
| Phase 05.1 P01 | 6min | 2 tasks | 11 files |
| Phase 05.1 P02 | 6min | 2 tasks | 9 files |
| Phase 05.1 P03 | 13min | 2 tasks | 10 files |
| Phase 05.1 P04 | 10min | 2 tasks | 4 files |
| Phase 05.1 P05 | 30min | 3 tasks | 12 files |
| Phase 07 P04 | 9min | 4 tasks | 12 files |
| Phase 07 P05 | 17m | 4 tasks | 12 files |
| Phase 08 P02 | 32m | 4 tasks | 18 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1] Canonical runtime entities use kind-prefixed stable IDs instead of localized labels.
- [Phase 1] Mechanical truth resolves manual override before Puerta snapshot before base-game data; forum material remains evidence-only.
- [Phase 2] The planner shell lives in `apps/planner` as a routed SPA with one persistent frame.
- [Phase 2] Visible shell framing and section labels ship in Spanish from the first frontend pass.
- [Phase 2] The NWN1 shell identity is encoded through shared fonts and CSS tokens rather than generic utility styling.
- [Phase 3] Origin legality and budget enforcement resolve through shared pure helpers instead of route-local JSX checks.
- [Phase 3] Atributos stays locked until the origin is coherent, then switches to a budget-led board with inline feedback.
- [Phase 4] `Construcción` remains a single route, with the origin summarized and the level progression taking over as the main editor.
- [Phase 4] Earlier-level changes preserve later levels and mark them blocked or invalid until the user repairs the affected progression.
- [Phase 4] Progression severity is projected from shared legality helpers into the rail, active sheet, summary strip, and shell summary.
- [Phase 05]: Runtime skill truth now comes from a compiled catalog payload parsed against the extractor contract.
- [Phase 05]: Skill restriction overrides now carry condition metadata so server exceptions stay data-driven.
- [Phase 05]: Skill legality and repair status are recomputed from raw per-level allocations instead of being stored in UI state.
- [Phase 05]: The Habilidades route now projects all editable skill state through shared selectors over the compiled catalog and rules helpers.
- [Phase 05]: Shell summary severity now reflects skill repair state once the user has entered skill allocations.
- [Phase 05]: Estadisticas now projects the active skill snapshot through shared selectors instead of route-local math.
- [Phase 05]: Shell summary skill severity now comes from a dedicated Phase 5 summary selector and only yields to progression when progression is blocked or illegal.
- [Phase 05.1]: Used fzstd (pure JS) for zstd decompression instead of native bindings for zero-native-dep safety on Windows
- [Phase 05.1]: Hand-wrote TLK V3.0 and 2DA V2.0 parsers instead of using neverwinter.nim CLI -- nwsync provides direct resource access
- [Phase 05.1]: Used dependency injection (readFile option) instead of ESM spy mocking for BaseGameReader testability
- [Phase 05.1]: Binary parsers validate magic+version headers and bounds-check all offset reads before slicing
- [Phase 05.1]: NwsyncReader uses prepared SQL statements scoped to PUERTA_MANIFEST_SHA1 for all queries
- [Phase 05.1]: Saving throw progressions derived from SavingThrowTable naming convention (tables not in nwsync)
- [Phase 05.1]: Race size resolved from appearance.2da SIZECATEGORY via Appearance index lookup
- [Phase 05.1]: Spanish character transliteration via shared slug-utils for canonical ID generation from 2DA Labels
- [Phase 05.1]: Feat assembler accepts composable classRows map; spell assembler accepts spellColumnName per class; Zod v4 enum-key records require all keys populated
- [Phase 05.1]: NWN color codes stripped from TLK strings via regex before catalog emission
- [Phase 05.1]: Deity catalog emitted as null -- server manages deities via scripts, not 2DA
- [Phase 07]: classId threaded into MagicLevelInput at selector construction sites (not max-reduce over buildState.classLevels) so swap-cadence validation correctly handles multiclass builds
- [Phase 07]: dispatchParadigm signature stability preserved: characterLevel arg retained (marked void) while cleric branch reads classLevels for first-cleric-level detection
- [Phase 07]: ConfirmDialog gains confirmDisabled prop forwarded via NwnButton native disabled; SwapSpellDialog steps 1 and 2 gate Aceptar on row selection
- [Phase 07]: Extractor uses Map<column, string[]> so classes sharing a 2DA column (e.g., Wiz_Sorc) fan out to every classId instead of last-wins overwrite
- [Phase 07]: Lock sorcererCount === wizardCount at the catalog test layer so shared-column co-tagging cannot silently regress
- [Phase 07.2]: PlannerValidationStatus reverts to pre-Phase-07 4-variant union (blocked/illegal/legal/pending); repair_needed was magic-only
- [Phase 07.2]: ConfirmDialog reverts to 5-prop pre-07 shape; no children slot, no confirmDisabled, no disabled attribute on Aceptar
- [Phase 07.2]: Extractor preserves assembleSpellCatalog/assembleDomainCatalog code behind EMIT_MAGIC_CATALOGS=1 env flag; default run emits 5 catalogs (classes/races/skills/feats/deities)
- [Phase 07.2]: Feat prerequisite minSpellLevel branch + getMaxSpellLevelFromBuildState helper + 'spell-level' PrerequisiteCheck variant all deleted; caster-level map removed from BuildStateAtLevel
- [Phase 07.2]: Magic-free bundle verification uses tight symbol + copy-key greps (aggregateMagicLegality|MagicBoard|MagicSheet|classHasCastingAtLevel|computeCasterLevelByClass|getMaxSpellLevelFromBuildState and stepper.levelSubSteps.spells|sections.spells) instead of broad Spanish-text greps — Spanish prose 'magia'/'conjuros' inside legitimate feat/class descriptions must ship as valid Puerta de Baldur content
- [Phase 08]: Zod 4 native .default().catch() replaces @tanstack/zod-adapter in TanStack Router (zod-adapter is Zod 3 compat shim)
- [Phase 08]: Share-URL uses createHashHistory() + #/share?b={fflate-deflate+base64url} for GH Pages static hosting compatibility (no server rewrites needed)
- [Phase 08]: D-07 fail-closed version-mismatch gate via shared diffRuleset() applied to BOTH /share decode and JSON import paths; VersionMismatchDialog is single UI surface
- [Phase 08]: IncompleteBuildError at projection boundary + isBuildProjectable() predicate for UI gating — preserves strict buildDocumentSchema (SHAR-05) while preventing ZodError leak
- [Phase 12-01]: Shared getClassLabel helper lives in packages/rules-engine/src/feats/ as the single source of truth; accepts string|null (not CanonicalId|null) because compiledClassSchema.id is zod-typed as string via regex guard
- [Phase 12-01]: evaluateFeatPrerequisites + evaluateAllFeatsForSearch + revalidateFeatSnapshotAfterChange all grew classCatalog: ClassCatalog param — ClassCatalog threaded through every caller in planner + rules-engine + tests
- [Phase 12-01]: Branded-id rebuilder pattern (asCanonicalId runtime-guarded + buildDeityRecord) keeps fixture cast-free at the CanonicalId[] boundary; reusable template for future fixtures that hit branded types
- [Phase 12-02]: buildEmitterPlan exported as a pure helper from packages/data-extractor/src/cli.ts; counter math lives in one place so add-a-catalog requires adding an EMITTERS entry, not another '[N/X]' console.log literal
- [Phase 12-02]: cli.ts main() gated behind import.meta.url === pathToFileURL(process.argv[1]).href so unit-test imports of '@data-extractor/cli' no longer trigger a full extractor run on every `vitest run`; Windows-safe ESM direct-invocation idiom
- [Phase 12-02]: FEAT_CATEGORY_LABELS + FeatOptionView.categoryLabel + mapToOptionView assignment fully deleted (not keys-only fallback) because scout grep confirmed zero JSX consumers across apps/planner/src, packages/, tests/
- [Phase 12.1-01]: projectCompiledClass + CLASS_SERVER_RULE_OVERLAY adapter preserves non-roster server rules (minimumClassCommitment, exceptionOverrides, implementedRequirements) without touching the stamped compiled-classes.ts — overlay map keyed by canonical class id is the portable pattern for 12.1-02 race projection.
- [Phase 12.1-02]: projectCompiledRace / projectCompiledSubrace + dedupeByCanonicalId first-wins guard at foundation-fixture.ts handles extractor-emitted duplicate IDs (race:drow rows 196+676) and missing alignment/deity metadata (permissive ALL_ALIGNMENT_IDS default, deityPolicy: 'optional'). Sub-race emission is deferred — extractor currently emits compiledRaceCatalog.subraces === [].
- [Phase 12.1-02]: groupRacesByParent is the first helper under packages/rules-engine/src/foundation/ barrel (index.ts newly created). Pure framework-agnostic Map<parentId, {parent, subraces[]}>; O(n+m); orphan-tolerant; reusable by any future derivation helper (preview panels, share-URL validators).
- [Phase 12.1-02]: Regression-spec floors use `new Set(...).size` (UNIQUE IDs) not raw array length so extractor duplicate emissions cannot silently break the wiring contract.
- [Phase 12.2-03]: AlignRestrict decoding lives in the projection adapter (class-fixture.ts), not in the rules engine — evaluateClassEntry stays shape-stable and framework-agnostic; overlay spreads LAST so CLASS_SERVER_RULE_OVERLAY wins per-field over decoded values (paladin LG-only / cleric requiresDeity / wizard INT 11 preserved).
- [Phase 12.2-03]: BASE_CLASS_ALLOWLIST (11 classic NWN base classes) is the fail-closed escape hatch for isBase=true compiled rows whose real prereqs (BAB/class-level/feat/spellcasting) the extractor does not yet surface — non-allowlisted base classes emit DEFERRED_LABEL_UNVETTED_BASE. Long-term fix is extractor enrichment (PreReqTable decoding or reachableAtLevelOne:boolean); allowlist shrinks to empty in lockstep.
- [Phase 12.2-03]: 0x00 AlignRestrict (with or without InvertRestrict) decodes to undefined (no gate), not "all 9 alignments" — matches NWN 2DA empty-mask convention and lets evaluateClassEntry skip the alignment row entirely when no restriction applies.

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 05.1 inserted after Phase 5: Data Extractor Pipeline (URGENT) — UAT revealed all planner catalogs are ~10% placeholders vs server reality. **Completed 2026-04-15:** 2016 items extracted across 6 catalogs.
- Phase 05.2 inserted after Phase 5.1: UX Overhaul — User identified that the current planner is not navigable: endless vertical scroll, no visual hierarchy, no wizard flow, low information density. Must fix before adding more feature phases.
- Phase 07.1 inserted after Phase 7: Shell narrow viewport nav fix (URGENT) — Phase 07 UAT surfaced that at viewports ≤1023px the creation-stepper is hidden by media query and no hamburger toggle consumes `toggleMobileNav`, leaving the shell unusable at small resolutions. Blocks downstream UAT until fixed.
- Phase 07.2 inserted after Phase 7: Magic UI descope (URGENT) — Product pivot. User clarified the planner should match `excel simulador de fichas/Plantilla Base.xlsx` (Resumen Ficha / Caracteristicas&Dotes / Puntos de habilidad / Dotes). No per-level spell selection, no sorcerer swap, no cleric domain picker, no Conjuros tab. Phase 07 magic UI, cleric domains, rules-engine magic module, spell+domain compiled catalogs, and related tests to be purged. Run 07.2 before 07.1 so the drawer lands over a slim shell.
- Phase 12.1 inserted after Phase 12: Roster Wiring & Overflow Fixes (INSERTED) — Phase 11 UAT (2026-04-18) surfaced that L1 class picker shows only 7 classes, race picker only 3 parent races (vs full PDB TLK extractor roster), and several panels lack `overflow-y: auto` and clip content. User-visible blocker for character creation; separated from Phase 12 (cosmetic tech debt) to keep Phase 12's audit scope tight.
- Phase 12.2 inserted after Phase 12.1: Roster Detail & Race Ability Modifiers (INSERTED) — Phase 12.1 UAT (2026-04-18) surfaced four remaining gaps after roster wiring: (1) picker detail panes show only labels, not TLK descriptions; (2) race ability modifiers never fold into attributes (CHAR-02 structural gap from Phase 3 — e.g. Elfo DEX +2 / CON −2 not applied); (3) prestige-filter mis-gates at L1 (Clérigo wrongly blocked; 5 prestige classes wrongly enabled); (4) compiled class catalog ships duplicate canonical IDs (`class:harper`, `class:shadowadept`) causing React key warnings. Splits cleanly into 4 plans.

### Blockers/Concerns

- [Phase 1] Final Puerta exception inventory still needs a source-of-truth pass for script-only or forum-only rules.
- [Phase 1] Exact coverage for local `nwsync` plus TLK/custom text extraction still needs confirmation before extractor implementation.
- [Phase 05] ~~UAT blocked: hardcoded skill catalog covers 8 of 39 server skills.~~ RESOLVED by Phase 05.1 extraction (39 skills now wired).
- [Phase 8] Dataset mismatch UX still needs a final product decision before implementation.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 260414-gxx | ignorar artefactos locales del workspace | 2026-04-14 | 089881b | closed (Phase 11) | [260414-gxx-ignorar-artefactos-locales-del-workspace](./quick/260414-gxx-ignorar-artefactos-locales-del-workspace/) |

## Session Continuity

Last session: 2026-04-18T22:17:00Z
Stopped at: Completed Phase 12.2 Plan 03 (prestige-filter + AlignRestrict decoder). 2 atomic commits (3d0f50d RED + 852023b GREEN) + 12.2-03-SUMMARY.md. 16 new phase-12.2 regression tests; full suite 440/440 green. 1 deviation auto-fixed (Rule 1 spec canary: caballero-de-luz → paladin-antiguos). Phase 12.1 UAT Bug 3 closed at the adapter layer. Decoder helpers (decodeAlignRestrict, decodePrerequisiteMaxLevel) + BASE_CLASS_ALLOWLIST exported from class-fixture.ts; projectCompiledClass now merges decoded allowedAlignmentIds under CLASS_SERVER_RULE_OVERLAY (overlay wins). Next: 12.2-04 (duplicate-canonical-id fix for class:harper / class:shadowadept React-key warnings) or phase close.
Resume file: None
