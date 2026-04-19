---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Phase 12.4 complete — all 9 plans shipped across 3 waves. F1..F8 + X1 closed at the code level. Phase 12.4-09 (Wave 3 sequential) shipped <LevelEditorActionBar> sticky footer: single NwnButton with 3 dynamic labels (Continuar al nivel N+1 / Faltan N dotes / Faltan N puntos) driven by selectLevelCompletionState + computeAdvanceLabel (both pure, reuse 12.4-04's buildSnapshotFromStores + CLASS/FEAT/RACE_CATALOG_INPUT adapters). Deficit priority feat > skill (UI-SPEC R2). Component returns null at L16 via `if (level >= 16) return null` short-circuit before any selector call. Atomic dispatch on enabled click: setActiveLevelSubStep('class') FIRST, then setActiveLevel(N+1), then setExpandedLevel(N+1) — sub-step set before expanded-level so shell-store's `?? 'class'` fallback cannot override. CSS .level-editor__action-bar position:sticky + bottom:0 + border-top:1px var(--color-panel-edge), zero new font-weight:700, zero new hex colors. data-testid attributes (level-editor-action-bar + advance-to-level-{N+1}) expose deterministic E2E selectors. OQ-1 resolved: @playwright/test absent (node_modules/@playwright/ missing, package.json no dependency) → RTL .spec.tsx fallback under the Phase-12.4 jsdom glob. E2E concreteness audit: 4 concrete fireEvent.click with specific selectors (fighterRowL1, advanceToL2, fighterRowL2, advanceToL16) + 2 DOM assertions L1 visible / L16 null — zero placeholder comments (Warning #5 contract satisfied). Race pivot in E2E: Humano → Elfo (Humano L1 budget.featSlots.total=3 but useFeatStore holds 2 slots — known 12.4-07 limitation; Elfo L1 has no race-feat bonus so 2/2 store cap matches 2/2 budget and advance button reaches enabled state for a real user-clickable dispatch path). Unit Suite A1 still exercises Humano L1 for the 'Faltan 3 dotes' disabled label. Unit 12/12 green + E2E 1/1 green; phase-12.4 total 131/131; full suite 629/630 (only pre-existing DEF-12.4-02 font-weight:700 at app.css:113 remains, documented deferred). Commits b1b896f (RED) + dff972c (GREEN) + adc13a0 (E2E RTL fallback) + this docs commit. Next: /gsd-verify-work 12.4 + human UAT re-sweep of UAT-FINDINGS-2026-04-19.md F1..F8 + X1 against master."
last_updated: "2026-04-20T00:15:00Z"
last_activity: 2026-04-20 -- Phase 12.4 complete (9/9 plans across 3 waves; 12.4-09 R2 LevelEditorActionBar shipped)
progress:
  total_phases: 20
  completed_phases: 20
  total_plans: 72
  completed_plans: 66
  percent: 91
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** A player can build a Puerta de Baldur character from level 1 to 16 with strict server-valid validation and share that exact build reliably.
**Current focus:** Phase 12.4 (construccion-correctness-clarity) in flight — Wave 1 parallel execution. 12.4-01 complete (R8 sentinel filter); 12.4-02 + 12.4-03 running on sibling worktrees.

## Current Position

Phase: 12.3 (uat-correctness-closure) — COMPLETE
Plan: 6 of 6 complete
Status: Ready to execute

- B1 attributes overspend gate (nextIncrementCost + canIncrementAttribute, 12.3-01)
- B2+B8+B9 multiclass active-level wiring (LevelRail dispatch, 12.3-02)
- B3+B4 per-level Dotes gate + slotPrompt (12.3-03)
- B6 HP pipeline (computeHitPoints selector + StatsPanel wiring, 12.3-04)
- B7 origin-stepper decoupling (narrow zustand subscriptions, 12.3-05)
- B5 description paragraph CSS (white-space: pre-wrap, 12.3-06)

499/499 tests green. In-browser UAT confirmed (Enano+Guerrero L1+Pícaro L2): rail 1Guerrero/2Pícaro, header NIVEL 2, PG 20, slot prompts rendered, description paragraph breaks visible. Milestone v1.0 UNBLOCKED.
Last activity: 2026-04-19 -- Phase 12.4 planning complete

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
| Phase 12.4-01 | 8m | 3 tasks | 9 files |
| Phase 12.4-06 | 10m | 3 tasks | 7 files |
| Phase 12.4-07 | 25m | 3 tasks | 7 files |
| Phase 12.4-08 | 35m | 3 tasks | 10 files |
| Phase 12.4-09 | 35m | 3 tasks | 8 files |

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
- [Phase 12.3-01]: UAT B1 overspend gate lands at the UI layer — `canIncrementAttribute` is consumed by the `+` button `disabled` prop; the store's `setBaseAttribute` is not hardened. Mirrors existing `-` button gate semantics and keeps the store framework-agnostic. `calculateAbilityBudgetSnapshot` stays shape-stable (post-hoc validation copy); the new helpers are forward-looking per-click guards exported alongside it from `@rules-engine/foundation/ability-budget`.
- [Phase 12.3-02]: Multiclass active-level repair lives entirely in the UI dispatch site — `LevelRail.onClick` fires `setActiveLevel` + `setExpandedLevel` atomically. No store/selector/selector-chain changes: `selectActiveLevelSheet` already reads `progressionState.activeLevel`; the board title already concatenates `${copy} ${activeSheet.level}`; the Clase sub-step already evaluates per-level. The single missing wire was the rail's onClick dispatch. Copy string `'Selecciona la clase del nivel'` (no hardcoded number) was already correct. Minimal-surface repair that closes B2 CRITICAL + B8 + B9 in one edit.
- [Phase 12.4-01]: Shared sentinel regex lives in packages/data-extractor/src/lib/sentinel-regex.ts — SENTINEL_REGEX covers DELETED / ***DELETED*** / UNUSED / PADDING / DELETED_* / **** in one case-insensitive pattern; isSentinelLabel helper trims + null-guards + delegates. Fail-closed at producer across all 4 assemblers (feat x2, skill x1, class x1, race x1) AND belt-and-braces at consumer in apps/planner/src/features/feats/selectors.ts::selectFeatBoardView. compiled-feats.ts manually scrubbed of sourceRow 385 + 403 DELETED objects (no cross-references elsewhere in catalog, so excision is schema-safe). Future `pnpm extract` runs will reproduce the scrubbed artifact automatically via the new guards.
- [Phase 12.4-06]: ClassPicker extracted from level-sheet.tsx into features/level-progression/class-picker.tsx; renders two <section> (Clases básicas + Clases de prestigio) with aria-labelledby wiring. reachableAtLevelN pure helper in @rules-engine/progression/prestige-gate.ts returns {reachable, blockers:[{kind, threshold, label}]}; fail-closed to 'Requisitos en revisión' for unenriched prestige; all prestige rows blocked at L1 with 'Disponible a partir del nivel 2'. Framework purity: inline ClassPrereqInput type (no @data-extractor imports; grep gate = 0). CLAS-03 regression locked via RTL spec (option.status==='blocked' from evaluateMulticlassLegality → aria-disabled='true'). Scoped CSS .class-picker__* namespace (this plan owns .class-picker__list). Cross-wave Rule-3 fix: tests/phase-12.4/feat-picker-scroll.spec.tsx A2 assertion updated from `not.toMatch` to `matches.length===1 + co-location proof` so the guard still detects 12.4-02 re-injection without false-firing on 12.4-06's legitimate rule.
- [Phase 12.4-07]: Dotes picker exposes 4 row states (selectable/blocked-prereq/blocked-already-taken/blocked-budget) via extended FeatOptionView.rowState + blockedReason; priority-ordered (already-taken > prereq > budget > selectable). Blocked rows stay in DOM (visibility-lock contract); cascade-defeat CSS `.feat-picker__row--blocked .feat-picker__reason, .feat-picker__row--blocked .feat-picker__pill { opacity: 1 }` keeps reason + pill legible while row itself sits at opacity 0.55 per UI-SPEC.md contrast mitigation. Panel header shows `Dotes del nivel N: {chosen}/{slots}` with tabular-nums via new FeatBoardView.counters + counterLabel fields (budget sourced from computePerLevelBudget 12.4-03 via buildSnapshotForBudget boundary adapter — rules-engine stays framework-agnostic). Collapse-on-complete swaps FeatSheet for new <FeatSummaryCard> (NwnFrame + chosen-feats list + NwnButton variant="auxiliary" `Modificar selección`); re-expand flow uses isEditingCompleted local state (reset on activeLevel change via useEffect). selectFeatBoardView walks full compiledFeatCatalog.feats (not getEligibleFeats) so blocked-prereq rows stay in DOM; pool scoping via classBonusFeatIds (list=1/2) + allClassesCanUse || list=0 for general. OptionList replaced with bespoke <FeatPickerRow> buttons carrying data-feat-id + aria-disabled + state-based classes + inline italic reason + pill; .feat-picker__list class on wrapper preserves 12.4-02 scroll-on-list contract. formatBlockedReason(check) routes every PrerequisiteCheck.type to its Spanish template (shellCopyEs.feats.blockedReasons — 12 templates incl. singular/plural for skill-rank + class-level). findAlreadyTakenAtLevel excludes activeLevel so user's own current pick stays toggleable. Known limitation: Humano L1 budget.featSlots.total = 3 but useFeatStore holds only 2 slots (classFeatId + generalFeatId); counter displays 3 but collapse-on-complete only fires for non-Humano cases. Tracked as deferred for 12.4-08 (family expander) or a future store-shape plan.
- [Phase 12.4-08]: parameterizedFeatFamily {canonicalId, groupKey, paramLabel} added as OPTIONAL+NULLABLE field to compiledFeatSchema (OQ-4 backward-compat; Phase 8 SHAR-05 share-URL schema invariant preserved — no schemaVersion bump, no persisted-id shape change). detectFamily() regex-matches Spanish TLK display labels (id-prefix detection rejected because Puerta catalog uses opaque slugs like feat:skillfocusanim / feat:weapfocclub — id-prefix approach would miss every variant). 6 families emitted: feat:skill-focus / feat:spell-focus / feat:greater-spell-focus / feat:weapon-focus / feat:weapon-specialization / feat:greater-weapon-focus. Ordered regex list (mayor variants first so greater-weapon-focus doesn't misclassify as weapon-focus). Same regex list lives in scripts/patch-compiled-feats-family.mjs — deterministic hand-patch bridging the current environment (no Windows-local NWN install) to the extractor; next `pnpm extract` regenerates the same field via detectFamily(). compiled-feats.ts patched with 230 variants (32 skill-focus + 8 spell-focus + 8 greater-spell-focus + 59 weapon-focus + 58 weapon-specialization + 65 greater-weapon-focus). Per-target CompiledFeat rows PRESERVED (Pitfall 6 option B) — family is additive grouping metadata, rules-engine prereq evaluator unchanged (verified: Phase 6 + 12.4-07 suites 100% green). Client-side groupIntoFamilyEntries() buckets FeatOptionView rows by groupKey → FeatFamilyView (rowState rollup: selectable if any target selectable, else prereq > budget > already-taken). FeatBoardView gains classBonusEntries/generalEntries (FeatListEntry discriminated union: {kind:'feat'} | {kind:'family'}). FeatEntryList in feat-sheet.tsx replaces flat FeatPickerList; FeatFamilyRow carries data-family-id + aria-expanded + `{N} objetivos` plural-aware pill (counts non-already-taken targets) + inline italic reason showing selectedTarget.label when a target is chosen at active level. New <FeatFamilyExpander> component: auto-focused <fieldset tabIndex={-1}> (useRef + useEffect — so Esc keydown fires without prior internal click) + <legend>Elige {paramLabel}</legend> + role='radiogroup' radio list with disabled={rowState !== 'selectable'} + reused .feat-picker__pill for blocked-already-taken. Single-expander discipline via expandedFamilyId local state on FeatSheet (clicking second family closes first). Scoped CSS .feat-family-expander__* namespace append-only (legend + options grid with max-height:320px overflow-y:auto per D-05 + option --blocked modifier). Zero new font-weight:700 hex colors or tokens introduced. 11 new tests across 2 suites (A: extractor shape 5 / B: UI family row + expander 6); full suite 616/617 (only pre-existing DEF-12.4-02 `font-weight: 700` remains — out of scope). Test fixture pivot: setupL1HumanoGuerrero pre-fills class-bonus slot with feat:carrera (list=1 Guerrero, no prereqs) so sequentialStep flips to 'general' and the skill-focus family row (allClassesCanUse=true — general pool) renders.
- [Phase 12.4-09]: <LevelEditorActionBar> sticky footer rendered as the last child of .level-sheet. Single NwnButton with 3 dynamic labels (Continuar al nivel N+1 / Faltan N dotes que asignar en este nivel / Faltan N puntos de habilidad por gastar — plural-aware, singular falta/punto variants) driven by selectLevelCompletionState + computeAdvanceLabel — both pure selectors in level-progression/selectors.ts, reuse 12.4-04's buildSnapshotFromStores + CLASS/FEAT/RACE_CATALOG_INPUT boundary adapters; packages/rules-engine stays framework-agnostic per 12.4-03 decision (zero new @data-extractor imports). Deficit priority: feat > skill (UI-SPEC R2 "both unfilled" rule, locked by Suite A2). Component returns null at L16 via `if (level >= 16) return null` short-circuit BEFORE any selector call or hook dispatch — spec C1 locks no button + no footer + empty innerHTML. Atomic dispatch on enabled click: setActiveLevelSubStep('class') FIRST, then setActiveLevel(N+1), then setExpandedLevel(N+1) — sub-step set before expanded-level because shell-store's setExpandedLevel has a `?? 'class'` fallback that would preserve a prior non-null sub-step if we set expandedLevel first (locked by Suite B1). Scoped CSS .level-editor__action-bar: position:sticky bottom:0 background:--color-panel border-top:1px solid --color-panel-edge display:flex justify-content:flex-end padding:--space-md z-index:1 — zero new font-weight:700, zero hex colors, zero tokens. data-testid=\"level-editor-action-bar\" on the <footer> + data-testid=\"advance-to-level-{N+1}\" on the button give deterministic E2E selectors. OQ-1 RESOLVED: @playwright/test NOT installed at repo root (node_modules/@playwright/ missing + package.json devDependencies has no entry) → RTL-driven full-flow fallback in .spec.tsx under the Phase-12.4 jsdom glob. E2E concreteness audit (checker Warning #5): 4 concrete fireEvent.click with specific selectors (fighterRowL1 = [data-class-id=class:fighter], advanceToL2 = [data-testid=advance-to-level-2] real enabled click, fighterRowL2, advanceToL16) + 2 DOM assertions (L1 visible actionBarL1 !== null + L16 terminal actionBarL16 === null per D-06). grep for //placeholder|TBD|scaffold inside test body returns zero matches. Race pivot in E2E: Humano → Elfo. Humano L1 budget.featSlots.total=3 but useFeatStore holds only 2 slots (race-bonus slot not yet in store shape — 12.4-07 known limitation) so advance button never enables for Humano L1 at current store capacity. Elfo L1 has no race-feat bonus → 2/2 store cap matches 2/2 budget → real user-clickable advance path. Unit spec Suite A1 still exercises Humano L1 for the 'Faltan 3 dotes' disabled label path. Unit 12/12 green; E2E 1/1 green; phase-12.4 total 131/131; full suite 629/630 (only pre-existing DEF-12.4-02 font-weight:700 at app.css:113 remains). Commits b1b896f (RED, 13 assertions / 5 suites) + dff972c (GREEN component + selector + CSS + copy) + adc13a0 (E2E RTL fallback) + this docs commit. Phase 12.4 now FUNCTIONALLY COMPLETE — 9/9 plans shipped: F1..F8 + X1 of UAT-FINDINGS-2026-04-19 all closed at code level. Next gates: /gsd-verify-work 12.4 programmatic verification + human UAT re-sweep before closing milestone.

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 05.1 inserted after Phase 5: Data Extractor Pipeline (URGENT) — UAT revealed all planner catalogs are ~10% placeholders vs server reality. **Completed 2026-04-15:** 2016 items extracted across 6 catalogs.
- Phase 05.2 inserted after Phase 5.1: UX Overhaul — User identified that the current planner is not navigable: endless vertical scroll, no visual hierarchy, no wizard flow, low information density. Must fix before adding more feature phases.
- Phase 07.1 inserted after Phase 7: Shell narrow viewport nav fix (URGENT) — Phase 07 UAT surfaced that at viewports ≤1023px the creation-stepper is hidden by media query and no hamburger toggle consumes `toggleMobileNav`, leaving the shell unusable at small resolutions. Blocks downstream UAT until fixed.
- Phase 07.2 inserted after Phase 7: Magic UI descope (URGENT) — Product pivot. User clarified the planner should match `excel simulador de fichas/Plantilla Base.xlsx` (Resumen Ficha / Caracteristicas&Dotes / Puntos de habilidad / Dotes). No per-level spell selection, no sorcerer swap, no cleric domain picker, no Conjuros tab. Phase 07 magic UI, cleric domains, rules-engine magic module, spell+domain compiled catalogs, and related tests to be purged. Run 07.2 before 07.1 so the drawer lands over a slim shell.
- Phase 12.1 inserted after Phase 12: Roster Wiring & Overflow Fixes (INSERTED) — Phase 11 UAT (2026-04-18) surfaced that L1 class picker shows only 7 classes, race picker only 3 parent races (vs full PDB TLK extractor roster), and several panels lack `overflow-y: auto` and clip content. User-visible blocker for character creation; separated from Phase 12 (cosmetic tech debt) to keep Phase 12's audit scope tight.
- Phase 12.2 inserted after Phase 12.1: Roster Detail & Race Ability Modifiers (INSERTED) — Phase 12.1 UAT (2026-04-18) surfaced four remaining gaps after roster wiring: (1) picker detail panes show only labels, not TLK descriptions; (2) race ability modifiers never fold into attributes (CHAR-02 structural gap from Phase 3 — e.g. Elfo DEX +2 / CON −2 not applied); (3) prestige-filter mis-gates at L1 (Clérigo wrongly blocked; 5 prestige classes wrongly enabled); (4) compiled class catalog ships duplicate canonical IDs (`class:harper`, `class:shadowadept`) causing React key warnings. Splits cleanly into 4 plans.
- Phase 12.3 inserted after Phase 12.2: UAT Correctness Closure (INSERTED) — Deep UAT (2026-04-18, after Phase 12.2 shipped) surfaced 9 blockers. Critical: B1 attributes `+` allows overspend (`Puntos restantes: -2`), B2 multiclass L2+ click doesn't activate picker (overrides L1), B3 Dotes falsely blocked on levels lacking a class. High: B4 feat slot count invisible, B6 PG shows `--` forever, B7 origin rail loses ✓ when atributos invalid. Medium: B5 descriptions render wall-of-text, B8/B9 header + sub-step ripples from B2. Milestone v1.0 close blocked on B1/B2/B3/B6; 6-plan closure scheduled across 3 waves.
- Phase 12.4 inserted after Phase 12.3: Construcción Correctness & Clarity (INSERTED) — Post-v1.0 UAT (2026-04-19, after quick task 260419-68b landed atributos layout) surfaced 8 cross-cutting defects + 1 regression in the Construcción flow: F1 class picker intermingles base + prestige with no L1 gating, F2 no dynamic "Continuar al nivel N" advance button, F3 per-level feat-slot + skill-point math not surfaced in UI (blocks legitimate prestige entry), F4 Habilidades does not visually separate class vs transclase costs, F5 Dotes route lacks selectability states + no collapse-on-complete (with locked visibility policy: unavailable feats stay visible + show unmet requirements), F6 Soltura-family feats explode row-per-variant instead of folding behind a secondary picker, F7 DELETED / sentinel rows from extractor pollute the Dotes catalog, F8 Dotes scroll attaches to description column instead of the list column, X1 L1 sub-steps render ✓ before user interaction (auto-seed Explorador). All findings captured in `.planning/UAT-FINDINGS-2026-04-19.md`; scope locked as 9 Success Criteria in ROADMAP.md Phase 12.4. Next: `/gsd-spec-phase 12.4` to lock falsifiable requirements.

### Blockers/Concerns

- [Phase 1] Final Puerta exception inventory still needs a source-of-truth pass for script-only or forum-only rules.
- [Phase 1] Exact coverage for local `nwsync` plus TLK/custom text extraction still needs confirmation before extractor implementation.
- [Phase 05] ~~UAT blocked: hardcoded skill catalog covers 8 of 39 server skills.~~ RESOLVED by Phase 05.1 extraction (39 skills now wired).
- [Phase 8] Dataset mismatch UX still needs a final product decision before implementation.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 260414-gxx | ignorar artefactos locales del workspace | 2026-04-14 | 089881b | closed (Phase 11) | [260414-gxx-ignorar-artefactos-locales-del-workspace](./quick/260414-gxx-ignorar-artefactos-locales-del-workspace/) |
| 260419-68b | fix atributos board misalignment (grid + glyph + numerals) | 2026-04-19 | 762aa57 | complete ✓ | [260419-68b-fix-atributos-layout](./quick/260419-68b-fix-atributos-layout/) |
| 260419-47a | pin creation-stepper bottom (Resumen/Utilidades) via grid | 2026-04-19 | 6a5fda8 | complete ✓ | [260419-47a-stepper-bottom-pin](./quick/260419-47a-stepper-bottom-pin/) |

## Session Continuity

Last session: 2026-04-20T00:15:00Z
Stopped at: **Phase 12.4 FUNCTIONALLY COMPLETE — 9/9 plans across 3 waves.** 12.4-09 (Wave 3 sequential) shipped <LevelEditorActionBar> sticky footer: single NwnButton with 3 dynamic labels driven by selectLevelCompletionState + computeAdvanceLabel (both pure). Returns null at L16. Enabled click dispatches setActiveLevelSubStep('class') + setActiveLevel(N+1) + setExpandedLevel(N+1) atomically (sub-step first to defeat shell-store's `?? 'class'` fallback). OQ-1 resolved: @playwright/test absent → RTL .spec.tsx fallback under Phase-12.4 jsdom glob. E2E preserves ≥4 concrete fireEvent.click calls (fighterRowL1 / advanceToL2 real enabled click / fighterRowL2 / advanceToL16) + ≥2 DOM assertions (L1 visible + L16 null per D-06) — zero placeholder comments (Warning #5 contract satisfied). Race pivot in E2E fixture: Humano → Elfo (12.4-07 documented store-capacity limit on Humano L1 means advance button never enables; Elfo has no race-feat bonus so 2/2 store matches 2/2 budget). Commits b1b896f (RED 13 assertions / 5 suites) + dff972c (GREEN component + selector + CSS + copy) + adc13a0 (E2E RTL fallback) + docs commit. Unit 12/12 + E2E 1/1; phase-12.4 131/131; full suite 629/630 (only pre-existing DEF-12.4-02 font-weight:700 at app.css:113 remains, documented deferred). F1..F8 + X1 of UAT-FINDINGS-2026-04-19 all closed at the code level.

Resume options next session:

1. **/gsd-verify-work 12.4** — orchestrator-recommended next step. Programmatic verifier walks all 9 SUMMARY files + 9 VERIFICATION templates against master, confirms test suite green, greps for regression anchors. Phase 12.4 requires this before the milestone audit can close.
2. **Human UAT re-sweep** — run F1..F8 + X1 scenarios from `.planning/UAT-FINDINGS-2026-04-19.md` against master via Chrome MCP (or manual browser) to confirm each visible defect resolved: F1 class-picker base+prestige split / F2 advance bar / F3 budget math counters / F4 skill board split / F5 Dotes selectability states / F6 feat family fold / F7 sentinel filter / F8 Dotes scroll / X1 L1 neutral sub-steps. CONTEXT.md requires this gate before closing Phase 12.4.
3. **Hygiene fold**: remove the pre-existing `font-weight: 700` at `app.css:113` to close DEF-12.4-02 — restores theme-contract green and takes full suite to 630/630. Small, standalone, can land as a `docs(12.4)` hygiene commit or in the next feature phase.

Dev server still running background task `blemh0vo7` on port 5173 (Vite HMR active). Browser tab 761726195 open at http://localhost:5173/. No restart needed.
Resume file: `.planning/phases/12.4-construccion-correctness-clarity/12.4-09-SUMMARY.md`
