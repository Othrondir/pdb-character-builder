# Phase 7: Magic & Full Legality Engine - Research

**Researched:** 2026-04-16
**Domain:** Spell selection, domain selection, full-build recomputation, Spanish legality messaging
**Confidence:** HIGH (codebase claims), MEDIUM (NWN1 EE rule citations), LOW-flagged for catalog-completeness assumptions

---

## Summary

Phase 7 plugs magic into a planner whose "everything except magic" pipeline already works: foundation → progression → skills → feats are all pure-selector validators following an established cascade-repair pattern (see `packages/rules-engine/src/feats/feat-revalidation.ts:69-191`, `packages/rules-engine/src/skills/skill-revalidation.ts:56-122`). The compiled magic catalogs are loaded and Zod-validated (`apps/planner/src/data/compiled-spells.ts`, `compiled-domains.ts`) but **no rules-engine module reads them**, no UI consumer renders them (`apps/planner/src/components/shell/center-content.tsx:32` is a placeholder), and `BuildStateAtLevel.spellcastingLevel` is hard-coded to `0` (`apps/planner/src/features/feats/selectors.ts:209`).

Two **catalog-completeness blockers** must drive the plan, not be discovered during execution:

1. **All 376 spells have `description: ""`** [VERIFIED: `apps/planner/src/data/compiled-spells.ts:8948,8961,8974,...` — every `"id": "spell:..."` entry I sampled has empty description]. The TLK strref resolved to empty for every spell. UI-SPEC D-13 says "compiled-spells.ts already Spanish via the Phase 05.1 extractor" — that is **only true for `label`, not `description`**. The extractor wrote empty strings without raising a warning ([VERIFIED: `packages/data-extractor/extraction-report.txt:117-130` only contains "missing Label, skipped" warnings; zero "Description strref ... resolved to empty" warnings even though the same warning shape exists for spell names at line 109-116]).
2. **All 27 domains have `grantedFeatIds: []`** [VERIFIED: `apps/planner/src/data/compiled-domains.ts:11,40,71,102,...` confirmed by `Grep "grantedFeatIds": \[\]` returning 27/27]. The domain assembler logged 27 warnings: `Domain row N (X): GrantedFeat=Y not found in feat catalog` [VERIFIED: `extraction-report.txt:138-164`]. The granted feats exist in the source 2DA but are filtered out of the player-facing feat catalog as "internal/system" feats [CITED: `06-01-SUMMARY.md:35` `classFeatLists validity tolerance set to 2% (99 of 7067 entries reference internal-only feats)` — this is the same root cause].

These two gaps compromise the UI-SPEC's `MagicDetailPanel` (no description to show), the "APTITUDES" eyebrow tag on domain tiles, and VALI-02's "explicaciones precisas y legibles" requirement. Plan 07-01 must either include extractor remediation or fail-closed gracefully (D-13: "el planner evita marcar una build como válida cuando falten datos").

**Primary recommendation:** Restructure the three plans so 07-01 establishes the rules-engine + extractor remediation foundation, 07-02 wires the stores/selectors/UI for selection workflows, and 07-03 layers full-build recomputation aggregator + shell summary integration + Spanish error messaging. Treat catalog completeness as a Wave 0 gap, not as a runtime surprise.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Spell prerequisite evaluation | `packages/rules-engine/src/magic/` | — | Pure deterministic functions, mirror `feat-prerequisite.ts` pattern. Must NOT import React/browser APIs (CLAUDE.md "Rules engine must stay framework-agnostic"). |
| Domain prerequisite evaluation | `packages/rules-engine/src/magic/` | — | Same reasoning; alignment + class checks are pure functions. |
| Caster level / spells-per-day computation | `packages/rules-engine/src/magic/` | — | Multiclass spell-slot stacking is determinism-critical; share with feat BAB pattern (`bab-calculator.ts:26-47` — flooring per-class, then sum). |
| Full-build legality aggregation | `packages/rules-engine/src/magic/` | `apps/planner/src/state/planner-shell.ts` (severity projection) | Aggregator is pure; severity projection consumes its output. |
| Magic store (per-level slices) | `apps/planner/src/features/magic/store.ts` | — | Mirror `feats/store.ts:47-88` zustand pattern — per-level records keyed by `level + kind`. |
| Magic selectors (view models) | `apps/planner/src/features/magic/selectors.ts` | — | Compose foundation/progression/skill/feat/magic stores; mirror `feats/selectors.ts:290-426`. |
| MagicBoard, MagicSheet, MagicDetailPanel | `apps/planner/src/features/magic/*.tsx` | `components/shell/center-content.tsx` (router case) | UI-SPEC contract; mirror `feats/feat-board.tsx` shape. |
| Spell level tabs, domain tiles | `apps/planner/src/features/magic/*.tsx` | — | UI-SPEC dictates new components, no shared primitive yet. |
| Magic sheet tab (read-only summary) | `apps/planner/src/features/magic/magic-sheet-tab.tsx` | `components/shell/character-sheet.tsx:106-111` (replace `SpellsPanel`) | Direct clone of `FeatSheetTab`. |
| Spanish copy for magic | `apps/planner/src/lib/copy/es.ts` (new `magic` namespace) | — | Established pattern; spell/domain names + descriptions come from compiled catalogs (per UI-SPEC D-13). |
| Catalog completeness fail-closed | Rules engine + selectors | — | When `description === ""` or `grantedFeatIds === []`, return `blocked` with `blockKind: 'missing-source'` per `validation-outcome.ts:108-117`. |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Magic Selection Workflow:**
- D-01: Single `magia` sub-step per level alongside `class`, `skills`, `feats`. Renders only the magic UI relevant for the selected class at that level.
- D-02: `magia` sub-step is hidden/disabled when the level's class has no casting progression.

**Casting Class Coverage:**
- D-03: MVP covers cleric, wizard, sorcerer, druid, bard, paladin, ranger.
- D-04: Prepared casters without selection surface (druid, paladin, ranger base) render slot-progression summary, no selection UI.

**Recomputation Engine:**
- D-05: Full-build legality recomputes automatically on every zustand store commit via shared pure selectors. No "recomputar" action.
- D-06: Cascade repair — later levels/spells/feats preserved but marked invalid/blocked until the user repairs. Never auto-delete.
- D-07: Recomputation latency target < 50ms for level-16 build. Off the main render path.

**Legality Enforcement Policy:**
- D-08: Hybrid block model — hard block (disabled `+`) for hard prerequisites; soft block (preserved + marked rojo + gated from share) for runtime capacity violations.
- D-09: Shell summary severity priority: foundation → progression → skills → feats → magic.
- D-10: VALI-01 satisfied by export/share gate, not by forcing hard blocks on every runtime capacity issue. Soft-blocks never present as valid.

**Rule Explanation Presentation:**
- D-11: Right-side detail panel pattern (Phase 03 origin selectors). Click a spell/domain row selects it AND surfaces full Spanish description.
- D-12: Short rejection reasons inline in red/amber. Full prereq breakdown in detail panel when row is selected.
- D-13: All user-facing magic copy from compiled catalogs (already Spanish via Phase 05.1). Hand-authored override strings only for legality messages not in catalog data.

**Spell List Mutation Semantics:**
- D-14: Per-level editable. Each level's selection lives in its own store slice keyed by `level + kind`.
- D-15: Spontaneous casters (sorcerer, bard) expose explicit "Cambiar conjuro conocido" swap action on levels that allow swap per NWN EE rules (sorcerer 4/8/12/16, bard 5/8/11/14). [ASSUMED — see Open Question OQ-3.]
- D-16: Wizard spellbook additions are forget-and-replace via explicit "Eliminar del grimorio" control.
- D-17: Cascade repair (D-06) applies to magic.

### Claude's Discretion

- Internal module layout within `packages/rules-engine/src/magic/` and `apps/planner/src/features/magic/`.
- Exact React component split (FeatBoard-style vs SkillBoard-style).
- Cache/memoization strategy for derived magic legality selectors.
- Telemetry / debug logging surface — none required.

### Deferred Ideas (OUT OF SCOPE)

