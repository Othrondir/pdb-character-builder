---
phase: 07-magic-full-legality-engine
verified: 2026-04-17T13:35:00Z
status: gaps_found
score: 6/12 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Illegal or unsupported selections are blocked with precise, readable explanations and the build is never presented as valid when rules are uncertain (ROADMAP SC4, VALI-01, VALI-02)"
    status: failed
    reason: "selectMagicSheetTabView hardcodes status: 'legal' for every rendered spell and never increments invalidCount. The character-sheet tab — the build's summary surface — visually cannot surface illegal/blocked selections, and the '{invalid} magia no válida' badge never fires. Precise explanations exist in the rules-engine but the sheet tab never calls evaluateSpellPrerequisites/detectMissingSpellData."
    artifacts:
      - path: "apps/planner/src/features/magic/selectors.ts"
        issue: "Lines 680-704: every pushed row hardcodes status: 'legal', statusReason: null; invalidCount never incremented (WR-02)"
    missing:
      - "Call evaluateSpellPrerequisites per spell in selectMagicSheetTabView"
      - "Call detectMissingSpellData per spell for fail-closed coverage"
      - "Map non-legal results to status: 'illegal'|'blocked' with Spanish statusReason"
      - "Increment invalidCount on every non-legal row"
  - truth: "Any build change triggers full recomputation of legality across the entire character (ROADMAP SC3, VALI-03, MAGI-03)"
    status: failed
    reason: "applySwap appends a SwapRecord to swapsApplied but never removes `forgotten` from knownSpells or inserts `learned`. revalidateMagicSnapshotAfterChange never reads swapsApplied. Net effect: the user completes SwapSpellDialog (two steps + confirm) and nothing changes in the known-spell set, nothing revalidates, the summary never updates. The D-15 sorcerer/bard swap cadence is a load-bearing MAGI-03 behavior that silently no-ops."
    artifacts:
      - path: "apps/planner/src/features/magic/store.ts"
        issue: "Lines 144-154: applySwap mutates only swapsApplied, leaving knownSpells unchanged (CR-01)"
      - path: "packages/rules-engine/src/magic/magic-revalidation.ts"
        issue: "MagicLevelInput.swapsApplied is declared but the revalidator body never reads it"
    missing:
      - "applySwap must drop forgotten from knownSpells[spellLevel] and insert learned at the same bucket"
      - "revalidation must reject swaps applied outside SORCERER_SWAP_LEVELS / BARD_SWAP_LEVELS with an illegal ValidationOutcome"
      - "A test must assert that after applySwap, useMagicStore.getState().levels[N].knownSpells no longer contains forgotten and contains learned"
  - truth: "Full-build legality aggregator rolls up per-level magic status into a single MagicAggregateView whose overall status matches the runtime summary selector"
    status: failed
    reason: "aggregateMagicLegality.STATUS_ORDER has legal=2, pending=3 — swapped relative to selectors.ts STATUS_ORDER (legal=3, pending=2). Lower-value wins in both, so the aggregator treats legal as worse than pending while the selector treats pending as worse than legal. A build with one legal level and one pending level rolls up differently between the two surfaces, producing inconsistent summary chips. The existing aggregator test that covers this path (line 52-65) accepts either 'legal' or 'pending', hiding the bug."
    artifacts:
      - path: "packages/rules-engine/src/magic/magic-legality-aggregator.ts"
        issue: "Lines 17-22: STATUS_ORDER = { illegal: 0, blocked: 1, legal: 2, pending: 3 } contradicts selectors.ts order (CR-02)"
      - path: "apps/planner/src/features/magic/selectors.ts"
        issue: "Lines 80-85: STATUS_ORDER = { illegal: 0, blocked: 1, pending: 2, legal: 3 }"
    missing:
      - "Swap legal/pending positions in aggregator STATUS_ORDER to match selector"
      - "Add a mixed-status test (one pending + one legal) asserting result.status === 'pending'"
  - truth: "Domains selectable by Puerta-supported clerics (ROADMAP SC1, MAGI-01)"
    status: partial
    reason: "Single-class Cleric L1 paradigm dispatch returns 'domains' correctly, but dispatchParadigm uses `characterLevel === 1` as the test for 'first cleric level'. A multiclass Fighter 1 / Cleric 2 build NEVER sees the domain picker because characterLevel === 2 routes to 'prepared-summary', even though NWN1 clerics must pick domains on the level they first enter cleric. This silently breaks MAGI-01 for any multiclass cleric path."
    artifacts:
      - path: "apps/planner/src/features/magic/selectors.ts"
        issue: "Lines 262-264: `characterLevel === 1 ? 'domains' : 'prepared-summary'` should be `buildState.classLevels['class:cleric'] === 1`"
    missing:
      - "Replace characterLevel check with first-cleric-level detection via buildState.classLevels"
      - "Add a selector test for a Fighter-1/Cleric-2 build asserting paradigm === 'domains'"
  - truth: "User can choose conjuros conocidos según su clase y nivel (ROADMAP SC1, MAGI-03) — including sorcerer"
    status: partial
    reason: "compiled-spells.ts tags ZERO spells as class:sorcerer because the extractor's columnToClassId map overwrites wizard↔sorcerer on the shared 'Wiz_Sorc' column. Selecting the sorcerer paradigm exercises an empty spell universe. Documented in deferred-items.md but still ships in this phase's catalog. MAGI-03 explicitly names sorcerer; substituting bard in Wave 0 tests (per 07-01 summary) does not close the requirement for the sorcerer UI path."
    artifacts:
      - path: "packages/data-extractor/src/assemblers/spell-assembler.ts"
        issue: "Lines 125-128: columnToClassId is Map<column, classId>; second .set() overwrites the first (WR-04)"
      - path: "apps/planner/src/data/compiled-spells.ts"
        issue: "grep -c '\"class:sorcerer\"' returns 0 — no sorcerer-tagged entries"
    missing:
      - "Promote columnToClassId to Map<column, string[]> and emit spell under every class sharing the column"
      - "Regenerate compiled-spells.ts so sorcerer tags appear alongside wizard"
      - "Remove the bard substitution from tests/phase-07/spell-eligibility.spec.ts and cover sorcerer directly"