- Cross-dataset build validation UX (Phase 8 SHAR-02).
- Per-day prepared spell configuration (runtime decision).
- Scribing cost / gold tracking for wizard spellbook.
- Metamagic feat integration deep-dive (only honor slot-cost modifiers if catalog declares them).
- Spell VFX / iconography.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LANG-02 | Spanish names + descriptions for clases, dotes, conjuros, dominios, reglas custom | Catalogs labels are Spanish [VERIFIED: `compiled-spells.ts:8951` "Bruma ácida"; `compiled-domains.ts:13` "Aire"]. **BLOCKER: spell descriptions all empty** — see Open Question OQ-1 + Catalog Completeness Risk. Domain descriptions populated [VERIFIED: `compiled-domains.ts:10`]. |
| MAGI-01 | Cleric domains with custom Puerta domains | 27 domains extracted including `domain:pb-suerte` (custom Puerta) [VERIFIED: `compiled-domains.ts:71-99`]. **Caveat:** all `grantedFeatIds: []`. |
| MAGI-02 | User sees how domains/classes/progress affect available spells | Spells carry `classLevels: { "class:wizard": 6 }` [VERIFIED: `compiled-spells.ts:8945-8947`]. Selectors must filter by class + caster level. |
| MAGI-03 | User can choose spells, known spells, magic selections per class+level | Slot tables present for 7 classes [VERIFIED: `compiled-spells.ts:7137` `spellKnownTables`, line 9 `spellGainTables`]. |
| MAGI-04 | Planner uses Puerta custom + revised spell list | `compiled-spells.ts` already extracted from local nwsync (376 player-castable spells). VALI-04 satisfaction depends on missing-data fail-closed handling. |
| VALI-01 | Block illegal builds (no warn-only) | D-08 hybrid block model + D-10 export-gate semantics. Status discriminated union exists [VERIFIED: `validation-outcome.ts:14-19,42-66`]. |
| VALI-02 | Precise + readable explanations | `feat-prerequisite.ts:75-262` produces per-prereq Spanish-labeled `PrerequisiteCheck[]`. Mirror this for spells. |
| VALI-03 | Auto recompute on every change | Already de-facto behavior via zustand subscriptions; D-05 codifies it. |

---

## Standard Stack

### Core (no additions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.2 | Discriminated unions for ValidationOutcome, status enums | [VERIFIED: package.json:23]. Already locked by project. |
| React | 19.2.0 | UI components | [VERIFIED: package.json:21] |
| zustand | latest (5.x) | Store per feature | [VERIFIED: package.json:32]. Established pattern (foundation/progression/skill/feat stores). |
| Zod | 4.3.5 | Catalog boundary validation only | [VERIFIED: package.json:30]. Already validating `compiled-domains.ts` and `compiled-spells.ts` at import. |
| Vitest | 4.0.16 | Test runner | [VERIFIED: package.json:29] |

**No new dependencies required for Phase 7.** All work is pure TS + existing stack.

### Architectural Patterns to Reuse

| Pattern | Source | Reuse As |
|---------|--------|----------|
| Pure rules-engine validation function | `packages/rules-engine/src/feats/feat-prerequisite.ts:75-262` | `evaluateSpellPrerequisites`, `evaluateDomainAvailability` |
| `BuildStateAtLevel` snapshot interface | `feat-prerequisite.ts:10-27` | Extend with `casterLevelByClass: Record<CanonicalId, number>`, `arcaneSpellFailure: number`, `spellbookEntries: Record<level, SpellId[]>`, `knownSpells: Record<class, Record<level, SpellId[]>>`, `domains: SetOf<DomainId>`. **`spellcastingLevel` already exists at line 26 hardcoded to 0 — must compute it.** |
| Cascade revalidation with inherited break | `packages/rules-engine/src/feats/feat-revalidation.ts:74-191` (or `skills/skill-revalidation.ts:56-122` — same pattern) | `revalidateMagicSnapshotAfterChange` with same `inheritedBreakLevel` accumulator |
| `ValidationOutcome` discriminated union | `packages/rules-engine/src/contracts/validation-outcome.ts:14-66` | Use `blocked + blockKind: 'missing-source'` for empty descriptions / empty grantedFeatIds; `illegal + RULE_FAILED` for prereq fails |
| Per-class flooring before sum | `feats/bab-calculator.ts:26-47` | Spells-per-day stacking — each class contributes its own slot row, sum across classes |
| Selector composing multi-store | `apps/planner/src/features/feats/selectors.ts:123-211` (`computeBuildStateAtLevel`) | `computeMagicBuildStateAtLevel` extension |
| Per-level zustand store + active-level | `feats/store.ts:10-88` | `useMagicStore` with per-level `MagicLevelRecord { domains, spellbookAdditions, knownSpells, swapsApplied }` |
| Sequential-step UI flow | `feats/feat-board.tsx` + `selectors.ts:372-378` `sequentialStep` | `magia` paradigm dispatch (cleric-l1-domains → spellbook | known-spells | summary) |
| Replace placeholder in `center-content.tsx` | `center-content.tsx:31-32` (placeholder for `case 'spells':`) | Replace with `<MagicBoard />` |
| Replace placeholder in `character-sheet.tsx` | `character-sheet.tsx:106-111` (`SpellsPanel`) | Replace with `<MagicSheetTab />` |

### Sub-step naming

UI-SPEC says "add `'magia'`" but the existing union is `LevelSubStep = 'class' | 'skills' | 'feats' | 'spells'` [VERIFIED: `apps/planner/src/lib/sections.ts:4`]. The `'spells'` slot is **already declared, labeled "Conjuros", and routed to a placeholder** [VERIFIED: `lib/sections.ts:32`, `center-content.tsx:31-32`, `lib/copy/es.ts:169`]. Switching the union from `'spells'` to `'magia'` ripples through `levelSubSteps`, `stepTitles`, `sheetTabs.spells`, plus tests in `tests/phase-02` / `tests/phase-05.2`. **Recommend: keep the existing `'spells'` identifier for the sub-step union to avoid breaking existing tests + copy keys.** Use "Magia" as the *display label* (already what UI-SPEC mandates, just at the copy layer). The codebase already calls the sheet tab `spells` (see `sheetTabs.spells` in `lib/copy/es.ts:175`) and the user-visible string is "Conjuros" — both can stay. This is a Claude's-discretion area per CONTEXT.md "Internal module layout".

---

## Architecture Patterns

### System Architecture Diagram

```
                                                                  
┌─────────────────────────────────────────────────────────────────────┐
│  USER INTERACTION (zustand store commit)                              │
│  e.g. setSpellbookEntry(level=3, spellId='spell:fireball')             │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MULTI-STORE SELECTOR (apps/planner/src/features/magic/selectors.ts)  │
│  selectMagicBoardView(magicState, foundationState, progressionState,  │
│                       skillState, featState)                          │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  computeMagicBuildStateAtLevel(L) — extends computeBuildStateAtLevel  │
│  Adds: casterLevelByClass, arcaneSpellFailure, spellbookEntries,      │
│         knownSpells, domains, classSpellAccess                        │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PURE RULES ENGINE (packages/rules-engine/src/magic/)                 │
│                                                                       │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐    │
│  │ caster-level.ts     │───▶│ spell-eligibility.ts             │    │
│  │ - computeCasterLvl  │    │ - getEligibleSpellsAtLevel       │    │
│  │ - computeSpellSlots │    │ - getEligibleDomains             │    │
│  └─────────────────────┘    └──────────────┬───────────────────┘    │
│                                            │                         │
│  ┌─────────────────────┐                   ▼                         │
│  │ catalog-fail-closed │    ┌──────────────────────────────────┐    │
│  │ - missingDescription│───▶│ spell-prerequisite.ts            │    │
│  │ - missingGrantFeats │    │ - evaluateSpellPrerequisites     │    │
│  └─────────────────────┘    │ - evaluateDomainSelection        │    │
│                              └──────────────┬───────────────────┘    │
│                                            │                         │
│                                            ▼                         │
│                              ┌──────────────────────────────────┐    │
│                              │ magic-revalidation.ts            │    │
│                              │ - revalidateMagicSnapshot...     │    │
│                              │   (inherited break cascade)      │    │
│                              └──────────────┬───────────────────┘    │
│                                            │                         │
│                                            ▼                         │
│                              ┌──────────────────────────────────┐    │
│                              │ magic-legality-aggregator.ts     │    │
│                              │ - aggregateMagicLegality(snap)   │    │
│                              │   ⇒ { status, perLevel[],         │    │
│                              │       repairCount, illegalCount } │    │
│                              └──────────────┬───────────────────┘    │
└─────────────────────────────────────────────┼───────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SHELL SUMMARY SEVERITY PROJECTION                                    │
│  apps/planner/src/state/planner-shell.ts (extend validationStatus)    │
│  Order: foundation > progression > skills > feats > MAGIC > legal     │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  UI RENDERS                                                            │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐    │
│  │ <MagicBoard/>       │  │ <MagicSheetTab/>  (character-sheet) │    │
│  │  ├ <SpellLevelTabs/>│  │  - read-only per-class summary       │    │
│  │  ├ <DomainTileGrid/>│  │  - groups, slot table, repair flags  │    │
│  │  ├ <MagicSheet/>    │  └────────────────────────────────────┘    │
│  │  └ <MagicDetailPanel/>                                              │
│  │      └─ rejection prereq list                                      │
│  └─────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
packages/rules-engine/src/magic/
├── caster-level.ts              # computeCasterLevelByClass, computeSpellsPerDay
├── spell-eligibility.ts         # getEligibleSpellsAtLevel, getEligibleDomains
├── spell-prerequisite.ts        # evaluateSpellPrerequisites
├── domain-rules.ts              # evaluateDomainSelection
├── magic-revalidation.ts        # revalidateMagicSnapshotAfterChange (cascade)
├── magic-legality-aggregator.ts # aggregateMagicLegality (full-build view)
├── catalog-fail-closed.ts       # detectMissingCatalogData → ValidationOutcome[]
└── index.ts                     # barrel export

apps/planner/src/features/magic/
├── compiled-magic-catalog.ts    # re-export compiledSpellCatalog + compiledDomainCatalog
├── store.ts                     # useMagicStore (per-level slices)
├── selectors.ts                 # selectMagicBoardView, selectMagicSheetTabView, selectMagicSummary
├── magic-board.tsx              # routed center component
├── magic-sheet.tsx              # left pane paradigm dispatcher
├── magic-detail-panel.tsx       # right pane (description + prereq breakdown)
├── spell-level-tabs.tsx         # 0..9 tablist
├── domain-tile-grid.tsx         # cleric-l1 only
├── spell-row.tsx                # single spell entry
├── magic-sheet-tab.tsx          # character-sheet read-only summary
└── swap-spell-dialog.tsx        # sorcerer/bard swap (ConfirmDialog wrapper)

tests/phase-07/
├── caster-level.spec.ts
├── spell-eligibility.spec.ts
├── spell-prerequisite.spec.ts
├── domain-rules.spec.ts
├── magic-revalidation.spec.ts
├── magic-legality-aggregator.spec.ts
├── magic-store.spec.ts
└── catalog-fail-closed.spec.ts
```