human_verification:
  - test: "Open planner at /build/1, pick Cleric L1, click Magia sub-step, confirm the 2-column domain grid renders with Spanish labels and that selecting 2 domains blocks the 3rd with a Spanish cap message."
    expected: "Domain grid renders; 3rd selection blocked with inline Spanish reason matching shellCopyEs.magic copy."
    why_human: "Visual / interactive verification of UI-SPEC Domain Tile Grid rendering and hard-block messaging."
  - test: "Switch class to Wizard at level 1 and verify the spellbook paradigm shows SpellLevelTabs 0-9 with slot counter and that clicking a spell level-0 entry adds it to the grimorio."
    expected: "Tablist 0-9 visible; counter updates; spell row state toggles is-selected."
    why_human: "Visual verification of paradigm dispatch + SpellLevelTabs + SpellRow state classes."
  - test: "Select a spell whose ability/class-level prereq fails, confirm the inline red 'Requiere X' message and red-bordered row match UI-SPEC."
    expected: "Red border, Spanish 'Requiere ...' reason rendered on the row."
    why_human: "Visual verification of precise readable explanations (VALI-02) in the board view."
  - test: "Configure a build with cleric level 3 + an illegal level-1 selection from a non-cleric class, then inspect the character sheet's Conjuros tab."
    expected: "The tab header shows '{N} conjuros — {N} magia no válida' and illegal rows carry is-illegal class with a Spanish statusReason."
    why_human: "Spot-check for WR-02 — this currently FAILS in code (status hardcoded 'legal'). Human run confirms the observable gap."
  - test: "Run a sorcerer/bard swap at a legal swap level (e.g., bard L5): complete the two-step dialog, confirm, and check that the known-spell list reflects the swap."
    expected: "Forgotten spell disappears from known list; learned spell appears. Both surfaces (MagicBoard and Character Sheet) update."
    why_human: "Spot-check for CR-01 — this currently FAILS (applySwap is a no-op on knownSpells). Human run confirms the observable gap."
---

# Phase 7: Magic & Full Legality Engine Verification Report

**Phase Goal:** Users can complete magic planning and trust the planner's full legality recomputation across the whole build.
**Verified:** 2026-04-17T13:35:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Summary