### Pattern 1: Caster Level Stacking

**What:** Multiclass casters compute caster level per class independently, never sum across classes (NWN1 EE behavior — distinct from D&D 3.5 prestige class spell-list inheritance which Puerta does not honor for v1).

**Code shape:**

```typescript
// packages/rules-engine/src/magic/caster-level.ts
// Source: pattern mirrors bab-calculator.ts:26-47
export function computeCasterLevelByClass(
  classLevels: Record<string, number>,
  classCatalog: ClassCatalog,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [classId, level] of Object.entries(classLevels)) {
    const classDef = classCatalog.classes.find((c) => c.id === classId);
    if (classDef?.spellCaster && classDef.spellGainTableRef) {
      // Half-caster classes (paladin, ranger) use floor((classLevel - 3) / 1) ?
      // Actually NWN reads cls_spgn_pal/cls_spgn_rang where caster level = class level
      // and the 2DA itself encodes the half-progression by having empty rows < 4.
      // So: caster level = class level, and slot count comes from the table.
      result[classId] = level;
    }
  }
  return result;
}
```

**When to use:** Anywhere spell slots, spell access, or spellcasting prereqs are computed.

### Pattern 2: Catalog Fail-Closed

**What:** Per VALI-04 (already-shipped, must-not-regress) and CONTEXT D-13 fallback rules, when catalog data is empty/missing the planner produces `blocked + blockKind: 'missing-source'` rather than treating absence as legal.

**Code shape:**

```typescript
// packages/rules-engine/src/magic/catalog-fail-closed.ts
import { resolveValidationOutcome } from '../contracts/validation-outcome';

export function detectMissingDomainData(
  domainId: string,
  catalog: DomainCatalog,
): ValidationOutcome | null {
  const dom = catalog.domains.find(d => d.id === domainId);
  if (!dom) {
    return resolveValidationOutcome({
      affectedIds: [domainId],
      blockKind: 'missing-source',
      hasConflict: false, hasMissingEvidence: true, passesRule: false, ruleKnown: true,
    });
  }
  if (dom.grantedFeatIds.length === 0) {
    return resolveValidationOutcome({
      affectedIds: [domainId],
      blockKind: 'missing-source',
      hasConflict: false, hasMissingEvidence: true, passesRule: false, ruleKnown: true,
    });
  }
  return null;
}

export function detectMissingSpellData(
  spellId: string,
  catalog: SpellCatalog,
): ValidationOutcome | null {
  const sp = catalog.spells.find(s => s.id === spellId);
  if (!sp) { /* ... blocked missing-source ... */ }
  if (sp.description === '') {
    // VALI-02 cannot satisfy "explicación legible" without description.
    return resolveValidationOutcome({
      affectedIds: [spellId],
      blockKind: 'missing-source',
      hasConflict: false, hasMissingEvidence: true, passesRule: false, ruleKnown: true,
    });
  }
  return null;
}
```

### Pattern 3: Revalidation Cascade (reuse)

The exact cascade pattern from `feat-revalidation.ts:74-191` and `skill-revalidation.ts:56-122` already handles: per-level evaluation, `inheritedBreakLevel` accumulator, deduplicated issue list, `pending`/`legal`/`blocked`/`illegal` status. The planner team has executed this twice; magic should be the third instance with no innovation.

### Anti-Patterns to Avoid

- **Storing computed slot counts in the magic store** — recompute via selector; storing creates drift on attribute changes (mirror Phase 5 skills decision: see `STATE.md:91` "Skill legality and repair status are recomputed from raw per-level allocations instead of being stored in UI state").
- **Hardcoding NWN1 spell rules** in TS constants — every numeric rule (slot count, swap cadence, INT-mod scribing, prepared-caster bonus spell formula) must come from catalog data or be a TODO/CITED comment that points back to the override registry. Project memory: "Verify against game files — Never hardcode NWN data; extract from nwsync/BIF first" [`MEMORY.md:feedback_check_game_rules.md`].
- **Computing magic legality inside React components** — selectors only. The `feat-detail-panel.tsx` precedent of calling `evaluateFeatPrerequisites` directly from the component is acceptable for on-demand display but never for the cascade aggregator.
- **Crossing rules-engine → planner imports** — `packages/rules-engine/` may import from `@data-extractor/contracts/*` (already established) but NEVER from `@planner/*`.
- **Auto-deleting downstream selections on upstream change** — D-06 prohibits. Always preserve + mark.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-class slot table indexing | Custom `getSlotsForLevel` formulas | Lookup `compiledSpellCatalog.spellGainTables[classId][casterLevel-1].slots[spellLevel]` | Tables already extracted; formulas drift from server data. |
| Spell prereq evaluation | New evaluator structure | Mirror `feat-prerequisite.ts:75-262` API shape (`PrerequisiteCheckResult { met, checks: PrerequisiteCheck[] }`) | Consistent UX between feat and spell rejection text; keeps UI templates shared. |
| Cascade repair on upstream change | New cascade algorithm | Copy `feat-revalidation.ts:74-191` body, swap evaluator | Established pattern with two prior implementations; unifies severity model. |
| Status enums | New `MagicEvaluationStatus` | Reuse `FeatEvaluationStatus = 'legal' | 'illegal' | 'blocked' | 'pending'` from `feat-revalidation.ts:12` | Shell summary projection (D-09) consumes a unified enum. |
| Validation message structure | New error object | Reuse `ValidationOutcome` discriminated union from `validation-outcome.ts:14-66` | The `blockKind: 'missing-source'` case is exactly what catalog-fail-closed needs. |
| Spanish ability/save labels | New `MAGIC_LABELS` constants | Reuse `ABILITY_LABELS` from `feat-prerequisite.ts:53-60` | Already canonical Spanish; avoid duplicate maintenance. |
| Detail panel layout | New panel | Use `DetailPanel` primitive (`UI-SPEC: existing primitives to reuse`) | UI-SPEC mandates it. |
| Confirm dialogs (Eliminar / Swap) | New modal | Reuse `ConfirmDialog` primitive (`UI-SPEC`) | UI-SPEC mandates. |

**Key insight:** Phase 7's hard problem is not the rules engine — it's the **catalog completeness gap**. Every "don't hand-roll" entry above leverages a pattern that has already shipped twice (skills then feats). The plan should be a third execution of the same pattern, not invention.

---

## Runtime State Inventory

This phase introduces new client-side state but no rename/migration. Skip-condition does not apply because new persistent state shape may affect a future Phase 8 import/export schema.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 7 is greenfield store creation. Phase 8 will design persistence/sharing schema for `magicStore.levels[]`. | None this phase. Document the store shape clearly so Phase 8 can serialize it. |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets / env vars | None | None |
| Build artifacts | None — `compiled-spells.ts` and `compiled-domains.ts` already in repo, generated by extractor. If Plan 07-01 patches the extractor (per OQ-1), regenerate via `node packages/data-extractor/dist/cli.js` and commit the regenerated `.ts` files. | If extractor is changed: re-run extraction, commit updated compiled `.ts` files. |

---

## Catalog Completeness Risk

**This is the #1 risk for Phase 7. The plan must address it before any UI work.**

### Verified gaps in compiled-spells.ts (376 spells)

| Field | State | Evidence | Impact |
|-------|-------|----------|--------|
| `label` | Spanish, populated | [VERIFIED: spot check across rows 8951, 8964, 8976, 8988, 9001] e.g. "Bruma ácida", "Auxilio divino", "Reanimar a los muertos" | UI labels OK. |
| `description` | **Empty for ALL 376 spells** | [VERIFIED: `Grep '"description": ""'` returned 376 matches in `compiled-spells.ts`] | `MagicDetailPanel` body has nothing to render → VALI-02 cannot show a "readable explanation". |
| `school` | Populated, English keys | [VERIFIED: line 8952 `"school": "conjuration"`] | UI eyebrow tag will show English unless translated in selector. |
| `classLevels` | Populated, real | [VERIFIED: line 8945 `"class:wizard": 6`] | Spell-eligibility filtering works. |
| `innateLevel` | Populated | [VERIFIED: line 8950 `"innateLevel": 6`] | Slot index works. |
| `spellGainTables` | Populated for 7 classes (bard, cleric, druid, paladin, ranger, sorcerer, wizard) | [VERIFIED: `Grep "spellKnownTables"` at line 7137; spellGainTables block 9-7136] | OK for MAGI-03. **Caveat:** all 7 loaded from `basegame` BIF, not nwsync [VERIFIED: extraction-report.txt:131-135] — confirms Puerta did not customize slot progressions. |
| `spellKnownTables` | Populated for bard + sorcerer | [VERIFIED: line 7137-7138 `"class:bard"`] | OK for spontaneous casters. |

### Verified gaps in compiled-domains.ts (27 domains)

| Field | State | Evidence | Impact |
|-------|-------|----------|--------|
| `label` | Spanish | [VERIFIED: line 13 "Aire", 42 "Animal", 73 "Suerte", 104 "Muerte"] | OK. |
| `description` | Spanish, populated, multi-line with embedded structure | [VERIFIED: line 10 multi-line description with "Aptitudes especiales y conjuros adicionales del dominio"] | Detail panel works. |
| `grantedFeatIds` | **Empty for ALL 27 domains** | [VERIFIED: `Grep "grantedFeatIds": \[\]` returned 27/27 matches] | UI-SPEC "APTITUDES" eyebrow tag has no data; domain tile grant-list cannot render. |
| `spellIds` per level | Populated and cross-referenced | [VERIFIED: line 18-35 — `spell:gust-of-wind`, `spell:call-lightning`, etc.] | Bonus-spell feature works. |
| Custom Puerta domains | Present | [VERIFIED: `domain:pb-suerte` line 71-99 has `pb-` prefix indicating Puerta custom] | MAGI-01 satisfied. |

### Root cause analysis

**Spell descriptions:** The spell assembler reads `row.Description` strref and resolves via `tlkResolver.resolve()` [VERIFIED: `spell-assembler.ts:175-178`]. It correctly emits a warning when `nameStrref != null && !resolvedName` [VERIFIED: line 181] — but **does not emit the symmetric warning when `descStrref != null && !resolvedDesc`**. Hence the silent failure: 376 empty descriptions and zero warnings in the report. Either:
- (a) The TLK resolver is failing silently for description strrefs (resolver bug or wrong strref offset); or
- (b) The `spells.2da` Description column is itself empty/`****` for the player-castable subset (in which case `descStrref == null` and no warning is even attempted).

**Domain granted feats:** All 27 domain GrantedFeat references resolve to row indices in feats.2da that exist in the underlying 2DA but were **filtered out** of the player-facing `compiled-feats.ts` by the feat assembler's "player feat" filter [VERIFIED: extraction-report.txt:138-164 + `06-01-SUMMARY.md:35` confirms ~99 feats are intentionally filtered as "internal-only"]. The domain assembler's `featIdsByRow.get(grantedFeatIndex)` lookup misses because the target feats are not in the map [VERIFIED: `domain-assembler.ts:122-134`].

### Remediation options for plan 07-01

| Option | Effort | Risk | Decision Needed |
|--------|--------|------|-----------------|
| A. Fix extractor to emit Description warning + diagnose root cause | 2-3h | Low. Symmetric to existing Name warning. Then either fix TLK resolver or document as 2DA-source-data gap. | Recommended — without descriptions, VALI-02 fails. |
| B. Allow domain assembler to reference internal feats (separate "domain-granted feats" sub-catalog) | 2h | Low. Add a second `domainFeats: CompiledFeat[]` array to feat catalog OR pass an unfiltered `featIdsByRow` to the domain assembler. | Recommended — MAGI-01 + UI-SPEC eyebrow tag depend on this. |
| C. Hand-author Spanish description override file under override registry (`packages/data-extractor/src/overrides/spell-descriptions.es.json`) | 4-8h, ongoing | High. ~376 spells × manual translation = drift risk. | Defer unless A fails entirely. |
| D. Render `MagicDetailPanel` with empty-description gracefully (e.g., "Descripción no disponible — completar en próxima extracción") | 30min | Low. UX degraded. | Required as a fallback regardless of A/B/C. |
| E. Mark spells with empty descriptions as `blocked + blockKind: 'missing-source'` so they cannot be selected | 2h | Aggressive. Would block all 376 spells. Only safe **after** A succeeds. | Defer until A is evaluated. |

**Recommendation for plan structure:** Plan 07-01 must include extractor option A + B as Wave 0 task; Plan 07-02 implements UI assuming A+B succeeded; Plan 07-03 implements option D as fallback for any residual gaps.

### Spell school translation gap

`compiled-spells.ts` school values are English keys (`"conjuration"`, `"evocation"`, etc.) — [VERIFIED: line 8952]. UI-SPEC §Typography eyebrow `"School of magic tag"` expects Spanish display. Add a SCHOOL_LABELS map in `apps/planner/src/features/magic/selectors.ts` mirroring `ABILITY_LABELS` from `feat-prerequisite.ts:53-60`:

```typescript
const SCHOOL_LABELS_ES: Record<string, string> = {
  abjuration: 'Abjuración',
  conjuration: 'Conjuración',
  divination: 'Adivinación',
  enchantment: 'Encantamiento',
  evocation: 'Evocación',
  illusion: 'Ilusión',
  necromancy: 'Nigromancia',
  transmutation: 'Transmutación',
  unknown: 'Desconocida',
};
```

[ASSUMED: standard D&D 3.5 Spanish school translations; verify with Puerta server documentation.]

---

## Common Pitfalls

### Pitfall 1: Empty Spell Descriptions Discovered During UI Development

**What goes wrong:** UI dev wires `MagicDetailPanel` body to `spell.description`, sees blank panels, scrambles for fallback copy late in the phase.

**Why it happens:** Catalog gap (376/376 empty) is invisible in JSON inspection unless explicitly grep'd.

**How to avoid:** Plan 07-01 explicit task to grep + report empty `description`/`grantedFeatIds` before any UI work. Make catalog remediation a Wave 0 dependency.

**Warning signs:** Detail panel renders with title but no body. School tag shows English ("conjuration"). Domain tile shows label but no grants list.

### Pitfall 2: Sub-step naming inconsistency

**What goes wrong:** UI-SPEC says "add `'magia'`" but the existing union slot is `'spells'`. Implementing a new `'magia'` member while leaving `'spells'` orphaned causes router branches that never fire and dead test fixtures.

**Why it happens:** UI-SPEC was written against an aspirational model; the codebase had `'spells'` reserved as a placeholder since Phase 2.

**How to avoid:** Treat the existing `'spells'` identifier as the union member. Use "Magia" as the *visible label only*, updating `lib/copy/es.ts:169` from "Conjuros" → "Magia" if the user prefers Magia, or keeping "Conjuros" (matches `sheetTabs.spells` and existing tests). Either way, do not duplicate the union member.

**Warning signs:** Tests in `tests/phase-02` or `tests/phase-05.2` start failing on "Conjuros" string match.