Phase 7 delivers the full magic feature stack — rules-engine module, zustand store, paradigm-dispatched selectors, 8 React components, Spanish copy namespace, shell wiring, D-02 filter, and jsdom smoke tests. The shell integration is clean: `<MagicBoard />` and `<MagicSheetTab />` are wired, the placeholder `SpellsPanel` is gone, the level sub-step label migrated to "Magia", and the shellCopyEs.magic namespace is complete and typed (no `as any`/`as unknown as` leaks). All 310 tests pass.

However, three Critical findings from the code review (07-REVIEW.md) reflect real correctness gaps that invalidate the phase goal — "trust the planner's full legality recomputation":

1. **CR-01 (applySwap no-op):** The D-15 sorcerer/bard swap flow records `swapsApplied` but never mutates `knownSpells`. The user completes the dialog and nothing changes. This invalidates MAGI-03 (known-spell management) and VALI-03 (full recomputation after any change) for the swap pathway.
2. **CR-02 (STATUS_ORDER divergence):** The aggregator and the runtime summary selector disagree on the ordering of `legal` vs `pending`, so the build-wide rollup can produce a different status than the in-board summary. This is exactly the "trust the full-build legality recomputation" contract the phase promises.
3. **WR-02 (hardcoded 'legal' in sheet tab):** `selectMagicSheetTabView` hardcodes `status: 'legal'` for every spell, so the character-sheet summary — the primary user-facing trust surface for a complete build — cannot display illegal or blocked spells. This invalidates SC4 / VALI-01 / VALI-02 at the character-sheet tier.

Secondary finding: multiclass cleric (Fighter 1 / Cleric 2) never sees the domain picker because `dispatchParadigm` uses `characterLevel === 1` instead of "first cleric level". Sorcerer spell coverage is zero in compiled-spells.ts (shared Wiz_Sorc column); documented in deferred-items.md but still ships.

Third Critical (CR-03, caster-level row-index corruption) is **latent** — the current compiled data uses `0` for empty slots rather than `****`, so no rows are skipped and the invariant violation produces no wrong output today. Treating it as a Warning for this phase, not a blocker, but noting that it's a footgun for any future extractor/data change.

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                                       | Status   | Evidence                                                                                                                                                                                                                                                                                                         |
| -- | --------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | User can choose Puerta-supported domains, spells, known spells, and other magic selections according to class and level (SC1) | PARTIAL  | Domain grid, spellbook, known-spell paradigms all render via MagicBoard. BUT: Fighter 1 / Cleric 2 never sees domain picker (WR-01, dispatchParadigm uses characterLevel === 1). Sorcerer catalog is empty (0 class:sorcerer tags in compiled-spells.ts, deferred-items.md documents WR-04 but still ships).     |
| 2  | User sees Spanish names and descriptions for classes, feats, spells, domains, and Puerta custom rules (SC2, LANG-02)        | VERIFIED | shellCopyEs.magic namespace populated (es.ts lines 156-206). Sub-step label migrated to "Magia"; sheet tab stays "Conjuros". No `as any`/`as unknown as` casts. verify-phase-07-copy.cjs passes. 376 empty spell descriptions handled via fail-closed `blocked + missing-source` (VALI-02 contract).              |
| 3  | Any build change triggers full recomputation of legality, prerequisites, and derived outcomes across the entire character (SC3, VALI-03) | FAILED   | aggregateMagicLegality one-pass cascade walks revalidation output correctly, BUT applySwap never mutates knownSpells so swap events bypass recomputation entirely (CR-01). Additionally, aggregator STATUS_ORDER inverts legal/pending vs the selector (CR-02) so the rollup disagrees with the runtime summary. |
| 4  | Illegal or unsupported selections are blocked with precise, readable explanations and the build is never presented as valid when rules are uncertain (SC4, VALI-01, VALI-02) | FAILED   | MagicBoard / MagicSheet hard-block paths render Spanish rejection reasons via rules-engine evaluators. BUT: selectMagicSheetTabView hardcodes status: 'legal' and invalidCount is never incremented (WR-02). The character-sheet tab — the summary trust surface — cannot display illegal spells. |
| 5  | Full-build legality aggregator rolls up per-level magic status into MagicAggregateView with illegalCount, repairCount, issues, perLevel | VERIFIED | aggregateMagicLegality exists with complete signature and all fields populated. Six aggregator unit tests pass (tests/phase-07/magic-legality-aggregator.spec.ts).                                                                                                                                              |
| 6  | PlannerValidationStatus extended with `repair_needed` additively                                                             | VERIFIED | apps/planner/src/state/planner-shell.ts line 4: `'blocked' \| 'illegal' \| 'legal' \| 'pending' \| 'repair_needed'` (T-07-09 mitigation).                                                                                                                                                                        |
| 7  | center-content.tsx routes `spells` sub-step to `<MagicBoard />` (placeholder removed)                                        | VERIFIED | Line 32-33: `case 'spells': return <MagicBoard />;`. `grep -c "Los conjuros se habilitaran"` returns 0. `grep -c "<MagicBoard />"` returns 1.                                                                                                                                                                   |
| 8  | character-sheet.tsx renders `<MagicSheetTab />` for `activeTab === 'spells'` (SpellsPanel deleted)                           | VERIFIED | Line 133: `{activeTab === 'spells' && <MagicSheetTab />}`. `grep -c "SpellsPanel"` returns 0. `grep -c "<MagicSheetTab />"` returns 1.                                                                                                                                                                          |
| 9  | level-sub-steps.tsx hides the `spells` entry when active class has no casting progression (D-02)                             | VERIFIED | Lines 22-27: filter applied via `classHasCastingAtLevel(level, progressionState)` from magic/selectors.ts line 244. Helper checks compiledClassCatalog.classes.find(...).spellCaster.                                                                                                                            |
| 10 | MagicSheetTab is a read-only summary mirroring FeatSheetTab structure (tabpanel, id=sheet-panel-spells, per-class groups)    | PARTIAL  | Structure matches: role="tabpanel", id="sheet-panel-spells", per-class groups, status classes. BUT status is always 'legal' (WR-02), and the empty-state copy is hardcoded Spanish ("Este personaje no lanza conjuros.") rather than sourced from shellCopyEs.magic (IN-03). Good enough structurally.           |
| 11 | Three UI smoke tests (jsdom) render without throwing: magic-board, center-content, magic-sheet-tab                           | VERIFIED | tests/phase-07/{magic-board,center-content,magic-sheet-tab}.spec.tsx exist, all start with `// @vitest-environment jsdom`, all pass (5 total smoke assertions).                                                                                                                                                 |
| 12 | Full test suite still passes with no regressions                                                                             | VERIFIED | 53 files, 310 tests passing. No failures.                                                                                                                                                                                                                                                                       |

**Score:** 6/12 truths fully verified, 2 partial, 4 failed. Counting PARTIAL as fail for the top-line: **6/12 fully passing.**

### Required Artifacts