### Pitfall 3: Multiclass Caster Level Confusion

**What goes wrong:** Plan computes a single `spellcastingLevel` integer summed across classes (mirroring `BuildStateAtLevel:26`'s placeholder shape). Multiclass cleric/wizard then becomes a 5+5=10th-level caster of both, which is wrong.

**Why it happens:** Feat prereq `minSpellLevel` reads a single int, but spell slots are per-class.

**How to avoid:** Replace `spellcastingLevel: number` with `casterLevelByClass: Record<CanonicalId, number>` and a derived helper `getMaxSpellLevelAcrossClasses(state): number` for feat prereqs that genuinely need a max (e.g., epic feats requiring "9th-level spell access").

**Warning signs:** Cleric 5 / Wizard 5 character can take feats that require 6th-level spell access.

### Pitfall 4: Cascade Cycle in `computeBuildStateAtLevel`

**What goes wrong:** Magic-state computation needs feat-list (for metamagic / spell-related feats); feat-state computation needs spell-list (for `minSpellLevel` prereq). Naive recompute creates infinite loop.

**Why it happens:** `feats/selectors.ts:209` already passes `spellcastingLevel: 0` because it can't yet compute it. Phase 7 introduces the back-edge.

**How to avoid:** Compute in fixed phase order each commit:
1. Foundation → derive ability scores
2. Progression → derive class levels, BAB, saves
3. Skills → derive skill ranks
4. **Magic phase 1: caster-level only** (no feat input needed)
5. Feats → use casterLevelByClass for `minSpellLevel` checks
6. **Magic phase 2: spell selection legality** (uses selected feats for metamagic slot adjustments)

This is two passes through magic per commit. Acceptable per D-07 (< 50ms target) — both passes are O(levels × classes), with ~16 levels × ≤14 caster classes = ≤224 iterations.

**Warning signs:** Stack overflow in selectors. Tests timeout. Commit triggers re-render storm.

### Pitfall 5: Sorcerer/Bard Swap Levels — D&D 3.5 vs NWN1 EE Semantics

**What goes wrong:** Implementing the swap-only-at-specific-levels rule (sorcerer 4/8/12/16) per CONTEXT D-15, but NWN1 may permit free swap on every level-up.

**Why it happens:** D-15 cites the D&D 3.5 tabletop rule. WebSearch reveals NWN1 (original) allowed free swap; NWN2 introduced the level-restriction rule. NWN1 EE behavior + Puerta-specific override are unverified.

**How to avoid:** Open question OQ-3. If unverifiable in time, implement the conservative D-15 rule (per CONTEXT.md decision) and emit a TODO comment + open Phase 8 deferred item to revisit with server documentation.

**Warning signs:** Players report they can swap at sorcerer level 5 in-game but planner blocks it.

### Pitfall 6: Domain GrantedFeatIds Empty → Eyebrow Tag Crashes

**What goes wrong:** `DomainTileGrid` reads `domain.grantedFeatIds[0]` to render the "APTITUDES" eyebrow; gets `undefined`; throws or renders empty bullet list.

**Why it happens:** All 27 domains have `[]`.

**How to avoid:** Render-side guard: `domain.grantedFeatIds.length > 0 ? <EyebrowList .../> : <EyebrowList items={['(pendiente extracción)']} />`. Combined with Plan 07-01 fix to repopulate the field.

**Warning signs:** UI renders correctly for one domain (the cleric default) but the panel below "APTITUDES" header is blank for all 27.

### Pitfall 7: VALI-02 "Readable Explanation" Without Description Data

**What goes wrong:** Rejection panel shows "Spell X requires caster level 5 — current 3", which is the prereq chain, but user clicks the spell row to see a full description and gets nothing.

**Why it happens:** Description is empty.

**How to avoid:** This is a hard fail of LANG-02 + VALI-02. Plan must either resolve the extractor gap (preferred) or include text-fixture overrides for at least the most common ~50 spells (acceptable degraded MVP).

**Warning signs:** UAT reports "I can see why my pick was rejected, but I don't know what the spell does."

---

## Code Examples

### Computing eligible spells at a level (selector → engine)

```typescript
// packages/rules-engine/src/magic/spell-eligibility.ts
import type { SpellCatalog, CompiledSpell } from '@data-extractor/contracts/spell-catalog';
import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';

export interface SpellEligibilityInput {
  classId: string;
  casterLevel: number;        // class level for this casting class
  spellLevel: number;         // 0..9, the spell-level row to evaluate
  catalog: SpellCatalog;
  classCatalog: ClassCatalog;
  alreadyKnown: Set<string>;  // for dedupe (wizard spellbook, sorc/bard known)
}

export interface SpellEligibilityResult {
  eligible: CompiledSpell[];
  ineligible: Array<{ spell: CompiledSpell; reason: string }>;
}

export function getEligibleSpellsAtLevel(input: SpellEligibilityInput): SpellEligibilityResult {
  const { classId, casterLevel, spellLevel, catalog, alreadyKnown } = input;

  const eligible: CompiledSpell[] = [];
  const ineligible: Array<{ spell: CompiledSpell; reason: string }> = [];

  for (const spell of catalog.spells) {
    const requiredLevel = spell.classLevels[classId];
    if (requiredLevel == null) continue; // not on this class's list

    if (requiredLevel !== spellLevel) continue; // not at this spell level
    if (alreadyKnown.has(spell.id)) {
      ineligible.push({ spell, reason: 'Ya conocido' });
      continue;
    }
    eligible.push(spell);
  }

  return { eligible, ineligible };
}
```

### Catalog fail-closed integration

```typescript
// packages/rules-engine/src/magic/magic-legality-aggregator.ts
import { detectMissingSpellData, detectMissingDomainData } from './catalog-fail-closed';

export function aggregateMagicLegality(input: AggregateMagicInput): MagicAggregateView {
  const issues: ValidationOutcome[] = [];
  const perLevel: PerLevelMagic[] = [];

  for (const lvl of input.magicLevels) {
    // Fail-closed BEFORE any rule check
    for (const spellId of lvl.spellbookEntries ?? []) {
      const missing = detectMissingSpellData(spellId, input.spellCatalog);
      if (missing) issues.push(missing);
    }
    for (const domainId of lvl.domains ?? []) {
      const missing = detectMissingDomainData(domainId, input.domainCatalog);
      if (missing) issues.push(missing);
    }
    // ... then prereq evaluation, then capacity checks ...
  }

  // VALI-04 alignment: any 'blocked + missing-source' makes the whole magic phase non-legal
  const overallStatus: MagicEvaluationStatus = issues.some(i => i.status === 'illegal') ? 'illegal'
    : issues.some(i => i.status === 'blocked') ? 'blocked'
    : 'legal';

  return { status: overallStatus, issues, perLevel };
}
```

### Planner-shell severity extension

```typescript
// apps/planner/src/state/planner-shell.ts (extension only — additive)
// Source: extends current usePlannerShellStore at line 22
export type PlannerValidationStatus =
  | 'blocked'
  | 'illegal'
  | 'legal'
  | 'pending'
  | 'repair_needed'; // NEW for D-09 magic tier (already maps to 'blocked' visual)

// New selector composition consumed by SummaryStrip (already wired per Phase 5/6 selectors):
function projectSeverity(s: AllStores): PlannerValidationStatus {
  if (s.foundation.status === 'illegal' || s.foundation.status === 'blocked') return s.foundation.status;
  if (s.progression.status === 'illegal' || s.progression.status === 'blocked') return s.progression.status;
  if (s.skills.status === 'illegal' || s.skills.status === 'blocked') return s.skills.status;
  if (s.feats.status === 'illegal' || s.feats.status === 'blocked') return s.feats.status;
  if (s.magic.status === 'illegal') return 'illegal';            // NEW
  if (s.magic.status === 'blocked') return 'repair_needed';     // NEW (D-08 soft block)
  return 'legal';
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded spell catalogs in TS | Compiled from nwsync via extractor | Phase 05.1 (2026-04-15) | Catalogs are real data; gaps real |
| Single `spellcastingLevel: number` in BuildStateAtLevel | Per-class caster level map | Phase 7 introduces (now) | Multiclass casters validated correctly |
| No magic UI (placeholder in center-content) | Full `MagicBoard` + paradigm dispatcher | Phase 7 introduces | Players can complete magic planning |
| Placeholder `SpellsPanel` in character sheet | `MagicSheetTab` read-only summary | Phase 7 introduces | Sheet tab shows real magic state |

**Deprecated/outdated:**
- The `'spells'` `LevelSubStep` placeholder routing → not deprecated, *to be filled in* this phase.
- The `BuildStateAtLevel.spellcastingLevel: 0` hardcode at `feats/selectors.ts:209` → replaced by computed `casterLevelByClass` in Phase 7.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Sorcerer/bard swap levels in NWN1 EE follow D&D 3.5 (sorc 4/8/12/16, bard 5/8/11/14) per D-15 | CONTEXT D-15 / Specifics | If NWN1 EE allows free swap on every level-up, planner over-restricts users. WebSearch (Beamdog Forums) suggests NWN1 may allow free swap. See Open Question OQ-3. |
| A2 | Wizard spellbook initial size at level 1 = "3 + INT mod" cantrips known + "3 + INT mod" 1st-level spells (per CONTEXT specifics) | CONTEXT Specifics | WebSearch (nwn.fandom.com / nwn.wiki) suggests NWN1 wizard learns **all cantrips** + (3 + INT mod) 1st-level spells. CONTEXT may be wrong. See Open Question OQ-2. |
| A3 | Standard Spanish school-of-magic translations (Abjuración, Conjuración, etc.) match Puerta's terminology | Code Examples §SCHOOL_LABELS_ES | Players see English fallback or mistranslation. Verify with one Puerta forum thread or in-game screenshot. |
| A4 | NWN1 EE multiclass casters do NOT pool caster levels across classes (cleric 5/wizard 5 = 5th caster of each, not 10th of either) | Pattern 1 | If wrong, slot computation produces fewer slots than the engine grants. Standard NWN1 documented behavior; very low risk. |
| A5 | Paladin/ranger spell access starts at class level 4 (CONTEXT specifics) — encoded in cls_spgn_pal/cls_spgn_rang via empty rows < 4 | Pattern 1 | If the table actually starts row 0 = level 1 with zero slots, our `casterLevel = level` direct mapping is correct. Verify against `compiled-spells.ts spellGainTables['class:paladin']` first row's `casterLevel`. |
| A6 | Custom Puerta paladin variants (PALA, PALO, PALV, ALMA, ING) follow the same per-class slot/known-table conventions as base paladin/sorcerer/wizard | Standard Stack §Sub-step naming + extraction-report | High risk. These are server-custom prestige classes; their spell tables may have non-standard column conventions. Plan must include a Wave 0 inspection task. |
| A7 | Domain alignment-restriction rules (e.g., "Bien" requires non-evil cleric, "Mal" requires non-good) follow D&D 3.5 default | Pattern 2 / D-08 | If Puerta has custom alignment rules per domain, planner permits illegal selections. Domain alignment data NOT in extractor — would need override file. |

---

## Open Questions

1. **OQ-1 — Spell descriptions empty: TLK resolver bug or 2DA source data gap?**
   - What we know: 376/376 empty. Extractor warns on empty *names* (line 109-116 of extraction-report) but never on empty *descriptions* (asymmetric warning logic in `spell-assembler.ts:181-183`).
   - What's unclear: Is `descStrref` itself null/zero in `spells.2da` (no description offset), or does the strref point somewhere the TLK resolver fails to resolve?
   - Recommendation: Plan 07-01 task: log `descStrref` and `tlkResolver.resolve(descStrref)` for the first 10 spells to diagnose. Likely a TLK index issue (Puerta uses a custom TLK; description strrefs may exceed base TLK range and require a custom-TLK lookup chain).

2. **OQ-2 — Wizard initial spellbook formula: "3 + INT mod cantrips" or "all cantrips"?**
   - What we know: CONTEXT specifies "3 + INT mod cantrips known + (3 + INT mod) 1st-level spells". WebSearch (nwn.wiki) says "all cantrips + 3 + INT mod 1st level".
   - What's unclear: Which is correct for NWN1 EE? Puerta may have customized.
   - Recommendation: Plan 07-01 task: read the wizard CLS_SPKN table from compiled catalog to see the level-1 known counts. Or, since wizards in NWN are prepared casters with no separate "known" cap on cantrips, consider: do they have a known-cap at all, or does the spellbook just pool? Defer to user clarification if unresolvable. Conservative fallback: assume "all cantrips + 3 + INT mod 1st level" (matches both NWN1 wiki and the standard 3.5 SRD).

3. **OQ-3 — Sorcerer/bard swap cadence in NWN1 EE / Puerta**
   - What we know: D-15 picks the D&D 3.5 cadence. WebSearch indicates original NWN allowed free swap.
   - What's unclear: NWN1 EE behavior; Puerta server policy.
   - Recommendation: Implement D-15 conservatively (matches CONTEXT decision). Add a TODO comment in `magic-rules.ts` referencing the override-registry path so a server-rule override can switch the cadence later. Defer to user before plan execution.

4. **OQ-4 — How should `repair_needed` differ visibly from `blocked`?**
   - What we know: D-08 + D-09 introduce a soft-block tier. UI-SPEC line 110 says `is-repair-needed` uses amber border + selection fill (different from `is-illegal` red). Planner-shell currently has only `'blocked' | 'illegal' | 'legal' | 'pending'`.
   - What's unclear: Does the `PlannerValidationStatus` enum need a new `'repair_needed'` member, or does the magic selector just translate its "blocked" output to existing `'blocked'` and let the visual layer disambiguate?
   - Recommendation: Add `'repair_needed'` to the enum (no risk; is additive). Selectors set this status when `magic.aggregator.issues` are all `blockKind: 'missing-source'` or runtime-capacity violations.

5. **OQ-5 — Domain-allowed list per cleric subclass / deity**
   - What we know: 27 domains exist; CONTEXT says "Selecciona 2 dominios" (D-11). Standard cleric picks any 2.
   - What's unclear: Does Puerta restrict domains by deity? We have no deity data (`compiled-deities.ts` is null per Phase 05.1 decision: server uses scripts not 2DA).
   - Recommendation: For v1, allow any cleric to pick any 2 domains (no deity-gated restriction). Document as Phase 8 deferred (deity overrides). This matches CONTEXT's deferred-ideas list.

6. **OQ-6 — Specialist wizards (school specialization) and prohibited schools**
   - What we know: NWN1 EE supports specialist wizards (Abjurer, Conjurer, etc.) via `class:wizard` variants. Phase 7 description doesn't mention specialists.
   - What's unclear: Is school specialization in scope for v1? Phase 6 (feats) didn't include school-of-magic feats either.
   - Recommendation: Out of scope for Phase 7. Document as Phase 8+ deferred or v2 enhancement.

---

## Environment Availability

This phase is purely TypeScript code/config changes. No external CLI tools, services, runtimes, or new dependencies required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest, build | ✓ | 24.x LTS (per CLAUDE.md) | — |
| pnpm | Workspace install | ✓ (per CLAUDE.md) | 10.x | — |
| Vitest | Test execution | ✓ | 4.0.16 | — |
| Vite | Planner build | ✓ | 8.0.0+ | — |
| neverwinter.nim | Only if extractor regen needed | Already used by Phase 05.1 (assume present) | 2.1.2 | If absent: use existing committed `compiled-*.ts` files (no fresh extraction this phase unless OQ-1 demands it) |
| nwsync local snapshot | Only if extractor regen needed | Per Phase 05.1 SUMMARY: present at `~/Documents/Neverwinter Nights/nwsync/`. | — | Same fallback as above |

**Missing dependencies with no fallback:** None.

**Conditional requirement:** If Plan 07-01 requires extractor remediation (OQ-1 fix), neverwinter.nim CLI + nwsync snapshot become required. Plan should detect availability before scheduling that task.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 [VERIFIED: package.json:29] |
| Config file | `vitest.config.ts` [VERIFIED: present at repo root] |
| Quick run command | `pnpm test -- tests/phase-07 --reporter=dot` |
| Full suite command | `pnpm test` |
| Test file extension | `.spec.ts` (NOT `.test.ts` — vitest config restricts: `include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx']`) |
| Setup file | `tests/setup.ts` (loads `@testing-library/jest-dom/vitest`) |
| Phase test directory | `tests/phase-07/` (NEW — Wave 0 must create) |
| Note on `--bail=1` | Phase 5.1 SUMMARY documented: vitest 4.x uses `--bail=1` not `-x` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAGI-01 | Cleric can pick 2 Puerta-supported domains; custom `domain:pb-suerte` selectable | unit | `pnpm test -- tests/phase-07/domain-rules.spec.ts` | ❌ Wave 0 |
| MAGI-01 | Domain selection > 2 produces hard block | unit | same | ❌ Wave 0 |
| MAGI-01 | Domain `grantedFeatIds: []` produces `blocked + missing-source` | unit | `pnpm test -- tests/phase-07/catalog-fail-closed.spec.ts` | ❌ Wave 0 |
| MAGI-02 | Wizard at class level 5 sees only spell levels 0-3 in level-up flow | unit | `pnpm test -- tests/phase-07/spell-eligibility.spec.ts` | ❌ Wave 0 |
| MAGI-02 | Cleric multiclass with wizard: each class shows its own slot table | unit | same | ❌ Wave 0 |
| MAGI-02 | Sorcerer with INT 8 still gets known spells (CHA-driven, not INT) | unit | same | ❌ Wave 0 |
| MAGI-03 | Wizard can add to spellbook within slot cap; over cap is hard-blocked `+` | unit + integration | `pnpm test -- tests/phase-07/spell-eligibility.spec.ts` | ❌ Wave 0 |
| MAGI-03 | Bard known cap respected; selecting beyond cap blocks | unit | same | ❌ Wave 0 |
| MAGI-03 | Sorcerer swap action only at levels 4/8/12/16 (per D-15) | unit | `pnpm test -- tests/phase-07/magic-revalidation.spec.ts` | ❌ Wave 0 |
| MAGI-04 | Custom Puerta spells appear in catalog and respect class-level mapping | unit | `pnpm test -- tests/phase-07/spell-eligibility.spec.ts` | ❌ Wave 0 |
| VALI-01 | Soft block (capacity violation) preserved + gates share/export but doesn't hard-disable `+` | unit | `pnpm test -- tests/phase-07/magic-legality-aggregator.spec.ts` | ❌ Wave 0 |
| VALI-01 | Hard block (alignment-incompatible domain) disables `+` and is uncommittable | unit | `pnpm test -- tests/phase-07/domain-rules.spec.ts` | ❌ Wave 0 |
| VALI-02 | Spell prereq rejection produces `PrerequisiteCheckResult` with per-prereq pass/fail + Spanish labels | unit | `pnpm test -- tests/phase-07/spell-prerequisite.spec.ts` | ❌ Wave 0 |
| VALI-02 | Empty spell description is not silently surfaced — produces `blocked + missing-source` outcome | unit | `pnpm test -- tests/phase-07/catalog-fail-closed.spec.ts` | ❌ Wave 0 |
| VALI-03 | Upstream class change at level 3 cascades to magic at level 5 (preserved + marked) | unit | `pnpm test -- tests/phase-07/magic-revalidation.spec.ts` | ❌ Wave 0 |
| VALI-03 | Ability-score change cascades into spell prereq re-evaluation | integration | `pnpm test -- tests/phase-07/magic-store.spec.ts` | ❌ Wave 0 |
| LANG-02 | Domain labels render Spanish in selector view model | unit | `pnpm test -- tests/phase-07/magic-store.spec.ts` | ❌ Wave 0 |
| LANG-02 | School tags render Spanish (selector translates English catalog keys) | unit | same | ❌ Wave 0 |
| LANG-02 (UI smoke) | MagicBoard renders Spanish copy | smoke (jsdom) | `pnpm test -- tests/phase-07/magic-board.spec.tsx` | ❌ Wave 0 |
| All UI-SPEC | MagicBoard renders without throwing on empty store | smoke | same | ❌ Wave 0 |
| Sub-step routing | `activeLevelSubStep === 'spells'` routes to `<MagicBoard />` (replacing placeholder) | smoke | `pnpm test -- tests/phase-07/center-content.spec.tsx` | ❌ Wave 0 |
| Character sheet | `MagicSheetTab` replaces `SpellsPanel` placeholder | smoke | `pnpm test -- tests/phase-07/magic-sheet-tab.spec.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test -- tests/phase-07 --reporter=dot --bail=1`
- **Per wave merge:** `pnpm test -- tests/phase-07`
- **Phase gate:** `pnpm test` (full suite green) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/phase-07/` directory creation
- [ ] `tests/phase-07/caster-level.spec.ts` — covers casterLevelByClass per class type
- [ ] `tests/phase-07/spell-eligibility.spec.ts` — covers MAGI-02, MAGI-03
- [ ] `tests/phase-07/spell-prerequisite.spec.ts` — covers VALI-02
- [ ] `tests/phase-07/domain-rules.spec.ts` — covers MAGI-01, VALI-01 (hard block)
- [ ] `tests/phase-07/magic-revalidation.spec.ts` — covers VALI-03 cascade
- [ ] `tests/phase-07/magic-legality-aggregator.spec.ts` — covers VALI-01 soft block, full-build aggregation
- [ ] `tests/phase-07/catalog-fail-closed.spec.ts` — covers VALI-02, LANG-02 partial gate
- [ ] `tests/phase-07/magic-store.spec.ts` — covers store CRUD + active-level
- [ ] `tests/phase-07/magic-board.spec.tsx` — UI smoke (jsdom)
- [ ] `tests/phase-07/center-content.spec.tsx` — UI routing smoke
- [ ] `tests/phase-07/magic-sheet-tab.spec.tsx` — sheet tab smoke

(No framework install needed — Vitest already configured.)

---

## Project Constraints (from CLAUDE.md)

- **Stack lock**: TypeScript 5.9.2 strict, React 19.2.3, Vite 8.0.3, TanStack Router 1.147.0, Zustand 5.0.10, Zod 4.3.5, Vitest 4.0.16. **Do not introduce new runtime dependencies.**
- **Pure rules engine**: `packages/rules-engine` may not import React or browser APIs. (See `## Prescriptive Shape` in CLAUDE.md.)
- **Validation contract shape**: `{ valid, errors[], warnings[], derivedStats, allowedChoices }` — but the codebase has converged on `ValidationOutcome` discriminated union (`legal`/`illegal`/`blocked` + `blockKind`). Phase 7 must extend the existing pattern, not introduce CLAUDE.md's earlier shape.
- **Deterministic, framework-agnostic core**: No React hooks, no browser APIs, no mutable singleton state in validation core.
- **Zod boundary discipline**: Use Zod only at boundaries (already validated for `compiled-domains.ts` + `compiled-spells.ts` at import). Do NOT add Zod inside rules engine evaluation.
- **No Next.js / SSR / TanStack Query for core data**: Static planner.
- **Server data source**: Always extracted from nwsync/BIF; never hardcoded NWN data [`MEMORY.md:feedback_check_game_rules.md`].
- **Catalog completeness aware**: Per `MEMORY.md:project_data_gap.md` "Planner catalogs are 10% placeholders; extractor must precede feature phases" — Phase 05.1 closed the worst gaps but spell descriptions + domain granted-feats remain [VERIFIED: this research document]. Plans must fail-closed on missing data per VALI-04.
- **Spanish-first UI**: All user-visible strings Spanish. Names/descriptions from compiled catalogs; legality strings from `lib/copy/es.ts`.
- **GSD workflow enforcement**: Implementation work goes through `/gsd:execute-phase`, not direct edits.
- **Strict server validation**: Illegal builds blocked, not warned (CLAUDE.md "Rules Fidelity").
- **Level range 1-16**: Plans must respect `PROGRESSION_LEVEL_CAP = 16` from `apps/planner/src/features/level-progression/progression-fixture.ts:5`.

---

## Sources

### Primary (HIGH confidence — codebase verification)

- `apps/planner/src/data/compiled-spells.ts` — 376 spells, all with empty descriptions [VERIFIED via Grep]
- `apps/planner/src/data/compiled-domains.ts` — 27 domains, all with empty grantedFeatIds [VERIFIED via Grep]
- `apps/planner/src/data/compiled-classes.ts` — 41 classes, 14 spellCaster=true, 13 with spell gain table refs [VERIFIED via Grep]
- `packages/data-extractor/src/contracts/spell-catalog.ts` — Zod schema source of truth
- `packages/data-extractor/src/contracts/domain-catalog.ts` — Zod schema source of truth
- `packages/data-extractor/src/contracts/class-catalog.ts` — Zod schema source of truth
- `packages/data-extractor/src/assemblers/spell-assembler.ts` — extractor logic, including the asymmetric warning bug at lines 181-183
- `packages/data-extractor/src/assemblers/domain-assembler.ts` — extractor logic
- `packages/data-extractor/extraction-report.txt` — most recent extraction record (2026-04-15)
- `packages/rules-engine/src/feats/feat-prerequisite.ts` — pattern source for `evaluateSpellPrerequisites`
- `packages/rules-engine/src/feats/feat-revalidation.ts` — pattern source for cascade
- `packages/rules-engine/src/feats/bab-calculator.ts` — pattern source for per-class flooring
- `packages/rules-engine/src/skills/skill-revalidation.ts` — second cascade reference
- `packages/rules-engine/src/contracts/validation-outcome.ts` — discriminated union to reuse
- `packages/rules-engine/src/contracts/canonical-id.ts` — `EntityKind` includes `'spell'`, `'domain'`
- `apps/planner/src/features/feats/selectors.ts` — `computeBuildStateAtLevel` pattern + multi-store composition
- `apps/planner/src/features/feats/store.ts` — per-level zustand store pattern
- `apps/planner/src/state/planner-shell.ts` — `PlannerValidationStatus` to extend
- `apps/planner/src/lib/sections.ts` — `LevelSubStep` union (already includes `'spells'`)
- `apps/planner/src/components/shell/center-content.tsx:31-32` — placeholder to replace
- `apps/planner/src/components/shell/character-sheet.tsx:106-111` — `SpellsPanel` placeholder to replace
- `apps/planner/src/lib/copy/es.ts` — copy namespace to extend
- `vitest.config.ts` — test framework config (`.spec.ts` only)
- `package.json` — dependency versions
- `.planning/phases/06-feats-proficiencies/06-01-SUMMARY.md` — feat engine precedent
- `.planning/phases/06-feats-proficiencies/06-02-SUMMARY.md` — feat UI precedent
- `.planning/phases/05.1-data-extractor-pipeline/05.1-04-SUMMARY.md` — extractor magic-related decisions
- `.planning/phases/05.1-data-extractor-pipeline/05.1-05-SUMMARY.md` — CLI orchestration

### Secondary (MEDIUM confidence — official-ish documentation)

- nwn.wiki `domains.2da` page — confirms NWN1 EE domain 2DA structure (`Level_1` through `Level_9`, `GrantedFeat`, `CastableFeat`)
- nwn.fandom.com Wizard / Bard pages — caster mechanics
- Beamdog Forums `Replacing old spells with new ones for sorcerer` — NWN1 swap behavior

### Tertiary (LOW confidence — needs validation before locking)

- WebSearch result claiming wizard learns "all cantrips" + "3 + INT mod 1st level" at L1 — needs codebase verification against `compiledSpellCatalog.spellKnownTables['class:wizard']`. **Note: wizard is `spellKnownTableRef: null` per `compiled-classes.ts:303`** — wizards have no `spellKnownTable`, only spellbook semantics. This means the "known cap" concept does not apply to wizard at all — they learn from the spellbook subject only to spellbook-size rules. Cantrip "all known" is therefore a UX pattern, not a slot-cap pattern.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already locked; no new deps
- Architecture: HIGH — three prior phases (4, 5, 6) have established the cascade + selector + store patterns to reuse
- Codebase claims: HIGH — every claim traced to file:line with Grep/Read verification
- NWN1 EE rule citations: MEDIUM — depend on community wikis + WebSearch; flagged with [ASSUMED] tags where Puerta-specific behavior is unknown
- Catalog completeness: HIGH (the gaps themselves are verified) — but the **fix path** for the gaps is MEDIUM (depends on whether OQ-1 turns out to be a TLK resolver bug or a 2DA source data limitation)
- Pitfalls: HIGH — most are inferred from the existing patterns; Pitfall 4 (cascade cycle) is the genuinely novel concern this phase introduces

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days; valid as long as extractor + compiled catalogs are not regenerated; if regenerated, re-verify catalog-completeness section)