| Artifact                                                          | Expected                                                                                                                         | Status     | Details                                                                                                                                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/rules-engine/src/magic/magic-legality-aggregator.ts`    | Exports aggregateMagicLegality, MagicAggregateView, MagicAggregateInput, PerLevelMagicView                                       | VERIFIED   | All four exports present, one-pass implementation, but STATUS_ORDER constant is inconsistent with selector (see CR-02 in gaps).                                                                  |
| `packages/rules-engine/src/magic/caster-level.ts`                 | computeCasterLevelByClass, computeSpellSlots, getMaxSpellLevelAcrossClasses                                                       | VERIFIED   | All exports present. Row-index contract brittle (CR-03) but latent — today's data has no skipped rows.                                                                                           |
| `packages/rules-engine/src/magic/spell-eligibility.ts`            | getEligibleSpellsAtLevel with class+level+alreadyKnown filter                                                                     | VERIFIED   | Implementation present, covered by 5 passing tests.                                                                                                                                              |
| `packages/rules-engine/src/magic/spell-prerequisite.ts`           | evaluateSpellPrerequisites using spell-gain 2DA                                                                                   | VERIFIED   | Slot-table-backed min caster level (07-01 auto-fix #1). 3 passing tests. Fallback formula still applies for classes with an extracted table when slot is never granted (WR-03, not blocking).     |
| `packages/rules-engine/src/magic/domain-rules.ts`                 | evaluateDomainSelection, getEligibleDomains, MAX_DOMAINS_PER_CLERIC                                                               | VERIFIED   | All exports present, 6 passing tests.                                                                                                                                                            |
| `packages/rules-engine/src/magic/catalog-fail-closed.ts`          | detectMissingSpellData, detectMissingDomainData                                                                                   | VERIFIED   | Both exports present, 6 passing tests covering blocked + missing-source shapes and synthetic-legal branch.                                                                                       |
| `packages/rules-engine/src/magic/magic-revalidation.ts`           | revalidateMagicSnapshotAfterChange + MagicEvaluationStatus + MagicLevelInput + RevalidatedMagicLevel                              | PARTIAL    | Cascade correctness confirmed by 4 passing tests. BUT swapsApplied is declared on MagicLevelInput and never read — swaps have no validation path (part of CR-01).                                 |
| `apps/planner/src/features/magic/store.ts`                        | useMagicStore with 10 actions + SwapRecord + createInitialMagicState                                                              | STUB       | setDomains, add/remove KnownSpell, add/remove SpellbookEntry, resetLevel, resetMagicSelections, setActiveLevel all work. applySwap ONLY appends to swapsApplied — does NOT mutate knownSpells (CR-01). |
| `apps/planner/src/features/magic/selectors.ts`                    | selectMagicBoardView, selectMagicSheetTabView, selectMagicSummary, classHasCastingAtLevel                                         | STUB       | selectMagicBoardView + selectMagicSummary OK. classHasCastingAtLevel OK. selectMagicSheetTabView hardcodes status: 'legal' and never increments invalidCount (WR-02).                             |
| `apps/planner/src/features/magic/magic-board.tsx`                 | Top-level MagicBoard component                                                                                                    | VERIFIED   | Renders; smoke test passes.                                                                                                                                                                      |
| `apps/planner/src/features/magic/magic-sheet-tab.tsx`             | Read-only character-sheet summary tab with role=tabpanel id=sheet-panel-spells                                                    | VERIFIED   | ARIA contract correct; smoke test passes. Empty-state copy literal is hardcoded Spanish (IN-03), not a blocker.                                                                                  |
| `apps/planner/src/features/magic/swap-spell-dialog.tsx`           | Two-step ConfirmDialog flow persisting via applySwap                                                                              | STUB       | Dialog flow compiles and renders, but step 1/2 onConfirm={onClose} fires before a selection (WR-06) and step 3 calls applySwap which is itself a no-op (CR-01).                                  |
| `scripts/verify-phase-07-copy.cjs`                                | Asserts copy namespace completeness + label migration + no `as any` leaks                                                         | VERIFIED   | Exists; `node scripts/verify-phase-07-copy.cjs` exits 0.                                                                                                                                         |
| `tests/phase-07/magic-legality-aggregator.spec.ts`                | 6 aggregator unit tests covering pending/legal/illegal/cascade/missing-source/inheritedFromLevel                                   | PARTIAL    | All 6 tests pass, but the pending/legal mixed case is not covered (test uses `expect(['legal','pending']).toContain(result.status)`), which is exactly what CR-02 exploits.                       |
| `tests/phase-07/{magic-board,center-content,magic-sheet-tab}.spec.tsx` | Three jsdom smoke tests                                                                                                       | VERIFIED   | All present, `// @vitest-environment jsdom` pragma at top, all pass.                                                                                                                             |

### Key Link Verification