---

## RESEARCH COMPLETE

**Phase:** 07 - Magic & Full Legality Engine
**Confidence:** HIGH for codebase + architecture; MEDIUM for NWN1/Puerta-specific rule citations (flagged as [ASSUMED])

### Key Findings

1. **Catalog completeness is the dominant Phase 7 risk, not engine architecture.** All 376 spell descriptions are empty and all 27 domain `grantedFeatIds` are empty in `compiled-spells.ts` / `compiled-domains.ts`. The extractor silently skipped these (asymmetric warning logic). Plan 07-01 must address this before UI work begins, otherwise VALI-02 (readable explanations) cannot be satisfied.

2. **Three phases (4, 5, 6) have already shipped the cascade pattern.** Phase 7's rules engine is the third instance of `*-revalidation.ts`, `*-prerequisite.ts`, and `*-eligibility.ts` — direct copies of `feats/` modules with the spell/domain catalog substituted. Innovation is unwarranted; risk is in deviation from the established pattern.

3. **The `spells` LevelSubStep slot already exists** at `apps/planner/src/lib/sections.ts:32`, routed to a placeholder at `center-content.tsx:31-32`. UI-SPEC's instruction to "add `magia`" is at odds with the codebase. Recommend keeping the existing `'spells'` identifier and using "Magia" as a display label only — avoids breaking ~20 existing tests.

4. **`BuildStateAtLevel.spellcastingLevel: 0`** is hardcoded at `apps/planner/src/features/feats/selectors.ts:209` and `packages/rules-engine/src/feats/feat-prerequisite.ts:26`. Phase 7 must replace this with a per-class `casterLevelByClass: Record<CanonicalId, number>` to support multiclass casters correctly. Feat prereq path (`minSpellLevel`) needs a derived `getMaxSpellLevelAcrossClasses` helper.

5. **Sub-step `magia` and `repair_needed` status need additive enum extensions** to `PlannerValidationStatus` and the cascade evaluator status types. UI-SPEC defines `repair_needed`; codebase does not yet have it.

6. **No new dependencies required.** Phase 7 ships entirely on existing stack (TypeScript, Zustand, Zod, Vitest, React).

7. **Three Open Questions need user clarification before final plan:** OQ-1 (extractor remediation strategy for empty descriptions), OQ-2 (wizard L1 spellbook formula — CONTEXT vs. NWN wiki disagreement), OQ-3 (sorcerer/bard swap cadence — NWN1 EE may permit free swap, contrary to D-15).

### File Created

`C:\Users\pzhly\RiderProjects\pdb-character-builder\.planning\phases\07-magic-full-legality-engine\07-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All libraries locked at known versions; no additions needed |
| Architecture | HIGH | Three prior phases established the cascade/selector/store pattern; magic is the third execution |
| Pitfalls | HIGH | Most pitfalls are inferred from existing patterns; Pitfall 4 (cascade cycle) is the only novel concern |
| Catalog Completeness | HIGH (gap verified) / MEDIUM (fix path) | Empty fields verified by Grep; remediation depends on extractor diagnosis (OQ-1) |
| NWN1 EE Rule Citations | MEDIUM | Depend on community wikis; Puerta-specific overrides unknown — flagged [ASSUMED] |

### Open Questions

1. **OQ-1:** Extractor remediation for 376 empty spell descriptions — TLK resolver bug or 2DA source gap?
2. **OQ-2:** Wizard L1 spellbook initial size formula (CONTEXT specifics may contradict NWN wiki)
3. **OQ-3:** Sorcerer/bard swap cadence — NWN1 free-swap vs. D-15's D&D 3.5 cadence
4. **OQ-4:** `repair_needed` enum addition shape
5. **OQ-5:** Domain restrictions per deity (deferred to Phase 8 — deity data NULL in current extraction)
6. **OQ-6:** Specialist wizard (school specialization) — recommend out of scope for v1

### Ready for Planning

Research complete. Planner should structure 3 plans with the catalog-completeness blocker driving Plan 07-01 scope:
- **Plan 07-01:** Rules engine module (`packages/rules-engine/src/magic/`) + extractor remediation for spell descriptions and domain granted feats + Wave 0 test scaffolding
- **Plan 07-02:** Stores, selectors, view models, and UI components (board, sheet, detail panel, level tabs, domain tiles, swap dialog)
- **Plan 07-03:** Full-build legality aggregator + shell summary severity integration + Spanish copy + character sheet tab + UI smoke verification

Sources:
- [Domain | NWNWiki | Fandom](https://nwn.fandom.com/wiki/Domain)
- [domains.2da - Neverwinter Nights 1: EE - nwn.wiki](https://nwn.wiki/display/NWN1/domains.2da)
- [Custom Spellbooks using classes.2da and spells.2da - nwn.wiki](https://nwn.wiki/display/NWN1/Custom+Spellbooks+using+classes.2da+and+spells.2da)
- [Replacing old spells with new ones for sorcerer — Beamdog Forums](https://forums.beamdog.com/discussion/17627/replacing-old-spells-with-new-ones-for-sorcerer)
- [Wizard | NWNWiki | Fandom](https://nwn.fandom.com/wiki/Wizard)
- [Bard | NWNWiki | Fandom](https://nwn.fandom.com/wiki/Bard)