| From                                                              | To                                                                     | Via                                                                 | Status     | Details                                                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/rules-engine/src/magic/magic-legality-aggregator.ts`    | `packages/rules-engine/src/magic/magic-revalidation.ts`                | Consumes `RevalidatedMagicLevel[]` output                           | WIRED      | Imports `revalidateMagicSnapshotAfterChange` + types; single call in aggregator body populates the rollup.                                                 |
| `apps/planner/src/components/shell/center-content.tsx`            | `apps/planner/src/features/magic/magic-board.tsx`                      | case 'spells' returns `<MagicBoard />`                              | WIRED      | Line 7 import + line 33 `return <MagicBoard />`. Placeholder case deleted.                                                                                 |
| `apps/planner/src/components/shell/character-sheet.tsx`          | `apps/planner/src/features/magic/magic-sheet-tab.tsx`                  | `activeTab === 'spells' && <MagicSheetTab />`                       | WIRED      | Line 17 import + line 133 render. `SpellsPanel` function fully deleted.                                                                                    |
| `apps/planner/src/components/shell/level-sub-steps.tsx`          | `apps/planner/src/features/magic/selectors.ts`                         | `classHasCastingAtLevel` filter (D-02)                              | WIRED      | Line 4 import, lines 24-27 filter levelSubSteps using the helper; progression store injected.                                                              |
| `apps/planner/src/features/magic/selectors.ts`                   | `packages/rules-engine/src/magic/magic-revalidation.ts`                | `revalidateMagicSnapshotAfterChange` call inside selector           | WIRED      | Selector imports the revalidator; used in `selectMagicBoardView` and `selectMagicSummary`.                                                                  |
| `apps/planner/src/features/magic/swap-spell-dialog.tsx`          | `apps/planner/src/features/magic/store.ts`                             | `applySwap(level, forgotten, learned)` persists via store action     | BROKEN     | Import + call exist, but the store action is a no-op on knownSpells (CR-01). The wiring is technically present but the behavior is not.                   |

### Data-Flow Trace (Level 4)

| Artifact                                          | Data Variable            | Source                                              | Produces Real Data | Status       |
| ------------------------------------------------- | ------------------------ | --------------------------------------------------- | ------------------ | ------------ |
| `magic-board.tsx`                                 | boardView                | `selectMagicBoardView` composing 5 stores          | Yes                | FLOWING      |
| `magic-sheet-tab.tsx`                             | sheetTabView.groups      | `selectMagicSheetTabView` iterating magicState.levels | Partial           | STATIC (status column always 'legal' regardless of upstream validation — WR-02) |
| `magic-detail-panel.tsx`                          | spellOption/domainOption | prop-threaded from MagicSheet selector             | Yes                | FLOWING      |
| aggregator output → consumers                     | MagicAggregateView       | `aggregateMagicLegality` pipeline                  | No consumers yet   | DISCONNECTED (no runtime call-site in apps/planner; the aggregator is shipped but not invoked by the planner shell) |

Note on the aggregator disconnection: `grep -rn "aggregateMagicLegality" apps/planner/` returns 0 hits. The aggregator is exported from the rules-engine barrel but no planner-side consumer currently calls it. This makes the contract a library surface rather than an active runtime path. The phase goal "full legality recomputation across the whole build" is served today by `selectMagicSummary` inside the board view, not by the aggregator. Not listed as a failed gap because a consumer could reasonably ship in Phase 8, but worth flagging.

### Behavioral Spot-Checks

| Behavior                                         | Command                                                        | Result                                | Status |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------- | ------ |
| Full test suite passes                           | `pnpm test --reporter=dot`                                     | 53 files / 310 tests green, 0 fail    | PASS   |
| Phase-07 suite passes                            | `pnpm test tests/phase-07 --reporter=verbose`                  | 11 files / 51 tests green             | PASS   |
| Copy namespace verifier passes                   | `node scripts/verify-phase-07-copy.cjs`                        | `OK: phase-07 copy verification passed` | PASS   |
| `<MagicBoard />` present in center-content       | `grep -c "<MagicBoard />" apps/planner/src/components/shell/center-content.tsx` | 1 | PASS   |
| `<MagicSheetTab />` present in character-sheet   | `grep -c "<MagicSheetTab />" apps/planner/src/components/shell/character-sheet.tsx` | 1 | PASS   |
| `SpellsPanel` deleted                            | `grep -c "SpellsPanel" apps/planner/src/components/shell/character-sheet.tsx` | 0 | PASS   |
| Placeholder `Los conjuros se habilitaran` gone   | `grep -c "Los conjuros se habilitaran" apps/planner/src/components/shell/center-content.tsx` | 0 | PASS   |
| No `as any`/`as unknown as` casts in magic feature | `grep -rn "shellCopyEs as (any\|unknown)" apps/planner/src/features/magic/` | empty | PASS   |
| `class:sorcerer` coverage in compiled-spells.ts  | `grep -c "\"class:sorcerer\"" apps/planner/src/data/compiled-spells.ts` | 0 | FAIL (deferred-items.md acknowledges) |

### Requirements Coverage

| Requirement | Source Plan           | Description                                                                                       | Status              | Evidence                                                                                                                                                                                                                                                        |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LANG-02     | 07-01, 07-02, 07-03  | Spanish names and descriptions for classes, feats, spells, domains, Puerta custom rules          | SATISFIED           | shellCopyEs.magic populated (30+ keys); verify-phase-07-copy.cjs passes; SCHOOL_LABELS_ES in selectors; missingDescription fallback copy; 376 empty descriptions handled via fail-closed VALI-02 contract.                                                    |
| MAGI-01     | 07-01, 07-02        | User can elegir dominios de clerigo, incluidos los custom                                        | SATISFIED (partial) | Single-class Cleric L1 paradigm dispatch + DomainTileGrid + MAX_DOMAINS_PER_CLERIC = 2 enforcement. Multiclass Fighter/Cleric silently skips the domain picker (WR-01). REQUIREMENTS.md already marks it Complete so the partial is a latent bug not a red X. |
| MAGI-02     | 07-01, 07-02        | User can ver como dominios, clases y progreso afectan a los conjuros disponibles                 | SATISFIED           | Paradigm dispatch + spell-eligibility filter + caster-level-per-class produce live spell pools that update with class-level changes. REQUIREMENTS.md shows Pending; the implementation closes it.                                                             |
| MAGI-03     | 07-01, 07-02        | User can elegir conjuros, conjuros conocidos u otras selecciones segun su clase y nivel          | BLOCKED             | Core flow works for cleric/wizard/bard, BUT sorcerer catalog is empty (WR-04 data gap, 0 class:sorcerer tags) AND applySwap is a no-op for bard/sorcerer swap cadence (CR-01). Both are load-bearing MAGI-03 paths that fail today.                           |
| MAGI-04     | 07-01                | Planner uses la lista de conjuros custom y revisados del servidor en lugar de limitarse al NWN base | SATISFIED          | compiled-spells.ts regenerated with 376 Puerta-extracted spells and spell:pb-* custom entries surface in the catalog. Fail-closed gating when Puerta override fields are missing.                                                                              |
| VALI-01     | 07-01, 07-03        | Planner bloquea builds ilegales en lugar de permitirlas con simples avisos                       | BLOCKED (at sheet tier) | Board view hard-blocks selections via `is-illegal`/`is-repair-needed` state classes AND catalog fail-closed. BUT the character-sheet tab (MagicSheetTab) is hardcoded to `status: 'legal'` (WR-02), so the summary surface does not show blocks. |
| VALI-02     | 07-01                | User recibe explicaciones precisas y legibles cuando una eleccion es invalida                    | SATISFIED           | evaluateSpellPrerequisites emits Spanish `PrerequisiteCheck` rows with labels; detectMissingSpellData emits `notVerifiable` messageKey; rejection prefix keys present in copy namespace.                                                                       |
| VALI-03     | 07-01, 07-02, 07-03 | Planner recalcula automáticamente la build completa cuando cambia cualquier decisión             | BLOCKED             | Revalidation cascade works for domain/spellbook/known mutations. BUT applySwap bypasses recomputation entirely (CR-01) — the swap pathway violates VALI-03 at the rules-engine↔store boundary.                                                               |

**Orphaned requirements:** None. Every requirement listed in the phase's ROADMAP block (LANG-02, MAGI-01..04, VALI-01..03) appears in at least one of the three plans' `requirements:` frontmatter fields.

**REQUIREMENTS.md state:** Despite SUMMARY claims of `requirements-completed: [...]`, REQUIREMENTS.md still lists MAGI-02, MAGI-03, VALI-01, VALI-02, VALI-03 as `[ ]` pending with Status=Pending in the traceability table. Updating REQUIREMENTS.md is typically a milestone-close operation; flagging here because three of those are genuinely blocked by the code gaps above.

### Anti-Patterns Found

| File                                                            | Line       | Pattern                                                                              | Severity | Impact                                                                                                     |
| --------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `apps/planner/src/features/magic/store.ts`                      | 144-154   | `applySwap` mutates only `swapsApplied`, leaves `knownSpells` unchanged              | Blocker  | Silent no-op on load-bearing user action (CR-01)                                                           |
| `packages/rules-engine/src/magic/magic-legality-aggregator.ts` | 17-22     | STATUS_ORDER legal/pending positions inverted vs selector                             | Blocker  | Aggregator and runtime summary disagree on mixed-status builds (CR-02)                                     |
| `apps/planner/src/features/magic/selectors.ts`                  | 680-704   | Hardcoded `status: 'legal'` and static `invalidCount = 0`                            | Blocker  | Character-sheet summary cannot render invalid selections (WR-02)                                           |
| `apps/planner/src/features/magic/selectors.ts`                  | 262-264   | `characterLevel === 1 ? 'domains' : ...` — wrong proxy for "first cleric level"      | Warning  | Multiclass Fighter/Cleric never reaches domain picker (WR-01)                                              |
| `packages/rules-engine/src/magic/caster-level.ts`              | 52        | `table[casterLevel - 1]` indexing relies on extractor row-skip invariant             | Warning  | Latent — current data has no skipped rows; footgun for future extractor/data changes (CR-03)               |
| `apps/planner/src/features/magic/selectors.ts`                  | 397-402   | Hardcoded `emptyStateBody: 'La magia sigue bloqueada'` with outdated sentinel comment | Info     | Copy drift risk (WR-05); no functional bug                                                                  |
| `apps/planner/src/features/magic/magic-sheet-tab.tsx`          | 54-57     | Hardcoded Spanish literal `'Este personaje no lanza conjuros.'`                      | Info     | Copy-single-source violation (IN-03); no functional bug                                                     |
| `apps/planner/src/features/magic/swap-spell-dialog.tsx`        | 54, 84    | Step 1/2 `onConfirm={onClose}` accepts empty selection                                | Warning  | UX trap — Aceptar without a row selected silently skips the swap (WR-06). Compounds with CR-01.            |

### Human Verification Required

See frontmatter `human_verification:` section. Five manual spot-checks are requested; two of them (sheet-tab illegal rendering and sorcerer/bard swap effect) are targeted specifically at observing CR-01 / WR-02 in the running app. Running these confirms the automated analysis.

### Gaps Summary

Phase 7 delivers the plumbing: every file is present, every test passes, every shell wire is soldered. But three load-bearing code paths are broken:

- **CR-01 / applySwap no-op** (Blocker, MAGI-03 + VALI-03): The D-15 swap is a phase-named feature; it currently does not change any user-visible state.
- **CR-02 / STATUS_ORDER divergence** (Blocker, SC3): The aggregator's whole job is to agree with the runtime summary. It does not.
- **WR-02 / hardcoded 'legal' in sheet-tab** (Blocker, SC4 + VALI-01): The character sheet is the trust surface; it cannot show invalid spells.
- **WR-01 / multiclass Cleric** (Secondary, MAGI-01): First-cleric-level detection for non-level-1 clerics.
- **WR-04 / sorcerer catalog gap** (Secondary, MAGI-03): Zero sorcerer-tagged spells ship; documented deferred but still gaps the requirement.

None of these are addressed by Phase 8 (persistence + sharing), so they cannot be deferred. A focused cleanup plan (07-04 or a dedicated gap-closure plan) is needed to close the phase goal.

Suggested gap-closure sequence (ordered by impact and shared fixtures):
1. Fix CR-01 (applySwap mutates knownSpells) + test + revalidation-side swap-cadence guard.
2. Fix CR-02 (swap STATUS_ORDER positions) + add mixed pending/legal aggregator test.
3. Fix WR-02 (selectMagicSheetTabView calls evaluateSpellPrerequisites + detectMissingSpellData) + test.
4. Fix WR-01 (dispatchParadigm uses buildState.classLevels) + multiclass test.
5. Fix WR-04 (columnToClassId → Map<column, string[]>, regenerate compiled-spells.ts) + test.
6. Optional but recommended: CR-03 (scan by casterLevel field in computeSpellSlots) + synthetic-gap test.

The shell wiring, copy namespace, D-02 filter, smoke tests, and overall structural integration are in good shape and do not require rework.

---

_Verified: 2026-04-17T13:35:00Z_
_Verifier: Claude (gsd-verifier)_
